import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
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

/** 4. sessions/<slug>/<dir>/session.v4.jsonl.zstd → 会话头 + 文件 mtime */
export function readSessionHeads(root: string): SourceResult<SessionFileInfo[]> {
  const warnings: string[] = []
  if (!existsSync(root)) {
    return { data: [], warnings: [`sessions 目录不存在: ${root}`] }
  }
  const data: SessionFileInfo[] = []
  for (const slug of readdirSync(root)) {
    const slugPath = join(root, slug)
    if (!statSync(slugPath).isDirectory()) continue
    for (const dir of readdirSync(slugPath)) {
      const file = join(slugPath, dir, 'session.v4.jsonl.zstd')
      if (!existsSync(file)) continue
      try {
        const firstLine = zstdDecompressSync(readFileSync(file))
          .toString('utf-8')
          .split('\n')[0] ?? ''
        const head = JSON.parse(firstLine) as SessionHead
        if (typeof head?.id === 'string' && typeof head?.createdAt === 'number') {
          data.push({
            dirName: `${slug}/${dir}`,
            head,
            fileMtime: statSync(file).mtimeMs,
          })
        } else {
          warnings.push(`会话头字段缺失: ${slug}/${dir}`)
        }
      } catch (err) {
        warnings.push(`会话文件跳过 ${slug}/${dir}: ${(err as Error).message}`)
      }
    }
  }
  return { data, warnings }
}
