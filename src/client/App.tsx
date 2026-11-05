import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from './react.ts'
import type { WorkbenchState } from '../model/types.ts'
import { fetchState, IS_HOSTED, searchContent, type ContentHit } from './api.ts'
import { freshnessLabel } from './util.ts'
import { getLivenessSnapshot, subscribeLiveness } from './liveness.ts'
import { readPref, subscribePrefs } from './settings.ts'
import {
  searchWorkbench,
  groupContentHits,
  highlightTitle,
  renderRanges,
  type SearchGroup,
  type SearchHit,
} from './SearchHit.ts'
import { Home, Icon } from './views/Home.tsx'
import { Detail } from './views/Detail.tsx'
import { PreviewDrawer } from './views/Preview.tsx'
import { DiagnosticsDrawer } from './views/Diagnostics.tsx'

/**
 * 应用壳：顶栏（品牌/搜索/新建项目/主题）+ L1 主屏（hero 对话框 + 统计卡 + 项目总览，
 * 含运行中/继续工作/待办三个子屏）↔ L2 项目详情。诊断保留抽屉形态，入口在诊断统计卡。
 * 与宿主集成时由 createWorkbenchApp() 提供 fetchState 与容器。
 */

type View = { kind: 'l1' } | { kind: 'l2'; projectId: string }

interface PreviewTarget {
  sessionId: string
  sessionTitle: string | null
  query: string
}

/** 正文检索的防抖时长：短到不打断输入节奏，长到不会每敲一个字就解压一遍转录 */
const CONTENT_SEARCH_DEBOUNCE_MS = 320
const CONTENT_SEARCH_MIN_CHARS = 2

/** 快捷键提示按平台显示：Windows / Linux 上没有 ⌘ 键，写「⌘K」等于写错 */
const IS_MAC = (() => {
  try {
    return /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)
  } catch {
    return false
  }
})()
const SHORTCUT_HINT = IS_MAC ? '⌘K' : 'Ctrl K'

