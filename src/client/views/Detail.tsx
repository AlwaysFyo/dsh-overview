import { useMemo, useState } from '../react.ts'
import type { ProjectState, SessionMeta, WorkbenchState } from '../../model/types.ts'
import { deleteSession, splitSessions, projectTodoCount } from '../api.ts'
import type { SessionGroups } from '../api.ts'
import { buildResumeText, queueResumeDraft } from '../resume.ts'
import { fmtRelative, fmtNum } from '../util.ts'

type GetUiWorkspace = () => {
  /** 直接跳进指定会话（Q5 最优路径，宿主 0.2.1-rc 提供） */
  openSession?: (target: string) => void
  /** 兜底：切工作区开新会话 + 草稿 */
  openWorkspace?: (workspaceId: string, cb: (nextSessionId: string) => void) => unknown
} | null

type GetWorkspaces = () => {
  /** 官方真归档（写宿主归档缓存） */
  archiveSession?: (id: string, options?: { stopActivity?: boolean }) => Promise<unknown>
  unarchiveSession?: (id: string) => Promise<unknown>
} | null

/** L2 项目详情（PRD R3）：面包屑 + 指标条 + 会话三 tab + 侧栏 */
export function Detail({
  state,
  project,
  getUiWorkspace,
  getWorkspaces,
  onChanged,
  onBack,
  onSwitch,
}: {
  state: WorkbenchState
  project: ProjectState
  getUiWorkspace?: GetUiWorkspace
  getWorkspaces?: GetWorkspaces
  /** 会话归档/删除后由父级刷新数据 */
  onChanged?: () => void
  onBack: () => void
  onSwitch: (projectId: string) => void
}) {
  const [tab, setTab] = useState<'running' | 'history' | 'archived'>('running')
  const groups = useMemo(
    () => splitSessions(project, Date.now(), state.liveSessionIds ?? null),
    [project, state.liveSessionIds],
  )

  const totalTurns = project.sessions.reduce((sum, s) => sum + (s.turns ?? 0), 0)
  const todos = projectTodoCount(project)
  const activeCount = project.sessions.filter((s) => !s.archived).length

  return (
    <section>
      <div className="wb-crumbs">
        <button type="button" className="wb-back" onClick={onBack}>
          ← 返回
        </button>
        <span className="sep">/</span>
        <select
          className="wb-proj-switch"
          aria-label="切换项目"
          value={project.id}
          onChange={(e) => onSwitch(e.target.value)}
        >
          {[...state.projects]
            .sort((a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
                {p.archived ? '（已归档）' : ''}
              </option>
            ))}
        </select>
      </div>

      <div className="wb-proj-head">
        <h1>{project.title}</h1>
        <span className="wb-proj-path mono">{project.path}</span>
      </div>

      {!project.existsOnDisk && (
        <div className="wb-dead-banner">工作区目录当前不存在（被移动或删除），以下为历史数据。</div>
      )}

      <div className="wb-mstrip num">
        <div className="wb-mcell">
          <div className="lbl">活跃会话</div>
          <div className="val">{activeCount}</div>
          <div className="sub">{groups.running.length} 个近期活跃</div>
        </div>
        <div className="wb-mcell">
          <div className="lbl">待办</div>
          <div className={todos > 0 ? 'val hot' : 'val'}>{todos}</div>
          <div className="sub">R6 接入后显示明细</div>
        </div>
        <div className="wb-mcell">
          <div className="lbl">归档会话</div>
          <div className="val">{groups.archived.length}</div>
          <div className="sub">归档不等于失忆</div>
        </div>
        <div className="wb-mcell">
          <div className="lbl">累计轮次</div>
          <div className="val">{fmtNum(totalTurns)}</div>
          <div className="sub">{project.sessions.length} 个会话</div>
        </div>
      </div>

      <div className="wb-cols">
        <div>
          <div className="wb-tabs" role="tablist" aria-label="会话分组">
            <button type="button" className="wb-tab" role="tab" aria-selected={tab === 'running'} onClick={() => setTab('running')}>
              进行中<span className="cnt num">{groups.running.length}</span>
            </button>
            <button type="button" className="wb-tab" role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')}>
              历史<span className="cnt num">{groups.history.length}</span>
            </button>
            <button type="button" className="wb-tab" role="tab" aria-selected={tab === 'archived'} onClick={() => setTab('archived')}>
              归档<span className="cnt num">{groups.archived.length}</span>
            </button>
          </div>

          <SessionList
            list={groups[tab]}
            tab={tab}
            project={project}
            getUiWorkspace={getUiWorkspace}
            getWorkspaces={getWorkspaces}
            onChanged={onChanged}
          />
        </div>

        <aside>
          <div className="wb-side-card">
            <h3>待办</h3>
            <div className="wb-side-empty">待办提取将在 P1（R6）接入，数据源为会话内 todo 记录。</div>
          </div>
          <div className="wb-side-card">
            <h3>项目动态</h3>
            <div className="wb-feed">
              {project.sessions.slice(0, 5).map((s) => (
                <div className="f" key={s.id}>
                  {s.archived ? '归档「' : '会话「'}
                  {s.title ?? '无标题'}
                  {s.archived ? '」' : '」'}
                  <span className="w num">{fmtRelative(s.lastActivityAt)}</span>
                </div>
              ))}
              {project.sessions.length === 0 && <div className="wb-side-empty">暂无动态</div>}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

function SessionList({
  list,
  tab,
  project,
  getUiWorkspace,
  getWorkspaces,
  onChanged,
}: {
  list: SessionMeta[]
  tab: keyof SessionGroups
  project: ProjectState
  getUiWorkspace?: GetUiWorkspace
  getWorkspaces?: GetWorkspaces
  onChanged?: () => void
}) {
  if (list.length === 0) {
    return (
      <div className="wb-side-empty" style={{ padding: '26px 4px' }}>
        {tab === 'running' ? '当前没有进行中的会话' : tab === 'history' ? '暂无历史会话' : '暂无归档会话'}
      </div>
    )
  }

  /** Q5 续接：优先 openSession 直接跳进原会话（上下文完整）；否则切工作区+草稿兜底 */
  const resume = (s: SessionMeta) => {
    const uiWorkspace = getUiWorkspace?.()
    if (uiWorkspace?.openSession) {
      uiWorkspace.openSession(s.id)
      return
    }
    const text = buildResumeText(s)
    if (uiWorkspace?.openWorkspace && project.workspaceId) {
      uiWorkspace.openWorkspace(project.workspaceId, (nextId) => queueResumeDraft(nextId, text))
      return
    }
    // 降级：dev 沙盒 / 孤儿项目（无工作区注册）→ 复制续接说明
    try {
      void navigator.clipboard.writeText(`${text}\n续接命令：dsh --resume ${s.id}`)
      alert('已复制续接上下文到剪贴板（当前环境无法直接跳转）')
    } catch {
      alert(`续接：dsh --resume ${s.id}\n\n${text}`)
    }
  }

  /** 会话操作：归档/取消归档走官方 workspaces 服务；删除走插件宿主路由（物理清理，不可恢复） */
  const mark = (action: 'archive' | 'unarchive' | 'delete', s: SessionMeta) => {
    const run = async (): Promise<void> => {
      if (action === 'archive') {
        const ws = getWorkspaces?.()
        if (!ws?.archiveSession) throw new Error('归档服务不可用')
        await ws.archiveSession(s.id, { stopActivity: true })
        return
      }
      if (action === 'unarchive') {
        const ws = getWorkspaces?.()
        if (!ws?.unarchiveSession) throw new Error('归档服务不可用')
        await ws.unarchiveSession(s.id)
        return
      }
      await deleteSession(s.id)
    }
    void run().then(
      () => onChanged?.(),
      (e) => alert('操作失败：' + String((e as Error).message ?? e)),
    )
  }

  return (
    <div>
      {list.map((s) => (
        <button type="button" className="wb-srow" key={s.id} onClick={() => resume(s)}>
          <span className={`wb-dot ${tab === 'archived' ? 'wb-dot-off' : tab === 'running' ? 'wb-dot-run' : 'wb-dot-idle'}`} />
          <span className="t">{s.title ?? '(无标题)'}</span>
          <span className="wb-sact">
            <span
              className="wb-sact-btn"
              role="button"
              tabIndex={0}
              title="续接（跳转原会话）"
              aria-label="续接会话"
              onClick={(e) => {
                e.stopPropagation()
                resume(s)
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden="true">
                <path d="M4 12L12 4" />
                <path d="M6.5 4H12V9.5" />
              </svg>
            </span>
            {tab === 'archived' ? (
              <span
                className="wb-sact-btn"
                role="button"
                tabIndex={0}
                title="取消归档"
                aria-label="取消归档会话"
                onClick={(e) => {
                  e.stopPropagation()
                  mark('unarchive', s)
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden="true">
                  <path d="M2.5 5.5h11" />
                  <path d="M3.5 5.5V13a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5.5" />
                  <path d="M9.5 8.5 8 10 6.5 8.5" />
                  <path d="M8 10V6.5" />
                </svg>
              </span>
            ) : (
              <span
                className="wb-sact-btn"
                role="button"
                tabIndex={0}
                title="归档"
                aria-label="归档会话"
                onClick={(e) => {
                  e.stopPropagation()
                  mark('archive', s)
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden="true">
                  <rect x="2" y="3.5" width="12" height="3" rx="0.8" />
                  <path d="M3.2 6.5V13a1 1 0 0 0 1 1h7.6a1 1 0 0 0 1-1V6.5" />
                  <path d="M6.5 9h3" />
                </svg>
              </span>
            )}
            <span
              className="wb-sact-btn wb-danger"
              role="button"
              tabIndex={0}
              title="永久删除会话（不可恢复）"
              aria-label="删除会话"
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('永久删除该会话？（会话文件将被删除，不可恢复）')) mark('delete', s)
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden="true">
                <path d="M3 4.5h10" />
                <path d="M5.5 4.5V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5" />
                <path d="M4.5 4.5 5.2 13a1 1 0 0 0 1 .9h3.6a1 1 0 0 0 1-.9L11.5 4.5" />
              </svg>
            </span>
          </span>
          <span className="m num">
            {s.turns !== null ? `${s.turns} 轮 · ` : ''}
            {fmtRelative(s.lastActivityAt)}
          </span>
        </button>
      ))}
    </div>
  )
}
