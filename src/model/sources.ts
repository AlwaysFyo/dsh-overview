import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { StringDecoder } from 'node:string_decoder'
import { zstdDecompressSync } from 'node:zlib'
import type { ProjcacheRecord, SessionFileInfo, SessionHead } from './types.ts'

/**
 * 四个数据源的容错读取器。
 * 约定：单个文件/目录损坏不抛出，记入 warnings 并跳过（PRD R5：不白屏、不阻断宿主）。
 */

export interface SourceResult<T> {
  data: T
  warnings: string[]
}

/** 1. workspace.json → 工作区列表 */
export interface WorkspaceEntry {
  id: string
  path: string
  title: string
  sessionIds: string[]
  createdAt: number | null
  updatedAt: number | null
}

export function readWorkspaces(file: string): SourceResult<WorkspaceEntry[]> {
  const warnings: string[] = []
  if (!existsSync(file)) {
    return { data: [], warnings: [`workspace.json 不存在: ${file}`] }
  }
  try {
    const raw = JSON.parse(readFileSync(file, 'utf-8')) as {
      tables?: { workspaces?: Record<string, unknown> }
    }
    const table = raw.tables?.workspaces ?? {}
    const data = Object.entries(table).map(([id, v]) => {
      const w = v as Record<string, unknown>
      return {
        id,
        path: String(w['path'] ?? ''),
        title: String(w['title'] ?? id),
        sessionIds: Array.isArray(w['sessionIds']) ? (w['sessionIds'] as string[]) : [],
        createdAt: typeof w['createdAt'] === 'string' ? Date.parse(w['createdAt']) : null,
        updatedAt: typeof w['updatedAt'] === 'string' ? Date.parse(w['updatedAt']) : null,
      }
    })
    return { data, warnings }
  } catch (err) {
    warnings.push(`workspace.json 解析失败: ${(err as Error).message}`)
    return { data: [], warnings }
  }
}

/**
 * 1b. workspace.json → global.archivedSessionIds（归档真相）
 *
 * 归档状态只存在于宿主 workspace 域的 global 表里；session_projcache_archive_manager_v2
 * 目录是投影缓存快照，会保留历史遗留记录，不能当作「当前已归档」的依据
 * （参考实现 @michengai/dsh-archive-manager 也用 workspaceState.archivedSessionIds 判归档）。
 */
export function readHostArchivedIds(file: string): SourceResult<string[]> {
  const warnings: string[] = []
  if (!existsSync(file)) return { data: [], warnings } // 缺失由 readWorkspaces 统一告警
  try {
    const raw = JSON.parse(readFileSync(file, 'utf-8')) as {
      global?: { archivedSessionIds?: unknown }
    }
    const ids = raw.global?.archivedSessionIds
    return {
      data: Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [],
      warnings,
    }
  } catch (err) {
    warnings.push(`workspace.json 归档集合解析失败: ${(err as Error).message}`)
    return { data: [], warnings }
  }
}

/** 2. session_projcache/sessions/*.json → 元数据记录列表 */
export function readProjcacheRecords(dir: string): SourceResult<ProjcacheRecord[]> {
  const warnings: string[] = []
  if (!existsSync(dir)) {
    return { data: [], warnings: [`projcache 目录不存在: ${dir}`] }
  }
  const data: ProjcacheRecord[] = []
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.json')) continue
    try {
      const parsed = JSON.parse(readFileSync(join(dir, name), 'utf-8')) as ProjcacheRecord
      if (parsed?.record?.identity) data.push(parsed)
    } catch (err) {
      warnings.push(`projcache 文件跳过 ${name}: ${(err as Error).message}`)
    }
  }
  return { data, warnings }
}

/** 3. 归档缓存 → 同结构记录（含 record.sessionId） */
export function readArchiveRecords(dir: string): SourceResult<ProjcacheRecord[]> {
  const warnings: string[] = []
  if (!existsSync(dir)) {
    return { data: [], warnings: [] } // 无归档是正常态，不告警
  }
  const data: ProjcacheRecord[] = []
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.json')) continue
    try {
      const parsed = JSON.parse(readFileSync(join(dir, name), 'utf-8')) as ProjcacheRecord
      if (parsed?.record?.identity) data.push(parsed)
    } catch (err) {
      warnings.push(`归档记录跳过 ${name}: ${(err as Error).message}`)
    }
  }
  return { data, warnings }
}

