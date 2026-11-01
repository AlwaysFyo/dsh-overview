import type { WorkbenchState } from '../model/types.ts'

/** R4-lite：跨项目搜索会话标题（P0 实时扫描，无索引） */
export interface SearchHit {
  projectId: string
  projectTitle: string
  sessionId: string
  title: string
}

export function searchSessions(state: WorkbenchState, query: string): SearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const hits: SearchHit[] = []
  for (const project of state.projects) {
    for (const s of project.sessions) {
      if (s.title && s.title.toLowerCase().includes(q)) {
        hits.push({ projectId: project.id, projectTitle: project.title, sessionId: s.id, title: s.title })
      }
      if (hits.length >= 8) return hits
    }
  }
  return hits
}

/** 标题命中片段高亮：<mark> */
export function highlightTitle(title: string, query: string): Array<{ text: string; hit: boolean }> {
  const q = query.trim()
  if (!q) return [{ text: title, hit: false }]
  const parts: Array<{ text: string; hit: boolean }> = []
  const lower = title.toLowerCase()
  const ql = q.toLowerCase()
  let i = 0
  while (i < title.length) {
    const idx = lower.indexOf(ql, i)
    if (idx === -1) {
      parts.push({ text: title.slice(i), hit: false })
      break
    }
    if (idx > i) parts.push({ text: title.slice(i, idx), hit: false })
    parts.push({ text: title.slice(idx, idx + q.length), hit: true })
    i = idx + q.length
  }
  return parts
}
