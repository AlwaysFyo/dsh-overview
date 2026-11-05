import type { ProjectState, SessionMeta, WorkbenchState } from '../model/types.ts'
import type { BatchResult } from '../model/batch.ts'
import { mockState } from './mock.ts'

/**
 * 数据接缝：dev（Vite + mock）与联调（宿主 webServer REST）共用同一接口。
 * 组件只依赖 fetchState / 派生工具，不关心数据来自哪里。
 */
export type { ProjectState, SessionMeta, WorkbenchState }

export type FetchState = () => Promise<WorkbenchState>

/**
 * dev 沙盒（vite /web/ 路径）用 mock；装进宿主后走宿主 webServer 的真实路由。
 * 不靠构建期 flag，避免 dev/prod 两套产物。
 */
const USE_MOCK =
  typeof location !== 'undefined' && location.pathname.startsWith('/web/')

export const fetchState: FetchState = async () => {
  if (USE_MOCK) return mockState()
  const res = await fetch('/dsh-overview/state', { cache: 'no-store' })
  if (!res.ok) throw new Error(`state ${res.status}`)
  return (await res.json()) as WorkbenchState
}

/** 是否运行在宿主内（决定 SSE 订阅等宿主专属行为） */
export const IS_HOSTED = typeof location !== 'undefined' && !location.pathname.startsWith('/web/')

// ---------- 会话写操作 ----------

export interface DeleteSessionResponse {
  ok: boolean
  deleted?: boolean
  skipped?: boolean
  warnings?: string[]
  removedPath?: string
  error?: string
}

/**
 * 永久删除会话：走插件自家宿主路由（宿主侧物理清理转录目录 + 缓存 + 工作区记账）。
 * 不依赖 archive-manager 的远程方法，装没装它都能删。
 */
export async function deleteSession(sessionId: string): Promise<DeleteSessionResponse> {
  if (USE_MOCK) return { ok: true, deleted: true }
  const res = await fetch('/dsh-overview/session/delete', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  })
  let body: DeleteSessionResponse
  try {
    body = (await res.json()) as DeleteSessionResponse
  } catch {
    body = { ok: false, error: `delete ${res.status}` }
  }
  if (!res.ok || !body.ok) throw new Error(body.error ?? `delete ${res.status}`)
  return body
}

// ---------- 正文检索 / 只读预览 / 批量删除（P3） ----------

export type ChatRole = 'user' | 'assistant'

export interface ContentHit {
  sessionId: string
  seq: number
  role: ChatRole
  time: number | null
  snippet: string
  ranges: Array<[number, number]>
}

export interface ContentSearchResult {
  ok: boolean
  query: string
  hits: ContentHit[]
  /** 实际扫描的转录文件数 */
  scanned: number
  /** 读取失败被跳过的会话 id */
  skipped: string[]
  /** 达到 limit 提前收手（不代表没有更多命中） */
  truncated: boolean
  error?: string
}

/**
 * 正文检索：宿主流式读转录，不建索引、不激活会话。
 * 关键词上限 200 字符（宿主侧再裁一次），所以客户端不必自己截断。
 */
export async function searchContent(
  query: string,
  options: { sessionIds?: readonly string[]; limit?: number; signal?: AbortSignal } = {},
): Promise<ContentSearchResult> {
  if (USE_MOCK) return { ok: true, query, hits: [], scanned: 0, skipped: [], truncated: false }
  const res = await fetch('/dsh-overview/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      query,
      ...(options.sessionIds ? { sessionIds: options.sessionIds } : {}),
      ...(options.limit ? { limit: options.limit } : {}),
    }),
    signal: options.signal,
  })
  let body: ContentSearchResult
  try {
    body = (await res.json()) as ContentSearchResult
  } catch {
    body = { ok: false, query, hits: [], scanned: 0, skipped: [], truncated: false, error: `search ${res.status}` }
  }
  if (!res.ok || !body.ok) throw new Error(body.error ?? `search ${res.status}`)
  return body
}

