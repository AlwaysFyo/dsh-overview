import type { WorkbenchState } from '../model/types.ts'

/**
 * R4 跨项目搜索：项目名 / 会话标题 / 会话待办三路匹配，按项目分组。
 * 纯实时扫描（数据量在几十个会话级别），不建索引。
 */
export type HitKind = 'project' | 'session' | 'todo'

export interface SearchHit {
  kind: HitKind
  projectId: string
  projectTitle: string
  /** 项目级命中为 null */
  sessionId: string | null
  sessionTitle: string | null
  /** 展示文本：项目名 / 会话标题 / 待办内容 */
  text: string
}

export interface SearchGroup {
  projectId: string
  projectTitle: string
  hits: SearchHit[]
}

const MAX_GROUPS = 8
const MAX_HITS = 24

export function searchWorkbench(state: WorkbenchState, query: string, limit = MAX_HITS): SearchGroup[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const groups: SearchGroup[] = []
  let total = 0
  for (const project of state.projects) {
    const hits: SearchHit[] = []
    if (project.title.toLowerCase().includes(q)) {
      hits.push({
        kind: 'project',
        projectId: project.id,
        projectTitle: project.title,
        sessionId: null,
        sessionTitle: null,
        text: project.title,
      })
    }
    for (const s of project.sessions) {
      if (s.title && s.title.toLowerCase().includes(q)) {
        hits.push({
          kind: 'session',
          projectId: project.id,
          projectTitle: project.title,
          sessionId: s.id,
          sessionTitle: s.title,
          text: s.title,
        })
      }
      for (const t of s.todos) {
        if (!t.content.toLowerCase().includes(q)) continue
        hits.push({
          kind: 'todo',
          projectId: project.id,
          projectTitle: project.title,
          sessionId: s.id,
          sessionTitle: s.title,
          text: t.content,
        })
      }
    }
    if (hits.length === 0) continue
    const room = limit - total
    if (room <= 0) break
    const kept = hits.slice(0, room)
    groups.push({ projectId: project.id, projectTitle: project.title, hits: kept })
    total += kept.length
    if (groups.length >= MAX_GROUPS) break
  }
  return groups
}

/** 命中片段高亮：<mark> */
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
