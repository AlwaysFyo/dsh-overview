import { streamLines } from './sources.ts'

/**
 * 会话正文检索与只读预览（P3-a）。
 *
 * 口径参考 @michengai/dsh-archive-manager 的 archive-discovery：
 *  - 只取「人说的话」：user/message 且 data.source.kind === 'user'、assistant/message；
 *    工具输出、插件注入（runtime context / system-reminder）、推理块一律不参与匹配；
 *  - 不建索引、不落盘、不调模型：每次检索都是流式读转录，读完即弃；
 *  - 大小写折叠在码元级完成（CJK 无大小写，但英文路径/标识符需要），
 *    片段按码元切片且不切断代理对，避免 emoji 变成半个字符。
 */

export interface ContentMessage {
  seq: number
  role: 'user' | 'assistant'
  text: string
  time: number | null
}

export interface ContentHit {
  sessionId: string
  seq: number
  role: 'user' | 'assistant'
  time: number | null
  /** 单行片段（≤ SNIPPET_CHARS 码元） */
  snippet: string
  /** snippet 内的命中区间（码元，左闭右开），可能多段 */
  ranges: Array<[number, number]>
}

export interface PreviewMessage extends ContentMessage {
  /** 是否命中本次查询 */
  hit: boolean
}

/** 片段上限（参考实现同口径：单条命中最多 200 字符） */
export const SNIPPET_CHARS = 200
/** 命中前的上下文长度 */
const SNIPPET_LEAD = 40
/** 单条消息参与匹配的文本上限（超长粘贴截断，避免整段 JSON 撑爆内存） */
const MAX_MATCH_CHARS = 20_000
/** 每批串行扫描的会话数（参考实现 20） */
export const SEARCH_BATCH_SIZE = 20

function isHighSurrogate(code: number): boolean {
  return code >= 0xd800 && code <= 0xdbff
}

function isLowSurrogate(code: number): boolean {
  return code >= 0xdc00 && code <= 0xdfff
}

/** 码元切片，边界落在代理对中间时向外扩一格 */
function wholeChars(text: string, start: number, end: number): string {
  let s = Math.max(0, start)
  let e = Math.min(text.length, end)
  if (s > 0 && s < text.length && isLowSurrogate(text.charCodeAt(s))) s -= 1
  if (e > 0 && e < text.length && isLowSurrogate(text.charCodeAt(e))) e += 1
  return text.slice(s, e)
}

interface Folded {
  folded: string
  /** folded 中每个码元对应的原文码元下标（长度与 folded 相同） */
  map: number[]
}

/** 逐码元小写折叠；单个码元可能折叠成多个（少数语言），因此要带下标映射 */
function fold(text: string): Folded {
  let folded = ''
  const map: number[] = []
  for (let i = 0; i < text.length; i += 1) {
    const lower = text[i]!.toLowerCase()
    for (let k = 0; k < lower.length; k += 1) {
      folded += lower[k]
      map.push(i)
    }
  }
  return { folded, map }
}

