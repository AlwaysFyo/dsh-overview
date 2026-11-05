import type { ProjectState, SessionMeta } from './types.ts'

/**
 * 闲置会话整理（P3-c）。
 *
 * 口径参考 dsh-archive-manager 的 idleArchiveCandidate：只挑「确实搁置了」的会话，
 * 并且把一切「可能正在用」的证据都当作排除项——运行中的、等待用户交互的、
 * 用户正在看的、以及根本没有可信活跃时间的（宁可漏，不可误）。
 */
export interface IdleCandidate {
  sessionId: string
  title: string | null
  lastActivityAt: number
  idleDays: number
}

export const IDLE_DAYS_MIN = 1
export const IDLE_DAYS_MAX = 36_500

export interface IdleOptions {
  /** 闲置天数阈值，超出范围按边界收敛（参考实现 days ∈ [1, 36500]） */
  days: number
  now?: number
  /** 运行中会话真源（客户端会话快照）；数组或 Set 都收 */
  liveIds?: Iterable<string> | null
  /** 用户当前正在看的会话 */
  currentSessionId?: string | null
  /** 正在等待用户输入的会话 */
  pendingSessionIds?: Iterable<string> | null
}

export function clampIdleDays(days: number): number {
  if (!Number.isFinite(days)) return 30
  return Math.min(IDLE_DAYS_MAX, Math.max(IDLE_DAYS_MIN, Math.round(days)))
}

export function idleCandidates(project: ProjectState, options: IdleOptions): IdleCandidate[] {
  const now = options.now ?? Date.now()
  const days = clampIdleDays(options.days)
  const live = options.liveIds ? new Set(options.liveIds) : null
  const pending = options.pendingSessionIds ? new Set(options.pendingSessionIds) : null
  const cutoff = now - days * 24 * 3600_000
  const out: IdleCandidate[] = []
  for (const s of project.sessions) {
    if (isIdleCandidate(s, { now, cutoff, live, pending, currentSessionId: options.currentSessionId ?? null })) {
      const last = s.lastActivityAt!
      out.push({
        sessionId: s.id,
        title: s.title,
        lastActivityAt: last,
        idleDays: Math.floor((now - last) / (24 * 3600_000)),
      })
    }
  }
  out.sort((a, b) => b.idleDays - a.idleDays)
  return out
}

function isIdleCandidate(
  s: SessionMeta,
  ctx: {
    now: number
    cutoff: number
    live: Set<string> | null
    pending: Set<string> | null
    currentSessionId: string | null
  },
): boolean {
  if (s.archived) return false // 已经归档的不用再整理
  if (s.id === ctx.currentSessionId) return false
  if (ctx.live?.has(s.id)) return false // 运行中（含子代理在跑的会话）
  if (ctx.pending?.has(s.id)) return false // 等用户点确认
  if (s.lastActivityAt === null) return false // 没有可信活跃时间：不猜
  return s.lastActivityAt <= ctx.cutoff
}