export function WorkbenchApp({
  fetchStateFn = fetchState,
  getUiWorkspace,
  getWorkspaces,
}: {
  fetchStateFn?: typeof fetchState
  /** 宿主 uiWorkspace 服务惰性获取器（Q5 续接用）；dev 沙盒无 */
  getUiWorkspace?: () => {
    openSession?: (target: string) => void
    openWorkspace?: (
      workspaceId: string,
      cb: (nextSessionId: string) => void,
      options?: { agentPreset?: string },
    ) => unknown
  } | null
  /** 宿主 workspaces 服务惰性获取器（官方归档/取消归档） */
  getWorkspaces?: () => { archiveSession?: (id: string, options?: { stopActivity?: boolean }) => Promise<unknown>; unarchiveSession?: (id: string) => Promise<unknown> } | null
}) {
  const [state, setState] = useState<WorkbenchState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>({ kind: 'l1' })
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [contentHits, setContentHits] = useState<ContentHit[]>([])
  // 偏好开关（设置 → 插件 → 全景概览）：关掉后不再扫转录，搜索只剩本地三路
  const [contentSearchOn, setContentSearchOn] = useState(() => readPref('contentSearch'))
  useEffect(() => subscribePrefs(() => setContentSearchOn(readPref('contentSearch'))), [])
  const [contentSearching, setContentSearching] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewTarget | null>(null)
  const [diagOpen, setDiagOpen] = useState(false)
  // 顶栏一次性反馈（如「宿主未提供新建项目入口」）：琥珀条 + 自动消失
  const [notice, setNotice] = useState<string | null>(null)
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 6000)
    return () => window.clearTimeout(timer)
  }, [notice])
  const searchRef = useRef<HTMLInputElement>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem('dshw-theme') as 'light' | 'dark') || 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    // 宿主内只把主题落在 .wb-root 上（data-wb-theme）：改写 documentElement 的 data-theme
    // 会盖掉宿主自己的主题属性，退出本页后别的面板还留在深色里
    if (!IS_HOSTED) document.documentElement.setAttribute('data-theme', theme)
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
  const contentGroups: SearchGroup[] = useMemo(
    () => (state && contentHits.length > 0 ? groupContentHits(state, contentHits) : []),
    [state, contentHits],
  )

  // 正文检索：本地命中（项目/会话/待办）即时给，正文那一路防抖后走宿主
  useEffect(() => {
    const q = query.trim()
    if (!IS_HOSTED || !contentSearchOn || !searchOpen || q.length < CONTENT_SEARCH_MIN_CHARS) {
      setContentHits([])
      setContentSearching(false)
      setContentError(null)
      return
    }
    const controller = new AbortController()
    let cancelled = false
    setContentSearching(true)
    const timer = window.setTimeout(() => {
      searchContent(q, { signal: controller.signal }).then(
        (r) => {
          if (cancelled) return
          setContentHits(r.hits)
          setContentSearching(false)
          setContentError(null)
        },
        (e) => {
          if (cancelled || controller.signal.aborted) return
          setContentHits([])
          setContentSearching(false)
          setContentError(String((e as Error)?.message ?? e))
        },
      )
    }, CONTENT_SEARCH_DEBOUNCE_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query, searchOpen, contentSearchOn])

  // 官方客户端会话快照里的运行中会话（与侧栏同源）；未绑定时返回 null，由时间窗兜底
  const liveness = useSyncExternalStore(subscribeLiveness, getLivenessSnapshot)
  const liveIds: readonly string[] | null = liveness.ready ? liveness.ids : null

  // ⌘K / Ctrl+K 聚焦搜索；Esc 清空收起（弹层本身的关闭逻辑不变）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
        setSearchOpen(true)
      } else if (e.key === 'Escape' && searchOpen) {
        setQuery('')
        setSearchOpen(false)
        searchRef.current?.blur()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [searchOpen])

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

  const openSessionDirect = (sessionId: string) => {
    const uiWorkspace = getUiWorkspace?.()
    if (uiWorkspace?.openSession) {
      setSearchOpen(false)
      setQuery('')
      uiWorkspace.openSession(sessionId)
      return true
    }
    return false
  }

  /** 搜索结果：有会话就直达会话（宿主 openSession）；项目级命中/无服务时退到项目详情 */
  const openHit = (hit: SearchHit) => {
    if (hit.kind === 'content' && hit.sessionId) {
      setPreview({ sessionId: hit.sessionId, sessionTitle: hit.sessionTitle, query: query.trim() })
      setSearchOpen(false)
      return
    }
    if (hit.sessionId && openSessionDirect(hit.sessionId)) return
    openProject(hit.projectId)
  }

  const showPreview = (sessionId: string, sessionTitle: string | null) =>
    setPreview({ sessionId, sessionTitle, query: '' })

  const current = view.kind === 'l2' ? state.projects.find((p) => p.id === view.projectId) : null
  const noHits = groups.length === 0 && contentGroups.length === 0

  return (
    <div className="wb-root" data-wb-theme={theme}>
      <header className="wb-topbar">
        <div className="wb-topbar-inner">
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
              ref={searchRef}
              type="search"
              placeholder="搜索会话、待办、正文"
              aria-label="跨项目搜索项目、会话、待办与正文"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
            />
            <span className="wb-kbd" aria-hidden="true">
              {SHORTCUT_HINT}
            </span>
            {searchOpen && query.trim() && (
              <div className="wb-search-pop" role="listbox" aria-label="搜索结果">
                {noHits && !contentSearching && (
                  <div className="none">
                    {query.trim().length < CONTENT_SEARCH_MIN_CHARS
                      ? '没有匹配的项目、会话或待办'
                      : contentError
                        ? `正文检索失败：${contentError}`
                        : '没有匹配的项目、会话、待办或正文'}
                  </div>
                )}
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
                {contentGroups.length > 0 && (
                  <>
                    <div className="wb-search-sect">正文命中 · 点击只读预览</div>
                    {contentGroups.map((group) => (
                      <div key={`c-${group.projectId}`} className="wb-search-group">
                        <div className="grp">{group.projectTitle}</div>
                        {group.hits.map((hit, i) => (
                          <button
                            key={`content-${hit.sessionId}-${hit.seq ?? i}`}
                            type="button"
                            className="sr"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => openHit(hit)}
                          >
                            <div>
                              {renderRanges(hit.text, hit.ranges).map((part, j) =>
                                part.hit ? <mark key={j}>{part.text}</mark> : <span key={j}>{part.text}</span>,
                              )}
                            </div>
                            <div className="p">
                              {`正文 · ${hit.role === 'user' ? '用户' : '助手'} · ${hit.sessionTitle ?? '未命名会话'}`}
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </>
                )}
                {contentSearching && <div className="none">正在检索正文…</div>}
              </div>
            )}
          </div>
          <div className="wb-top-actions">
            <span className="wb-fresh num" title={`数据时间：${state ? new Date(state.generatedAt).toLocaleString() : '—'}`}>
              最近活动 · <b>{freshnessLabel(state?.generatedAt ?? null)}</b>
            </span>
            <button
              type="button"
              className="wb-newbtn"
              onClick={() => setNotice('宿主未提供新建项目入口：项目由打开的工作区自动聚合到这里')}
            >
              <Icon name="folder-plus" size={14} />
              新建项目
            </button>
            <button
              type="button"
              className="wb-iconbtn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="切换深浅主题"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
            </button>
          </div>
        </div>
      </header>

      {notice && (
        <div className="wb-notewrap">
          <div className="wb-notebar" role="status" onClick={() => setNotice(null)} title="点击关闭">
            <Icon name="alert-triangle" size={14} />
            <span>{notice}</span>
          </div>
        </div>
      )}

      {view.kind === 'l1' || !current ? (
        <Home
          state={state}
          liveIds={liveIds}
          onOpenProject={openProject}
          onOpenSession={openSessionDirect}
          getUiWorkspace={getUiWorkspace}
          onOpenDiagnostics={() => setDiagOpen(true)}
        />
      ) : (
        <Detail
          key={current.id}
          state={state}
          project={current}
          liveIds={liveIds}
          getUiWorkspace={getUiWorkspace}
          getWorkspaces={getWorkspaces}
          onPreview={showPreview}
          onOpenDiagnostics={() => setDiagOpen(true)}
          onChanged={refresh}
          onBack={() => setView({ kind: 'l1' })}
          onSwitch={openProject}
        />
      )}

      {preview && (
        <PreviewDrawer
          sessionId={preview.sessionId}
          sessionTitle={preview.sessionTitle}
          query={preview.query}
          onClose={() => setPreview(null)}
        />
      )}
      {diagOpen && (
        <DiagnosticsDrawer
          state={state}
          onOpenSession={(id) => {
            if (!openSessionDirect(id)) alert('当前环境无法直接打开会话（缺少宿主 uiWorkspace 服务）')
          }}
          getWorkspaces={getWorkspaces}
          onChanged={refresh}
          onClose={() => setDiagOpen(false)}
        />
      )}
    </div>
  )
}
