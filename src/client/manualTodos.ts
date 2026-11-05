/**
 * 人工待办：插件自己的本地待办（localStorage），与会话里的 todo 记录分开存。
 *
 * 为什么要分开：会话内的 todo 是宿主写的真相，插件只读；用户想「我先记一条」时不该
 * 去伪造宿主 todo/write 事件，所以人工待办只活在浏览器侧，用「手动」标签区分来源。
 * 代价（明说）：换浏览器 / 清缓存会丢，且不会同步到会话里。
 */

const STORAGE_KEY = 'dsho-manual-todos'
const MAX_PER_PROJECT = 200
const MAX_TEXT = 200

export interface ManualTodo {
  id: string
  text: string
  done: boolean
  createdAt: number
}

export type ManualTodoMap = Record<string, ManualTodo[]>

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch {
    return null
  }
}

function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  } catch {
    /* ignore */
  }
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function readManualTodos(projectId: string): ManualTodo[] {
  const store = storage()
  if (!store) return []
  try {
    const raw = store.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ManualTodoMap
    const list = parsed?.[projectId]
    if (!Array.isArray(list)) return []
    return list.filter(
      (t): t is ManualTodo =>
        !!t && typeof t.id === 'string' && typeof t.text === 'string' && typeof t.createdAt === 'number',
    )
  } catch {
    return []
  }
}

/** 人工待办变更事件：顶栏的全局待办数要跟着变，否则又会和项目页数字打架 */
const CHANGE_EVENT = 'dsho-manual-todos'

function notify(): void {
  try {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT))
  } catch {
    /* ignore */
  }
}

export function subscribeManualTodos(fn: () => void): () => void {
  try {
    if (typeof window === 'undefined') return () => {}
    window.addEventListener(CHANGE_EVENT, fn)
    return () => window.removeEventListener(CHANGE_EVENT, fn)
  } catch {
    return () => {}
  }
}

function writeAll(map: ManualTodoMap): void {
  const store = storage()
  if (!store) return
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(map))
    notify()
  } catch {
    /* 配额满/隐私模式：静默失败，不阻塞 UI */
  }
}

function readAll(): ManualTodoMap {
  const store = storage()
  if (!store) return {}
  try {
    const raw = store.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as ManualTodoMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function addManualTodo(projectId: string, text: string): ManualTodo[] {
  const trimmed = text.trim().slice(0, MAX_TEXT)
  if (!trimmed) return readManualTodos(projectId)
  const map = readAll()
  const list = Array.isArray(map[projectId]) ? map[projectId] : []
  const next = [{ id: newId(), text: trimmed, done: false, createdAt: Date.now() }, ...list].slice(0, MAX_PER_PROJECT)
  map[projectId] = next
  writeAll(map)
  return next
}

export function toggleManualTodo(projectId: string, id: string): ManualTodo[] {
  const map = readAll()
  const list = Array.isArray(map[projectId]) ? map[projectId] : []
  map[projectId] = list.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
  writeAll(map)
  return map[projectId]
}

export function removeManualTodo(projectId: string, id: string): ManualTodo[] {
  const map = readAll()
  const list = Array.isArray(map[projectId]) ? map[projectId] : []
  map[projectId] = list.filter((t) => t.id !== id)
  writeAll(map)
  return map[projectId]
}
