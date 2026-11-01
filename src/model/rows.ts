import type { ProjcacheRecord, RowCell, SessionTodoItem, TokenTotals } from './types.ts'

/** 从 projcache 行单元格安全取 val */
export function cellVal<T>(record: ProjcacheRecord, key: string): T | null {
  const cell: RowCell | undefined = record.record.rows[key]
  return (cell?.val ?? null) as T | null
}

/** 会话标题：优先 rows.title.val，回退 titleInput.val.first.text（PRD R4 搜索也要用它） */
export function extractTitle(record: ProjcacheRecord): string | null {
  const title = cellVal<string>(record, 'title')
  if (typeof title === 'string' && title.trim()) return title.trim()
  const input = cellVal<{ first?: { text?: string } } | null>(record, 'titleInput')
  const text = input?.first?.text
  return typeof text === 'string' && text.trim() ? text.trim() : null
}

export function extractLastPromptAt(record: ProjcacheRecord): number | null {
  const meta = cellVal<{ lastPromptAt?: number } | null>(record, 'sessionListMetadata')
  return typeof meta?.lastPromptAt === 'number' ? meta.lastPromptAt : null
}

export function extractTurns(record: ProjcacheRecord): number | null {
  const stats = cellVal<{ turns?: number } | null>(record, 'sessionStats')
  return typeof stats?.turns === 'number' ? stats.turns : null
}

export function extractTokenTotals(record: ProjcacheRecord): TokenTotals | null {
  const usage = cellVal<{ totals?: Partial<TokenTotals> } | null>(record, 'tokenUsage')
  const t = usage?.totals
  if (!t) return null
  return {
    uncachedInputTokens: t.uncachedInputTokens ?? 0,
    outputTokens: t.outputTokens ?? 0,
    cacheReadTokens: t.cacheReadTokens ?? 0,
    cacheWriteTokens: t.cacheWriteTokens ?? 0,
  }
}

/**
 * 会话待办：rows.todos.val 实测为 [{ content, status }]，也可能为空/异形。
 * 只保留有文字内容的条目；未知 status 归为 'pending'（计数口径：非 completed）。
 */
export function extractTodoItems(record: ProjcacheRecord): SessionTodoItem[] {
  const raw = cellVal<unknown>(record, 'todos')
  if (!Array.isArray(raw)) return []
  const items: SessionTodoItem[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const obj = entry as Record<string, unknown>
    const content = typeof obj['content'] === 'string' ? obj['content'].trim() : ''
    if (!content) continue
    const known = obj['status']
    const status = known === 'pending' || known === 'in_progress' || known === 'completed' ? known : 'pending'
    items.push({ content, status })
  }
  return items
}