/** 把空白折叠成单个空格：转录里的换行/缩进对摘要没有信息量 */
function flatten(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function textOfParts(parts: unknown): string {
  if (!Array.isArray(parts)) return ''
  const out: string[] = []
  for (const part of parts as Array<{ type?: string; text?: unknown }>) {
    if (part?.type === 'text' && typeof part.text === 'string' && part.text) out.push(part.text)
  }
  return out.join('\n')
}

function eventTime(evt: { time?: unknown }): number | null {
  return typeof evt.time === 'number' ? evt.time : null
}

/** 解析一条转录事件为消息；非消息事件、工具消息、注入消息返回 null */
export function parseMessageLine(line: string): ContentMessage | null {
  // 廉价预筛：整行 JSON.parse 前先看类型关键字（大文件里 90% 是 tool/step 事件）
  if (!line.includes('/message')) return null
  let evt: {
    type?: string
    seq?: unknown
    time?: unknown
    data?: {
      role?: unknown
      source?: { kind?: unknown }
      content?: unknown
      message?: { role?: unknown; content?: unknown }
    }
  }
  try {
    evt = JSON.parse(line)
  } catch {
    return null
  }
  const seq = typeof evt.seq === 'number' ? evt.seq : -1
  if (evt.type === 'user/message') {
    if (evt.data?.role !== 'user') return null
    // 只认真人输入：runtime context / system-reminder / 插件注入都是别的 kind
    if (evt.data?.source?.kind !== 'user') return null
    const text = textOfParts(evt.data.content)
    return text ? { seq, role: 'user', text, time: eventTime(evt) } : null
  }
  if (evt.type === 'assistant/message') {
    if (evt.data?.message?.role !== 'assistant') return null
    const text = textOfParts(evt.data.message.content)
    return text ? { seq, role: 'assistant', text, time: eventTime(evt) } : null
  }
  return null
}

/** 大小写折叠后的匹配区间（元文字下标，左闭右开） */
export function matchRanges(text: string, query: string): Array<[number, number]> {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const { folded, map } = fold(text)
  const out: Array<[number, number]> = []
  let cursor = 0
  while (cursor <= folded.length - q.length) {
    const idx = folded.indexOf(q, cursor)
    if (idx < 0) break
    const start = map[idx] ?? 0
    const end = (map[idx + q.length - 1] ?? start) + 1
    out.push([start, end])
    cursor = idx + q.length
  }
  return out
}

/** 命中片段：命中点前留 40 码元上下文，总长不超过 200 码元 */
function snippetOf(text: string, query: string): { snippet: string; ranges: Array<[number, number]> } {
  const flat = flatten(text).slice(0, MAX_MATCH_CHARS)
  const hits = matchRanges(flat, query)
  if (hits.length === 0) return { snippet: flat.slice(0, SNIPPET_CHARS), ranges: [] }
  const first = hits[0]!
  const qLen = Math.max(1, query.trim().length)
  const start = Math.max(0, first[0] - SNIPPET_LEAD)
  const end = Math.min(flat.length, start + SNIPPET_CHARS)
  const raw = wholeChars(flat, start, end)
  // 切片可能吃掉左侧的空格，重算区间比平移更稳
  const shifted = raw.trimStart()
  const prefix = `${start > 0 ? '…' : ''}${shifted}${end < flat.length ? '…' : ''}`
  return { snippet: prefix, ranges: matchRanges(prefix, query) }
}

export interface SessionFileRef {
  sessionId: string
  file: string
}

export interface SessionSearchOptions {
  query: string
  /** 每个会话最多保留多少条命中 */
  perSession?: number
  /** 总共最多返回多少条命中 */
  limit?: number
  signal?: AbortSignal
  onProgress?: (done: number, total: number) => void
}

export interface SessionSearchResult {
  hits: ContentHit[]
  /** 实际扫描过的会话数 */
  scanned: number
  /** 因读失败/超时跳过的会话 */
  skipped: string[]
  /** 是否有会话没扫完（达到 limit 或取消） */
  truncated: boolean
}

/** 单会话正文检索：流式扫描，命中达到上限立刻停止解压 */
export async function searchSessionContent(
  ref: SessionFileRef,
  query: string,
  perSession = 20,
  signal?: AbortSignal,
): Promise<ContentHit[]> {
  const q = query.trim()
  if (!q) return []
  const hits: ContentHit[] = []
  await streamLines(ref.file, (line) => {
    if (signal?.aborted) return false
    const msg = parseMessageLine(line)
    if (!msg) return
    if (!msg.text.slice(0, MAX_MATCH_CHARS).toLowerCase().includes(q.toLowerCase())) return
    const { snippet, ranges } = snippetOf(msg.text, q)
    hits.push({ sessionId: ref.sessionId, seq: msg.seq, role: msg.role, time: msg.time, snippet, ranges })
    return hits.length < perSession ? undefined : false
  })
  return hits
}

/**
 * 跨会话检索：**串行**按批扫描。
 * 串行不是保守，而是必须：并发解压十几个大转录会把宿主事件循环占满（详见 sources.readSessionHeads 的注释）。
 */
export async function searchAcrossSessions(
  refs: readonly SessionFileRef[],
  options: SessionSearchOptions,
): Promise<SessionSearchResult> {
  const limit = options.limit ?? 50
  const perSession = options.perSession ?? 5
  const hits: ContentHit[] = []
  const skipped: string[] = []
  let scanned = 0
  let truncated = false
  for (let i = 0; i < refs.length; i += SEARCH_BATCH_SIZE) {
    const batch = refs.slice(i, i + SEARCH_BATCH_SIZE)
    for (const ref of batch) {
      if (options.signal?.aborted || hits.length >= limit) {
        truncated = true
        break
      }
      try {
        const found = await searchSessionContent(ref, options.query, perSession, options.signal)
        hits.push(...found)
      } catch {
        skipped.push(ref.sessionId)
      }
      scanned += 1
      options.onProgress?.(scanned, refs.length)
    }
    if (truncated) break
  }
  return { hits: hits.slice(0, limit), scanned, skipped, truncated }
}

export interface PreviewResult {
  messages: PreviewMessage[]
  /** 已扫描到的消息条数（提前停止时是下界） */
  scanned: number
}

/**
 * 只读预览：有查询时取首次命中前后各 2 条（共 8 条），没有命中或无查询时取最近 8 条。
 * 单条消息截断到 2000 码元——预览是「看一眼上下文」，不是导出全文。
 */
export async function previewSessionContent(
  file: string,
  query = '',
  limit = 8,
  signal?: AbortSignal,
): Promise<PreviewResult> {
  const q = query.trim()
  const keep = limit + 4
  const buf: ContentMessage[] = []
  let seen = 0
  let hitAt: number | null = null
  await streamLines(file, (line) => {
    if (signal?.aborted) return false
    const msg = parseMessageLine(line)
    if (!msg) return
    const index = seen
    seen += 1
    buf.push(msg)
    if (buf.length > keep) buf.shift()
    if (hitAt === null && q && msg.text.slice(0, MAX_MATCH_CHARS).toLowerCase().includes(q.toLowerCase())) {
      hitAt = index
    }
    if (hitAt !== null && index >= hitAt + 2) return false
    return undefined
  })

  const base = seen - buf.length
  const window = hitAt === null ? buf : buf.filter((_, i) => {
    const at = base + i
    return at >= hitAt! - 2 && at <= hitAt! + 5
  })
  const messages = window.slice(-limit).map((m) => ({
    seq: m.seq,
    role: m.role,
    time: m.time,
    text: m.text.length > 2000 ? `${m.text.slice(0, 2000)}…` : m.text,
    hit: Boolean(q) && m.text.slice(0, MAX_MATCH_CHARS).toLowerCase().includes(q.toLowerCase()),
  }))
  return { messages, scanned: seen }
}

export { isHighSurrogate, isLowSurrogate, wholeChars }
