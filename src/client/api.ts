import type { ProjectState, SessionMeta, WorkbenchState } from '../model/types.ts'
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

// ---------- 派生工具（L1/L2 共用的口径，集中在一处避免口径漂移） ----------

/** 2 小时内有活动视为"运行中"——仅在宿主未提供 liveSessionIds 时（dev mock/CLI）兜底 */
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

/** 会话内待办计数（rows.todos.val 的内部结构待 R6 解析，当前恒 0；面板显示空态） */
export function todoCount(_session: SessionMeta): number {
  return 0
}

export function projectTodoCount(project: ProjectState): number {
  return project.sessions.reduce((sum, s) => sum + todoCount(s), 0)
}
