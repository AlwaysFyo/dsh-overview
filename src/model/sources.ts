import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { StringDecoder } from 'node:string_decoder'
import { createZstdDecompress } from 'node:zlib'
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
  title: string | null
}
const previewCache = new Map<string, PreviewCacheEntry>()

/** 测试用：清空缓存（避免跨用例串味） */
export function clearSessionHeadCache(): void {
  headCache.clear()
  previewCache.clear()
}

/** 按行流式解压 zstd JSONL；onLine 返回 false 立即停止（省掉剩余解压） */
function streamLines(file: string, onLine: (line: string) => boolean | void): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const rs = createReadStream(file, { highWaterMark: 64 * 1024 })
    const zs = createZstdDecompress()
    const decoder = new StringDecoder('utf8')
    let pending = ''
    let settled = false
    const finish = (err?: Error) => {
      if (settled) return
      settled = true
      rs.destroy()
      zs.destroy()
      if (err) reject(err)
      else resolve()
    }
    const consume = (text: string): boolean => {
      pending += text
      let nl = pending.indexOf('\n')
      while (nl >= 0) {
        const line = pending.slice(0, nl)
        pending = pending.slice(nl + 1)
        if (onLine(line) === false) return false
        nl = pending.indexOf('\n')
      }
      return true
    }
    zs.on('data', (chunk: Buffer) => {
      if (settled) return
      try {
        if (!consume(decoder.write(chunk))) finish()
      } catch (err) {
        finish(err as Error)
      }
    })
    zs.on('end', () => {
      if (settled) return
      try {
        consume(decoder.end())
        if (pending) onLine(pending)
        finish()
      } catch (err) {
        finish(err as Error)
      }
    })
    zs.on('error', (err) => finish(err as Error))
    rs.on('error', (err) => finish(err as Error))
    rs.pipe(zs)
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

/**
 * 无 projcache 标题时的兜底：流式扫描前 2 MB 解压内容，找首条 user/message。
 * 找不到（或格式不认识）返回 null，UI 仍显示「(无标题)」。
 */
export async function readSessionTitleFallback(file: string): Promise<string | null> {
  let key = ''
  try {
    const st = statSync(file)
    key = `${st.size}:${Math.round(st.mtimeMs)}`
    const cached = previewCache.get(file)
    if (cached && cached.key === key) return cached.title
  } catch {
    return null
  }
  let scanned = 0
  let title: string | null = null
  try {
    await streamLines(file, (line) => {
      scanned += line.length + 1
      if (scanned > 2 * 1024 * 1024) return false
      const text = userTextFromEvent(line)
      if (text) {
        title = shorten(text)
        return false
      }
    })
  } catch {
    title = null
  }
  previewCache.set(file, { key, title })
  return title
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
        if (cached.info) data.push({ ...cached.info, fileMtime: entry.mtimeMs })
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
