import { useMemo, useState } from '../react.ts'
import type { WorkbenchState } from '../../model/types.ts'
import type { ProjectState } from '../api.ts'
import { projectLiveness, projectTodoCount } from '../api.ts'
import { fmtRelative } from '../util.ts'

/** L1 全局卡片墙（PRD R1）：状态分段器 + 三段式项目卡片 */
export function Wall({
  state,
  liveIds,
  onOpen,
}: {
  state: WorkbenchState
  /** 运行中会话 id（官方客户端会话快照）；null/undefined 时卡片回退时间窗 */
  liveIds?: readonly string[] | null
  onOpen: (id: string) => void
}) {
  const [filter, setFilter] = useState<'active' | 'archived' | 'all'>('active')

  const counts = useMemo(() => {
    const active = state.projects.filter((p) => !p.archived).length
    const archived = state.projects.filter((p) => p.archived).length
    return { active, archived, all: state.projects.length }
  }, [state])

  const visible = useMemo(() => {
    const sorted = [...state.projects].sort((a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0))
    if (filter === 'all') return sorted
    return sorted.filter((p) => (filter === 'archived' ? p.archived : !p.archived))
  }, [state, filter])

  if (state.projects.length === 0) {
    return (
      <section>
        <div className="wb-empty-state">
          <h2>还没有工作区</h2>
          <p>在 DSH 中打开一个工作区并开始会话，全景概览会自动把它聚合到这里。</p>
          <button type="button" className="wb-ghost-btn" onClick={() => alert('由宿主提供新建会话入口（联调期接入）')}>
            新建会话
          </button>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="wb-segbar">
        <div className="wb-seg" role="tablist" aria-label="项目状态筛选">
          <button type="button" role="tab" aria-selected={filter === 'active'} onClick={() => setFilter('active')}>
            进行中<span className="cnt num">{counts.active}</span>
          </button>
          <button type="button" role="tab" aria-selected={filter === 'archived'} onClick={() => setFilter('archived')}>
            已归档<span className="cnt num">{counts.archived}</span>
          </button>
          <button type="button" role="tab" aria-selected={filter === 'all'} onClick={() => setFilter('all')}>
            全部<span className="cnt num">{counts.all}</span>
          </button>
        </div>
        <span className="wb-sort-hint">按最近活动排序 · 数据 {fmtRelative(state.generatedAt)}更新</span>
      </div>

      {visible.length === 0 ? (
        <div className="wb-empty-state">该分组下没有项目</div>
      ) : (
        <div className="wb-grid">
          {visible.map((p) => (
            <ProjectCard key={p.id} project={p} liveIds={liveIds ?? null} onOpen={() => onOpen(p.id)} />
          ))}
        </div>
      )}
    </section>
  )
}

function ProjectCard({
  project,
  liveIds,
  onOpen,
}: {
  project: ProjectState
  liveIds: readonly string[] | null
  onOpen: () => void
}) {
  const live = project.sessions.filter((s) => !s.archived).length
  const archived = project.sessions.filter((s) => s.archived).length
  const liveness = projectLiveness(project, Date.now(), liveIds)
  const todos = projectTodoCount(project)
  const latest = project.sessions[0]

  const stateText =
    project.archived && project.archivedAt
      ? `归档于 ${fmtRelative(project.archivedAt)}`
      : liveness === 'running'
        ? '会话活跃中'
        : `最近：${fmtRelative(project.lastActivityAt)}`

  const classes = ['wb-card']
  if (liveness === 'running') classes.push('is-running')
  if (project.archived) classes.push('is-archived')
  if (!project.existsOnDisk) classes.push('is-dead')

  return (
    <button type="button" className={classes.join(' ')} onClick={onOpen}>
      <div className="wb-card-top">
        <span className={`wb-dot wb-dot-${liveness === 'running' ? 'run' : liveness === 'idle' ? 'idle' : 'off'}`} />
        <span className="wb-card-name">{project.title}</span>
        <span className="wb-card-state">{stateText}</span>
      </div>
      <div className="wb-card-path mono">
        {project.path}
        {!project.existsOnDisk && ' · 路径失效'}
      </div>
      <div className="wb-stats num">
        <div className="wb-stat">
          <b>{live}</b>
          <span>活跃会话</span>
        </div>
        <div className="wb-stat">
          <b className={todos > 0 ? 'hot' : ''}>{todos}</b>
          <span>待办</span>
        </div>
        <div className="wb-stat">
          <b>{archived}</b>
          <span>归档</span>
        </div>
      </div>
      <div className="wb-card-foot">
        <em>{latest?.title ?? '—'}</em>
        <span className="t num">{fmtRelative(project.lastActivityAt)}</span>
      </div>
    </button>
  )
}