export interface PreviewMessage {
  seq: number
  role: ChatRole
  text: string
  time: number | null
  hit: boolean
}

export interface PreviewResult {
  ok: boolean
  sessionId: string
  messages: PreviewMessage[]
  scanned: number
  error?: string
}

/** 只读预览：有 query 时取命中处上下文，无 query 取最近几条 */
export async function previewSession(
  sessionId: string,
  query = '',
  signal?: AbortSignal,
): Promise<PreviewResult> {
  if (USE_MOCK) return { ok: true, sessionId, messages: [], scanned: 0 }
  const res = await fetch('/dsh-overview/preview', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId, query }),
    signal,
  })
  let body: PreviewResult
  try {
    body = (await res.json()) as PreviewResult
  } catch {
    body = { ok: false, sessionId, messages: [], scanned: 0, error: `preview ${res.status}` }
  }
  if (!res.ok || !body.ok) throw new Error(body.error ?? `preview ${res.status}`)
  return body
}

export interface BatchDeleteResult extends BatchResult {
  ok: boolean
  warnings?: string[]
  error?: string
}

/** 批量永久删除：串行执行，返回的 remaining 就是可重试的失败项 */
export async function deleteSessionsBatch(ids: readonly string[]): Promise<BatchDeleteResult> {
  if (USE_MOCK) {
    return { ok: true, requested: ids.length, succeeded: [...ids], skipped: [], failures: [], remaining: [] }
  }
  const res = await fetch('/dsh-overview/session/batch', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
  let body: BatchDeleteResult
  try {
    body = (await res.json()) as BatchDeleteResult
  } catch {
    body = {
      ok: false,
      requested: ids.length,
      succeeded: [],
      skipped: [],
      failures: [],
      remaining: [...ids],
      error: `batch ${res.status}`,
    }
  }
  if (!res.ok) throw new Error(body.error ?? `batch ${res.status}`)
  return body
}

export interface AdoptResult {
  ok: boolean
  changed?: boolean
  /** 本次写入后的「旧 cwd → workspaceId」映射 */
  aliases?: Record<string, string>
  path?: string
  error?: string
  refreshError?: string
}

/**
 * 并入工作区：把一条旧 cwd 记进插件自己的归属表（项目改名/搬迁后的补救）。
 *
 * 注意写的是插件数据（`~/.dsh/storages/dsh-overview-aliases.json`），不是宿主 workspace.json：
 * 宿主成员表在读取时就过滤 cwd 不匹配的会话，文件里追加 id 反而会被宿主下一次写入抹掉。
 * `forget` 用于撤销。
 */
export async function adoptSessions(
  workspaceId: string,
  cwd: string,
  options: { forget?: boolean } = {},
): Promise<AdoptResult> {
  if (USE_MOCK) return { ok: true, changed: true, aliases: {} }
  const res = await fetch('/dsh-overview/session/adopt', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ workspaceId, cwd, forget: options.forget === true }),
  })
  let body: AdoptResult
  try {
    body = (await res.json()) as AdoptResult
  } catch {
    body = { ok: false, error: `adopt ${res.status}` }
  }
  if (!res.ok || !body.ok) throw new Error(body.error ?? `adopt ${res.status}`)
  return body
}

export interface MigrateResult extends BatchResult {
  ok: boolean
  refreshError?: string
  workspace?: { id: string; path: string; title: string }
  addedSessionIds?: string[]
  warnings?: string[]
  error?: string
}

/**
 * 迁移（P4）：把会话真正搬到目标工作区 —— 改写转录头里的 cwd + 搬目录。
 *
 * 与「并入」的区别：并入只改插件的归属表，宿主侧栏仍显示「未分组」；迁移改了宿主认的
 * cwd，重启后宿主侧栏里会话就在该工作区下了。代价是写宿主转录文件（逐条备份到
 * `~/.dsh/storages/dsh-overview-migration-backup/<ts>-<id>/`），所以必须由用户显式点。
 */