/**
 * 会话头解析缓存：键为文件绝对路径，值为 (size:mtime) 指纹 + 解析结果。
 *
 * 为什么需要：转录文件是 zstd 压缩的整段 jsonl，而头部只需要第一行。
 * 实测本机 47 个会话共 58 MB（单文件最大 13.5 MB），每次整文件解压约 520 ms，
 * 且跑在宿主事件循环上（watch 回调）。宿主会周期性重写投影缓存并触发重建，
 * 未变化的文件必须按指纹跳过，否则每次重建都在重复解压同一批大文件。
 *
 * 冷启动仍要读全部文件，但改为流式解压、读到首个换行就掐断：zstd 帧无法
 * 「截断后解码」（sync API 会抛 Z_BUF_ERROR），必须走流式解压器才能只付前几 KB 的代价。
 */
interface HeadCacheEntry {
  key: string
  info: SessionFileInfo | null
}
const headCache = new Map<string, HeadCacheEntry>()

/** 无标题会话的首条 user 消息兜底缓存（同指纹失效策略） */
interface PreviewCacheEntry {
  key: string
  probe: SessionProbe
}
const previewCache = new Map<string, PreviewCacheEntry>()

const ZSTD_MAGIC = 0xfd2fb528
const ZSTD_SKIPPABLE_MASK = 0xfffffff0
const ZSTD_SKIPPABLE_MAGIC = 0x184d2a50
/** 单帧体积上限：超过说明帧头解析走进了死循环，宁可报错也不要吃光内存 */
const MAX_PENDING_BYTES = 64 * 1024 * 1024

/**
 * 量出一个 zstd 帧的结束偏移。
 * 返回 null 表示数据还不够（需要继续读），返回 -1 表示这段不是合法的 zstd 帧。
 * 为什么手写：宿主写转录用的是「每次 append 一帧」，一份 14MB 文件能有 10770 帧
 * （实测），而 createZstdDecompress 的流在某些 Node 版本上解完第一帧就 end，
 * 于是只拿到首行头 —— 预览空白、正文 0 命中、标题兜底失效都由此而来。
 */
export function zstdFrameEnd(buf: Buffer, start: number): number | null | -1 {
  if (buf.length - start < 4) return null
  const magic = buf.readUInt32LE(start)
  if ((magic & ZSTD_SKIPPABLE_MASK) === ZSTD_SKIPPABLE_MAGIC) {
    if (buf.length - start < 8) return null
    const end = start + 8 + buf.readUInt32LE(start + 4)
    return end <= buf.length ? end : null
  }
  if (magic !== ZSTD_MAGIC) return -1
  if (buf.length - start < 6) return null
  let p = start + 4
  const fhd = buf[p] ?? 0
  p += 1
  const singleSegment = (fhd >> 5) & 1
  const hasChecksum = (fhd >> 2) & 1
  const dictFlag = fhd & 3
  const fcsFlag = (fhd >> 6) & 3
  if (!singleSegment) p += 1
  p += [0, 1, 2, 4][dictFlag] ?? 0
  p += fcsFlag === 0 ? (singleSegment ? 1 : 0) : [0, 2, 4, 8][fcsFlag] ?? 0
  for (;;) {
    if (buf.length - p < 3) return null
    const v = (buf[p] ?? 0) | ((buf[p + 1] ?? 0) << 8) | ((buf[p + 2] ?? 0) << 16)
    const last = v & 1
    const type = (v >> 1) & 3
    const size = v >>> 3
    if (type === 3) return -1
    p += 3 + (type === 1 ? 1 : size)
    if (last) break
  }
  if (hasChecksum) p += 4
  return p <= buf.length ? p : null
}

/**
 * 按行流式读取 JSONL 转录；onLine 返回 false 立即停止（省掉剩余解压）。
 * 同时支持多帧 zstd（宿主形态）与未压缩 jsonl（手工放进去的文件）。
 */
