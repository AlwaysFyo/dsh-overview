import type { ProjcacheRecord, RowCell, SessionTodos, TokenTotals } from './types.ts'

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

export function extractTodos(record: ProjcacheRecord): SessionTodos | null {
  return cellVal<SessionTodos>(record, 'todos')
}