export async function migrateSessions(workspaceId: string, sessionIds: readonly string[]): Promise<MigrateResult> {
  if (USE_MOCK) {
    return { ok: true, requested: sessionIds.length, succeeded: [...sessionIds], skipped: [], failures: [], remaining: [] }
  }
  const res = await fetch('/dsh-overview/session/migrate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ workspaceId, sessionIds: [...sessionIds] }),
  })
  let body: MigrateResult
  try {
    body = (await res.json()) as MigrateResult
  } catch {
    body = { ok: false, requested: 0, succeeded: [], skipped: [], failures: [], remaining: [], error: `migrate ${res.status}` }
  }
  if (!res.ok) throw new Error(body.error ?? `migrate ${res.status}`)
  return body
}

// ---------- 派生工具（L1/L2 共用的口径，集中在一处避免口径漂移） ----------

/** 2 小时内有活动视为"运行中"——仅在客户端会话快照未就绪时（dev mock/CLI）兜底 */
export const RUNNING_WINDOW_MS = 2 * 3600_000

export interface SessionGroups {
  running: SessionMeta[]
  history: SessionMeta[]
  archived: SessionMeta[]
}

/** PRD R3 三 tab 口径：进行中 / 历史 / 归档。liveIds = 运行中真源（客户端会话快照，见 liveness.ts） */
export function splitSessions(project: ProjectState, now = Date.now(), liveIds?: readonly string[] | null): SessionGroups {
  const live = liveIds ? new Set(liveIds) : null
  const running: SessionMeta[] = []
  const history: SessionMeta[] = []
  const archived: SessionMeta[] = []
  for (const s of project.sessions) {
    if (s.archived) archived.push(s)
    else if (live ? live.has(s.id) : s.lastActivityAt !== null && now - s.lastActivityAt <= RUNNING_WINDOW_MS)
      running.push(s)
    else history.push(s)
  }
  return { running, history, archived }
}

/** L1 卡片状态点：运行中 / 空闲（7 天内）/ 沉寂 */
export type ProjectLiveness = 'running' | 'idle' | 'quiet'

export function projectLiveness(project: ProjectState, now = Date.now(), liveIds?: readonly string[] | null): ProjectLiveness {
  if (project.archived) return 'quiet'
  if (liveIds) {
    if (project.sessions.some((s) => !s.archived && liveIds.includes(s.id))) return 'running'
    const last = project.lastActivityAt
    if (last !== null && now - last <= 7 * 24 * 3600_000) return 'idle'
    return 'quiet'
  }
  const last = project.lastActivityAt
  if (last !== null && now - last <= RUNNING_WINDOW_MS) return 'running'
  if (last !== null && now - last <= 7 * 24 * 3600_000) return 'idle'
  return 'quiet'
}

/** 单据待办里未完成的条目数（R6：rows.todos.val 解析结果） */
export function todoCount(session: SessionMeta): number {
  return session.todos.filter((t) => t.status !== 'completed').length
}

export function projectTodoCount(project: ProjectState): number {
  return project.sessions.reduce((sum, s) => sum + todoCount(s), 0)
}

export interface ProjectTodo {
  sessionId: string
  sessionTitle: string | null
  content: string
  status: string
}

/** 项目待办明细：按会话分组展开，未完成的排前面（Detail 侧栏用） */
export function projectTodos(project: ProjectState, limit = 20): ProjectTodo[] {
  const rows: ProjectTodo[] = []
  for (const s of project.sessions) {
    for (const t of s.todos) {
      if (t.status === 'completed') continue
      rows.push({ sessionId: s.id, sessionTitle: s.title, content: t.content, status: t.status })
    }
  }
  rows.sort((a, b) => (a.status === 'in_progress' ? -1 : 0) - (b.status === 'in_progress' ? -1 : 0))
  return rows.slice(0, limit)
}