export function streamLines(file: string, onLine: (line: string) => boolean | void): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const rs = createReadStream(file, { highWaterMark: 64 * 1024 })
    const decoder = new StringDecoder('utf8')
    let pending: Buffer = Buffer.alloc(0)
    let text = ''
    let mode: 'unknown' | 'zstd' | 'plain' = 'unknown'
    let settled = false
    const finish = (err?: Error) => {
      if (settled) return
      settled = true
      rs.destroy()
      if (err) reject(err)
      else resolve()
    }
    const consume = (chunk: string): boolean => {
      text += chunk
      let nl = text.indexOf('\n')
      while (nl >= 0) {
        const line = text.slice(0, nl)
        text = text.slice(nl + 1)
        if (onLine(line) === false) return false
        nl = text.indexOf('\n')
      }
      return true
    }
    /** 把 pending 里所有完整帧解压并吃掉；返回 false 表示调用方要求停止 */
    const drainZstd = (): boolean => {
      let off = 0
      let out = ''
      for (;;) {
        const end = zstdFrameEnd(pending, off)
        if (end === null) break
        if (end === -1) throw new Error(`zstd 帧损坏: ${file}`)
        const frame = pending.subarray(off, end)
        const magic = frame.readUInt32LE(0)
        // skippable 帧是元数据（比如字典、拼接标记），直接跳过
        if ((magic & ZSTD_SKIPPABLE_MASK) !== ZSTD_SKIPPABLE_MAGIC) {
          // 一帧一解：不依赖宿主 Node 是否支持「一次解多帧」的语义
          out += zstdDecompressSync(frame).toString('utf8')
        }
        off = end
      }
      if (off === 0) return true
      pending = pending.subarray(off)
      return consume(out)
    }
    rs.on('data', (chunk: Buffer) => {
      if (settled) return
      try {
        pending = pending.length === 0 ? chunk : Buffer.concat([pending, chunk])
        if (pending.length > MAX_PENDING_BYTES) {
          finish(new Error(`zstd 帧过大，疑似解析错误: ${file}`))
          return
        }
        if (mode === 'unknown') {
          if (pending.length < 4) return
          const magic = pending.readUInt32LE(0)
          mode =
            magic === ZSTD_MAGIC || (magic & ZSTD_SKIPPABLE_MASK) === ZSTD_SKIPPABLE_MAGIC
              ? 'zstd'
              : 'plain'
        }
        if (mode === 'plain') {
          const raw = pending
          pending = Buffer.alloc(0)
          if (!consume(decoder.write(raw))) finish()
          return
        }
        if (!drainZstd()) finish()
      } catch (err) {
        finish(err as Error)
      }
    })
    rs.on('end', () => {
      if (settled) return
      try {
        if (mode === 'plain') {
          consume(decoder.end())
        } else if (mode === 'zstd') {
          // 尾部若还剩不完整字节，说明文件被截断：能解多少解多少，剩余丢弃
          if (!drainZstd()) {
            finish()
            return
          }
        }
        if (text) onLine(text)
        finish()
      } catch (err) {
        finish(err as Error)
      }
    })
    rs.on('error', (err) => finish(err as Error))
  })
}

/** 只读第一行（会话头）：流式解压到首个换行即停，不再整文件解压 */
async function readFirstLine(file: string): Promise<string> {
  let first: string | null = null
  await streamLines(file, (line) => {
    first = line
    return false
  })
  if (first === null) throw new Error('empty session file')
  return first
}

/** 从一条 user/message 事件里取首段文本（宿主事件形态：data.content[].type==='text'） */
function userTextFromEvent(line: string): string | null {
  if (!line.includes('user/message')) return null
  let evt: { type?: string; data?: { content?: unknown } }
  try {
    evt = JSON.parse(line) as typeof evt
  } catch {
    return null
  }
  if (evt.type !== 'user/message' || !Array.isArray(evt.data?.content)) return null
  const text = (evt.data!.content as Array<{ type?: string; text?: unknown }>)
    .filter((part) => part?.type === 'text' && typeof part.text === 'string')
    .map((part) => String(part.text))
    .join(' ')
    .trim()
  return text || null
}

/** 首条用户消息 → 单行短标题（折叠空白、限长） */
function shorten(text: string, max = 60): string {
  const oneLine = text.replace(/\s+/g, ' ').trim()
  return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine
}

/** 首条 user 消息的扫描上限（超过就放弃，结论只能是「没扫到」） */
const TITLE_SCAN_LIMIT = 2 * 1024 * 1024

export interface SessionProbe {
  /** 首条 user/message 的缩短文本；没有就是 null */
  title: string | null
  /** 扫过的范围里是否出现过 user/message 或 assistant/message */
  hasMessages: boolean
  /** 是否读到文件末尾；false = 命中扫描上限，「没扫到消息」不等于「没有消息」 */
  complete: boolean
}

