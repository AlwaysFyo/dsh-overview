import { useEffect, useMemo, useState, useSyncExternalStore } from './react.ts'
import type { WorkbenchState } from '../model/types.ts'
import { fetchState, IS_HOSTED, projectLiveness, projectTodoCount } from './api.ts'
import { getLivenessSnapshot, subscribeLiveness } from './liveness.ts'
import { searchWorkbench, highlightTitle, type SearchHit } from './SearchHit.ts'
import { Wall } from './views/Wall.tsx'
import { Detail } from './views/Detail.tsx'

/**
 * 应用壳：顶栏（品牌/搜索/指标胶囊/主题）+ L1 卡片墙 ↔ L2 项目详情。
 * 与宿主集成时由 createWorkbenchApp() 提供 fetchState 与容器。
 */

type View = { kind: 'l1' } | { kind: 'l2'; projectId: string }

export function WorkbenchApp({
  fetchStateFn = fetchState,
  getUiWorkspace,
  getWorkspaces,
}: {
  fetchStateFn?: typeof fetchState
  /** 宿主 uiWorkspace 服务惰性获取器（Q5 续接用）；dev 沙盒无 */
  getUiWorkspace?: () => { openSession?: (target: string) => void; openWorkspace?: (workspaceId: string, cb: (nextSessionId: string) => void) => unknown } | null
  /** 宿主 workspaces 服务惰性获取器（官方归档/取消归档） */
  getWorkspaces?: () => { archiveSession?: (id: string, options?: { stopActivity?: boolean }) => Promise<unknown>; unarchiveSession?: (id: string) => Promise<unknown> } | null
}) {
  const [state, setState] = useState<WorkbenchState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>({ kind: 'l1' })
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem('dshw-theme') as 'light' | 'dark') || 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('dshw-theme', theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const refresh = () => {
    fetchStateFn().then(
      (s) => setState(s),
      (e) => setError(String(e)),
    )
  }

  useEffect(() => {
    let alive = true
    fetchStateFn().then(
      (s) => alive && setState(s),
      (e) => alive && setError(String(e)),
    )
    return () => {
      alive = false
    }
  }, [fetchStateFn])

  // 宿主内订阅 SSE：数据/标记变更自动刷新
  useEffect(() => {
    if (!IS_HOSTED) return
    let es: EventSource | null = null
    try {
      es = new EventSource('/dsh-overview/events')
      // hello 只代表连接建立/重连：重连后状态可能已过期，主动拉一次
      es.addEventListener('hello', () => refresh())
      es.addEventListener('change', () => refresh())
    } catch {
      /* SSE 不可用则依赖手动刷新 */
    }
    return () => es?.close()
  }, [])

  const groups = useMemo(() => (state && searchOpen ? searchWorkbench(state, query) : []), [state, searchOpen, query])

  // 官方客户端会话快照里的运行中会话（与侧栏同源）；未绑定时返回 null，由时间窗兜底
  const liveness = useSyncExternalStore(subscribeLiveness, getLivenessSnapshot)
  const liveIds: readonly string[] | null = liveness.ready ? liveness.ids : null

  const globalRunning = useMemo(() => {
    if (!state) return 0
    return state.projects.filter((p) => !p.archived && projectLiveness(p, Date.now(), liveIds) === 'running')
      .length
  }, [state, liveIds])
  const globalTodos = useMemo(() => {
    if (!state) return 0
    return state.projects.filter((p) => !p.archived).reduce((sum, p) => sum + projectTodoCount(p), 0)
  }, [state])

  if (error) {
    return (
      <div className="wb-root">
        <div className="wb-empty-state" role="alert">
          <h2>数据暂不可用</h2>
          <p>{error}</p>
          <p>DSH 存储读取失败，宿主主流程不受影响。</p>
        </div>
      </div>
    )
  }
  if (!state) {
    return (
      <div className="wb-root">
        <div className="wb-empty-state">加载中…</div>
      </div>
    )
  }

  const openProject = (projectId: string) => {
    setSearchOpen(false)
    setQuery('')
    setView({ kind: 'l2', projectId })
    window.scrollTo({ top: 0 })
  }

  /** 搜索结果：有会话就直达会话（宿主 openSession）；项目级命中/无服务时退到项目详情 */
  const openHit = (hit: SearchHit) => {
    if (hit.sessionId) {
      const uiWorkspace = getUiWorkspace?.()
      if (uiWorkspace?.openSession) {
        setSearchOpen(false)
        setQuery('')
        uiWorkspace.openSession(hit.sessionId)
        return
      }
    }
    openProject(hit.projectId)
  }

  const current = view.kind === 'l2' ? state.projects.find((p) => p.id === view.projectId) : null

  return (
    <div className="wb-root">
      <header className="wb-topbar">
        <div className="wb-brand">
          <span className="wb-brand-mark">
            <i />
          </span>
          全景概览
        </div>
        <div className="wb-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            placeholder="搜索项目、会话或待办…"
            aria-label="跨项目搜索项目、会话与待办"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
          />
          {searchOpen && query.trim() && (
            <div className="wb-search-pop" role="listbox" aria-label="搜索结果">
              {groups.length === 0 && <div className="none">没有匹配的项目、会话或待办</div>}
              {groups.map((group) => (
                <div key={group.projectId} className="wb-search-group">
                  <div className="grp">{group.projectTitle}</div>
                  {group.hits.map((hit, i) => (
                    <button
                      key={`${hit.kind}-${hit.sessionId ?? 'project'}-${i}`}
                      type="button"
                      className="sr"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => openHit(hit)}
                    >
                      <div>
                        {highlightTitle(hit.text, query).map((part, j) =>
                          part.hit ? <mark key={j}>{part.text}</mark> : <span key={j}>{part.text}</span>,
                        )}
                      </div>
                      <div className="p">
                        {hit.kind === 'todo'
                          ? `待办 · ${hit.sessionTitle ?? hit.sessionId ?? ''}`
                          : hit.kind === 'project'
                            ? '项目'
                            : '会话'}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        <span className="wb-pill wb-pill-run num">运行中 {globalRunning}</span>
        <span className="wb-pill wb-pill-todo num">待办 {globalTodos}</span>
        <button
          type="button"
          className="wb-ghost-btn"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="切换深浅主题"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>

      {view.kind === 'l1' || !current ? (
        <Wall state={state} liveIds={liveIds} onOpen={openProject} />
      ) : (
        <Detail
          state={state}
          project={current}
          liveIds={liveIds}
          getUiWorkspace={getUiWorkspace}
          getWorkspaces={getWorkspaces}
          onChanged={refresh}
          onBack={() => setView({ kind: 'l1' })}
          onSwitch={openProject}
        />
      )}
    </div>
  )
}
