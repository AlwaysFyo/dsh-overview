/**
 * 续接草稿队列（Q5，机制参考 dsh-kanban chat-bridge）。
 *
 * 流程：L2 会话行「续接」→ uiWorkspace.openWorkspace(项目, cb(新会话id)) →
 * 草稿按新会话 id 入队 → conversation.input.dock 注入器在该会话 composer
 * 挂载时消费并 setDraft——始终是可编辑草稿，绝不自动发送。
 */
export interface ResumeDraft {
  text: string
}

const pending = new Map<string, ResumeDraft>()
let version = 0
const listeners = new Set<() => void>()

/** 为目标会话排入续接草稿 */
export function queueResumeDraft(sessionId: string, text: string): void {
  pending.set(sessionId, { text })
  version += 1
  for (const l of listeners) l()
}

/** 消费目标会话的草稿（取走即删），无则返回 null */
export function consumeResumeDraft(sessionId: string): ResumeDraft | null {
  const draft = pending.get(sessionId)
  if (draft == null) return null
  pending.delete(sessionId)
  version += 1
  for (const l of listeners) l()
  return draft
}

/** 供 useSyncExternalStore 订阅 */
export function subscribeResumeDraft(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getResumeVersion(): number {
  return version
}

/** 把会话元数据拼装成续接上下文草稿 */
export function buildResumeText(s: {
  id: string
  title: string | null
  cwd: string | null
  turns: number | null
  lastActivityAt: number | null
}): string {
  const parts = [
    `请续接会话 ${s.id}《${s.title ?? '无标题'}》。`,
    s.cwd ? `项目目录：${s.cwd}` : null,
    `轮次：${s.turns ?? '未知'}；最后活动：${s.lastActivityAt ? new Date(s.lastActivityAt).toLocaleString() : '未知'}。`,
    '请先恢复该会话的上下文（可用会话搜索或读取会话记录），然后从中断处继续，不要重复已完成的工作。',
  ]
  return parts.filter(Boolean).join('\n')
}
