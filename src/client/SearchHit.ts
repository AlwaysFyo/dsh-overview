import type { WorkbenchState } from '../model/types.ts'
import type { ChatRole, ContentHit } from './api.ts'

/**
 * R4 跨项目搜索：项目名 / 会话标题 / 会话待办 / 正文 四路匹配，按项目分组。
 * 前三路是本地实时扫描（数据量在几十个会话级别），
 * 正文那一路要读转录文件，由宿主流式检索，结果通过 groupContentHits 拼回同一套展示契约。
 */
export type HitKind = 'project' | 'session' | 'todo' | 'content'

export interface SearchHit {
  kind: HitKind
  projectId: string
  projectTitle: string
  /** 项目级命中为 null */
  sessionId: string | null
  sessionTitle: string | null
  /** 展示文本：项目名 / 会话标题 / 待办内容 / 正文片段 */
  text: string
  /** 正文命中才有：消息序号、角色、需要高亮的区间 */
  seq?: number
  role?: ChatRole
  ranges?: Array<[number, number]>
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
  const groups = new Map<string, SearchGroup>()
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
    groups.set(project.id, { projectId: project.id, projectTitle: project.title, hits: kept })
    total += kept.length
    if (groups.size >= MAX_GROUPS) break
  }
  return [...groups.values()]
}

/**
 * 把宿主返回的正文命中拼回展示契约：靠 state 里的会话表补上项目名/会话标题。
 * 找不到归属的命中（未登记在任何工作区的转录）项目名标为「未归属会话」，仍然展示——
 * 藏起来只会让人以为搜索漏了。
 */
export function groupContentHits(state: WorkbenchState, hits: readonly ContentHit[]): SearchGroup[] {
  const index = new Map<string, { projectId: string; projectTitle: string; sessionTitle: string | null }>()
  for (const project of state.projects) {
    for (const s of project.sessions) {
      index.set(s.id, { projectId: project.id, projectTitle: project.title, sessionTitle: s.title })
    }
  }
  const groups = new Map<string, SearchGroup>()
  for (const hit of hits) {
    const owner = index.get(hit.sessionId)
    const projectId = owner?.projectId ?? 'unclaimed'
    const projectTitle = owner?.projectTitle ?? '未归属会话'
    const group = groups.get(projectId) ?? { projectId, projectTitle, hits: [] }
    group.hits.push({
      kind: 'content',
      projectId,
      projectTitle,
      sessionId: hit.sessionId,
      sessionTitle: owner?.sessionTitle ?? null,
      text: hit.snippet,
      seq: hit.seq,
      role: hit.role,
      ranges: hit.ranges,
    })
    groups.set(projectId, group)
  }
  return [...groups.values()]
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

/**
 * 用宿主给的码元区间渲染高亮（比在客户端重算更准：宿主的大小写折叠按码元映射回原文下标）。
 * 区间越界/逆序一律忽略，宁可少高亮也不要渲染出错位文本。
 */
export function renderRanges(
  text: string,
  ranges: readonly [number, number][] | undefined,
): Array<{ text: string; hit: boolean }> {
  if (!ranges || ranges.length === 0) return [{ text, hit: false }]
  const parts: Array<{ text: string; hit: boolean }> = []
  let cursor = 0
  for (const [start, end] of ranges) {
    if (start < cursor || end <= start || end > text.length) continue
    if (start > cursor) parts.push({ text: text.slice(cursor, start), hit: false })
    parts.push({ text: text.slice(start, end), hit: true })
    cursor = end
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), hit: false })
  return parts
}