/**
 * 扫前 2 MB 解压内容：取首条 user 消息当标题，并顺带回答「这个会话到底有没有对话」。
 *
 * 后一个问题的来源：宿主新建会话时会立刻落一个只有头 + 权限/沙箱事件的转录（实测 318 B、4 行），
 * 切走后宿主把它从会话列表里摘掉，但**磁盘上的目录不删**。全景概览读的是磁盘，
 * 于是会显示这批宿主自己都不再列出的空会话——判定依据就是这里扫到的 hasMessages。
 */
export async function probeSessionFile(file: string): Promise<SessionProbe> {
  const unknown: SessionProbe = { title: null, hasMessages: false, complete: false }
  let key = ''
  try {
    const st = statSync(file)
    key = `${st.size}:${Math.round(st.mtimeMs)}`
    const cached = previewCache.get(file)
    if (cached && cached.key === key) return cached.probe
  } catch {
    return unknown
  }
  let scanned = 0
  let title: string | null = null
  let hasMessages = false
  let complete = true
  try {
    await streamLines(file, (line) => {
      scanned += line.length + 1
      if (scanned > TITLE_SCAN_LIMIT) {
        complete = false
        return false
      }
      if (line.startsWith('{"type":"user/message"') || line.startsWith('{"type":"assistant/message"')) {
        hasMessages = true
      }
      const text = userTextFromEvent(line)
      if (text) {
        title = shorten(text)
        return false
      }
    })
  } catch {
    return unknown
  }
  const probe: SessionProbe = { title, hasMessages, complete }
  previewCache.set(file, { key, probe })
  return probe
}

/** 4. sessions/<slug>/<dir>/session.v4.jsonl.zstd → 会话头 + 文件 mtime（异步流式） */
export async function readSessionHeads(root: string): Promise<SourceResult<SessionFileInfo[]>> {
  const warnings: string[] = []
  if (!existsSync(root)) {
    return { data: [], warnings: [`sessions 目录不存在: ${root}`] }
  }
  const seen = new Set<string>()
  const files: Array<{ rel: string; file: string; size: number; mtimeMs: number }> = []
  for (const slug of readdirSync(root)) {
    const slugPath = join(root, slug)
    if (!statSync(slugPath).isDirectory()) continue
    for (const dir of readdirSync(slugPath)) {
      const file = join(slugPath, dir, 'session.v4.jsonl.zstd')
      if (!existsSync(file)) continue
      seen.add(file)
      try {
        const st = statSync(file)
        files.push({ rel: `${slug}/${dir}`, file, size: st.size, mtimeMs: st.mtimeMs })
      } catch (err) {
        warnings.push(`会话文件跳过 ${slug}/${dir}: ${(err as Error).message}`)
      }
    }
  }

  const data: SessionFileInfo[] = []
  // 小并发：冷启动时多个大文件并行解压首行，避免串行累加 IO 等待
  const CONCURRENCY = 8
  let cursor = 0
  const worker = async (): Promise<void> => {
    while (cursor < files.length) {
      const entry = files[cursor++]!
      const fingerprint = `${entry.size}:${Math.round(entry.mtimeMs)}`
      const cached = headCache.get(entry.file)
      if (cached && cached.key === fingerprint) {
        if (cached.info) data.push({ ...cached.info, fileMtime: entry.mtimeMs, size: entry.size })
        continue
      }
      try {
        const head = JSON.parse(await readFirstLine(entry.file)) as SessionHead
        if (typeof head?.id === 'string' && typeof head?.createdAt === 'number') {
          const info: SessionFileInfo = {
            dirName: entry.rel,
            file: entry.file,
            head,
            fileMtime: entry.mtimeMs,
            size: entry.size,
          }
          headCache.set(entry.file, { key: fingerprint, info })
          data.push(info)
        } else {
          headCache.set(entry.file, { key: fingerprint, info: null })
          warnings.push(`会话头字段缺失: ${entry.rel}`)
        }
      } catch (err) {
        headCache.set(entry.file, { key: fingerprint, info: null })
        warnings.push(`会话文件跳过 ${entry.rel}: ${(err as Error).message}`)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, files.length) }, worker))

  // 已删除的会话文件不留缓存
  for (const cachedPath of headCache.keys()) {
    if (!seen.has(cachedPath)) headCache.delete(cachedPath)
  }
  for (const cachedPath of previewCache.keys()) {
    if (!seen.has(cachedPath)) previewCache.delete(cachedPath)
  }
  return { data, warnings }
}
