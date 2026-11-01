/**
 * 「运行中」真源：官方客户端 sessions 服务的列表快照（ctx.sessions.list）。
 *
 * 为什么不用宿主侧的 liveSessionIds（Q2）：
 * 宿主 SessionStore.list() 只登记「本进程 enter 过」的会话，常驻的 webServer
 * 侧拿到的是空数组（实测恒为 []）。而官方侧栏自己用的就是 ctx.sessions.list
 * 这个 Observable，快照里每个会话带 running / runningSubagentCount /
 * pendingInteraction —— 与「侧栏是否显示转圈」同源，才是用户眼里的"运行中"。
 * 参考实现：dsh-archive-manager 的 src/client.ts:627 与 archive-organizer.ts:46。
 */

export interface LiveSnapshot {
  /** 是否已成功绑定官方会话快照；未绑定时消费方应回退到宿主 liveSessionIds */
  ready: boolean
  /** 运行中的会话 id（升序，引用稳定：内容不变时不换数组） */
  ids: readonly string[]
}

export interface SessionLike {
  id?: unknown
  running?: unknown
  runningSubagentCount?: unknown
  pendingInteraction?: unknown
}

export interface SessionListSource {
  getSnapshot?: () => unknown
  subscribe?: (listener: () => void) => unknown
}

const EMPTY: LiveSnapshot = { ready: false, ids: [] }

let snapshot: LiveSnapshot = EMPTY
let snapshotKey = ''
const listeners = new Set<() => void>()

function publish(next: LiveSnapshot): void {
  const key = `${next.ready ? 1 : 0}|${next.ids.join('\u0000')}`
  if (key === snapshotKey) return
  snapshotKey = key
  snapshot = next
  for (const listener of [...listeners]) {
    try {
      listener()
    } catch {
      /* 单个订阅者异常不影响其它订阅者 */
    }
  }
}

export function subscribeLiveness(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getLivenessSnapshot(): LiveSnapshot {
  return snapshot
}

/** 纯函数：从官方会话快照算出运行中 id（便于单测，不依赖 React） */
export function runningIdsFromList(snapshotValue: unknown): string[] {
  const byId = (snapshotValue as { byId?: Record<string, SessionLike> } | null | undefined)?.byId
  if (!byId || typeof byId !== 'object') return []
  const ids: string[] = []
  for (const session of Object.values(byId)) {
    if (!session || typeof session.id !== 'string') continue
    const subagents = typeof session.runningSubagentCount === 'number' ? session.runningSubagentCount : 0
    if (session.running === true || subagents > 0 || session.pendingInteraction != null) ids.push(session.id)
  }
  return ids.sort()
}

/**
 * 绑定官方会话列表 Observable。服务不可用（dev 沙盒/旧宿主）时返回空 disposer，
 * 快照保持 ready:false，消费方自动回退。
 */
export function bindSessionLiveness(source: SessionListSource | null | undefined): () => void {
  if (!source || typeof source.getSnapshot !== 'function' || typeof source.subscribe !== 'function') {
    return () => {}
  }
  const read = (): void => {
    try {
      publish({ ready: true, ids: runningIdsFromList(source.getSnapshot!()) })
    } catch {
      publish({ ready: true, ids: [] })
    }
  }
  read()
  let unsubscribe: unknown
  try {
    unsubscribe = source.subscribe(read)
  } catch {
    return () => {}
  }
  return () => {
    try {
      if (typeof unsubscribe === 'function') (unsubscribe as () => void)()
    } catch {
      /* 宿主回收时忽略 */
    }
  }
}
