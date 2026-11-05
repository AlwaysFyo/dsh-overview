import { useEffect, useMemo, useRef, useState } from '../react.ts'
import type { ProjectState, SessionMeta, WorkbenchState } from '../../model/types.ts'
import {
  projectLiveness,
  projectTodoCount,
  projectTodos,
  splitSessions,
  todoCount,
  type ProjectLiveness,
} from '../api.ts'
import { queueResumeDraft } from '../resume.ts'
import {
  readManualTodos,
  removeManualTodo,
  subscribeManualTodos,
  toggleManualTodo,
} from '../manualTodos.ts'
import { fmtRelative, freshnessLabel } from '../util.ts'

/**
 * L1 主屏（v0.1.22「Base 主页式工作台」）：
 * hero 对话框（选项目 + 输任务 + 回车开新会话）→ 4 张数据前置统计卡（点击进子屏）
 * → 项目总览（密度卡 / 列表双视图）。子屏：运行中 / 继续工作 / 待办。
 * 取代旧 Wall 三格卡：密度卡保留三格数字形态，但配色与信息层级走新主题。
 */

type Screen = 'home' | 'running' | 'continue' | 'todos'

export interface UiWorkspaceLike {
  openSession?: (target: string) => void
  /** options.agentPreset：宿主按 preset 组合新会话（UiWorkspace.openWorkspace 第三参） */
  openWorkspace?: (
    workspaceId: string,
    cb: (nextSessionId: string) => void,
    options?: { agentPreset?: string },
  ) => unknown
}

/* ---------- 内联图标（插件不引图标库，16px 线性风格，仿 plugin.tsx SidebarIcon 写法） ---------- */

const ICONS = {
  'folder-plus': (
    <>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
      <path d="M12 10v6" />
      <path d="M9 13h6" />
    </>
  ),
  activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </>
  ),
  'list-todo': (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M8 9h8" />
      <path d="M8 14h5" />
    </>
  ),
  'alert-triangle': (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 20.99h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  'arrow-right': (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
  'arrow-left': (
    <>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </>
  ),
  'arrow-up': (
    <>
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </>
  ),
  'chevron-up': <path d="m18 15-6-6-6 6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m4.9 4.9 1.4 1.4" />
      <path d="m17.7 17.7 1.4 1.4" />
      <path d="m6.3 17.7-1.4 1.4" />
      <path d="m19.1 4.9-1.4 1.4" />
    </>
  ),
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  /* 会话行操作菜单：⋯ 触发器 + 菜单项（续接 / 预览 / 归档 / 取消归档 / 删除） */
  'more-horizontal': (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  'corner-up-right': (
    <>
      <path d="M4 12h11" />
      <path d="m11 8 4 4-4 4" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  archive: (
    <>
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
      <path d="M10 13h4" />
    </>
  ),
  unarchive: (
    <>
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
      <path d="M12 17v-5" />
      <path d="m9.5 14.5 2.5-2.5 2.5 2.5" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M6 6l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </>
  ),
  'file-text': (
    <>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </>
  ),
  'layout-grid': (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </>
  ),
} as const

export type IconName = keyof typeof ICONS

export function Icon({
  name,
  size = 16,
  className,
}: {
  name: IconName
  size?: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ? `wb-ic ${className}` : 'wb-ic'}
    >
      {ICONS[name]}
    </svg>
  )
}

/* ---------- 项目身份色：按 id 哈希进固定色盘，同一项目永远同色 ---------- */

const PALETTE = ['#8046f3', '#3586ff', '#10a893', '#47b382', '#25b0e7', '#e8a33d', '#7e53ff']

function projectColor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]!
}

/* 色盘上的字用白还是深色：7 个身份色里有 4 个配白字不到 4.5:1
   （#47b382 2.61、#e8a33d 2.00 等），按相对亮度当场挑一个达标的 */
function textOn(hex: string): string {
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255))
  const L = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
  return 1.05 / (L + 0.05) >= 4.5 ? '#ffffff' : '#181a1d'
}

const CONTINUE_WINDOW_MS = 7 * 24 * 3600_000
const CONTINUE_LIST_LIMIT = 10

interface RowData {
  p: ProjectState
  color: string
  tile: string
  liveness: ProjectLiveness
  activeCount: number
  archivedCount: number
  todoTotal: number
  manualCount: number
  latest: SessionMeta | null
  groups: ReturnType<typeof splitSessions>
}

export function Home({
  state,
  liveIds,
  onOpenProject,
  onOpenSession,
  getUiWorkspace,
  onOpenDiagnostics,
}: {
  state: WorkbenchState
  /** 运行中会话 id（官方客户端快照）；null 时 splitSessions 内部回退时间窗 */
  liveIds: readonly string[] | null
  onOpenProject: (projectId: string) => void
  /** 宿主 openSession 直达；返回 false 表示无服务（调用方自行降级到项目详情） */
  onOpenSession?: (sessionId: string) => boolean
  getUiWorkspace?: () => UiWorkspaceLike | null
  onOpenDiagnostics: () => void
}) {
  const now = Date.now()

  // 人工待办写在 localStorage：增删/勾选后要重新读，否则统计卡数字不动
  const [manualTick, setManualTick] = useState(0)
  useEffect(() => subscribeManualTodos(() => setManualTick((n) => n + 1)), [])

  const rows = useMemo<RowData[]>(() => {
    return state.projects.map((p) => {
      const manual = readManualTodos(p.id).filter((t) => !t.done)
      const latest = p.sessions.reduce<SessionMeta | null>(
        (acc, s) => (!acc || (s.lastActivityAt ?? 0) > (acc.lastActivityAt ?? 0) ? s : acc),
        null,
      )
      return {
        p,
        color: projectColor(p.id),
        tile: p.title.charAt(0).toUpperCase(),
        liveness: projectLiveness(p, now, liveIds ?? null),
        activeCount: p.sessions.filter((s) => !s.archived).length,
        archivedCount: p.sessions.filter((s) => s.archived).length,
        todoTotal: projectTodoCount(p) + manual.length,
        manualCount: manual.length,
        latest,
        groups: splitSessions(p, now, liveIds ?? null),
      }
    })
    // eslint 不在 lint 链路里；now 用 render 时的值即可
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, liveIds, manualTick])

  const runningList = useMemo(
    () =>
      rows
        .filter((r) => !r.p.archived)
        .flatMap((r) => r.groups.running.map((s) => ({ s, p: r.p, color: r.color })))
        .sort((a, b) => (b.s.lastActivityAt ?? 0) - (a.s.lastActivityAt ?? 0)),
    [rows],
  )
  const runIdSet = useMemo(() => new Set(runningList.map((x) => x.s.id)), [runningList])

  const continueList = useMemo(
    () =>
      rows
        .filter((r) => !r.p.archived)
        .flatMap((r) =>
          r.p.sessions
            .filter((s) => !s.archived && s.lastActivityAt !== null && now - s.lastActivityAt <= CONTINUE_WINDOW_MS)
            .map((s) => ({ s, p: r.p, color: r.color })),
        )
        .sort((a, b) => (b.s.lastActivityAt ?? 0) - (a.s.lastActivityAt ?? 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows],
  )

  const todoTotal = rows.reduce((sum, r) => sum + r.todoTotal, 0)
  const manualTotal = rows.reduce((sum, r) => sum + r.manualCount, 0)
  const diagCount = state.diagnostics.cacheIssues.length + state.diagnostics.unclaimed.length

  /* ---------- 子屏切换（Esc 返回；动画走 wb-sub 的 key 重挂载） ---------- */
  const [screen, setScreen] = useState<Screen>('home')
  useEffect(() => {
    if (screen === 'home') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setScreen('home')
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [screen])

  /* ---------- 总览筛选与视图 ---------- */
  const [filter, setFilter] = useState<'active' | 'archived' | 'all'>('active')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const visible = rows
    .filter((r) => (filter === 'all' ? true : filter === 'archived' ? !!r.p.archived : !r.p.archived))
    .sort((a, b) => (b.p.lastActivityAt ?? 0) - (a.p.lastActivityAt ?? 0))
  const totalSessions = rows.reduce((sum, r) => sum + r.p.sessions.length, 0)

  /* ---------- hero：选项目/模式 + 输任务 + 回车开新会话 ---------- */
  const [task, setTask] = useState('')
  const [pickOpen, setPickOpen] = useState(false)
  const [pickId, setPickId] = useState<string | null>(null)
  const [heroNotice, setHeroNotice] = useState<string | null>(null)
  const [modeId, setModeId] = useState('')
  const taskRef = useRef<HTMLTextAreaElement>(null)
  const pickRootRef = useRef<HTMLDivElement>(null)

  /* 模式 = DSH 的 agent preset（cordis.patch.yml 里声明，宿主组合会话时按 preset 装配）。
     preset 枚举没有客户端 RPC，声明在宿主配置里；这里给默认档 + 本地扩展位。 */
  const MODES: { id: string; label: string }[] = [{ id: '', label: '跟随 DSH 默认' }]

  const pickItems = useMemo(
    () => rows.filter((r) => !r.p.archived).sort((a, b) => (b.p.lastActivityAt ?? 0) - (a.p.lastActivityAt ?? 0)),
    [rows],
  )
  useEffect(() => {
    if (pickId && pickItems.some((r) => r.p.id === pickId)) return
    setPickId(pickItems[0]?.p.id ?? null)
  }, [pickItems, pickId])

  // 点外面收起项目下拉
  useEffect(() => {
    if (!pickOpen) return
    const onDown = (e: MouseEvent) => {
      if (!pickRootRef.current?.contains(e.target as Node)) setPickOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [pickOpen])

  /* hero 输入框跟随内容增高：textarea 不会自己长，CSS 只给了 38–132px 的区间，
     多行任务以前只能在 1 行的框里上下滚动。132px 与 themeCss 的 max-height 保持一致 */
  useEffect(() => {
    const el = taskRef.current
    if (!el || screen !== 'home') return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`
  }, [task, screen])

  const picked = pickItems.find((r) => r.p.id === pickId) ?? null

  const jump = () => {
    const text = task.trim()
    if (!picked) {
      setHeroNotice('当前没有可发起会话的项目')
      return
    }
    if (!text) {
      setHeroNotice(`先输入任务内容，回车后在「${picked.p.title}」中打开会话`)
      return
    }
    const ui = getUiWorkspace?.()
    if (!ui?.openWorkspace) {
      setHeroNotice('宿主未提供新建会话接口（dev 沙盒无此服务），无法从这里发起会话')
      return
    }
    if (!picked.p.workspaceId) {
      setHeroNotice(`「${picked.p.title}」没有登记工作区（孤儿项目），无法新建会话`)
      return
    }
    setHeroNotice(null)
    // 宿主切到该项目并开新会话；输入文字按新会话 id 入队，composer 挂载时注入草稿。
    // 模式经 openWorkspace 的 agentPreset 传给宿主（未选时 undefined = 宿主默认）。
    ui.openWorkspace(
      picked.p.workspaceId,
      (nextId) => queueResumeDraft(nextId, text),
      modeId ? { agentPreset: modeId } : undefined,
    )
    setTask('')
  }

  const openWithFallback = (sessionId: string, projectId: string) => {
    if (onOpenSession?.(sessionId)) return
    onOpenProject(projectId)
  }

  const badgeFor = (r: RowData) =>
    r.p.archived ? (
      <span className="wb-badge dim">已归档</span>
    ) : r.p.existsOnDisk ? null : (
      <span className="wb-badge warn">路径失效</span>
    )

  const dotFor = (r: RowData) =>
    r.liveness === 'running' ? 'wb-dot-run' : r.liveness === 'idle' ? 'wb-dot-idle' : 'wb-dot-off'

  /* ---------- 子屏 ---------- */
  const subhead = (title: string, hint: string) => (
    <div className="wb-subhead">
      <button type="button" className="wb-back-btn" onClick={() => setScreen('home')} aria-label="返回主屏">
        <Icon name="arrow-left" size={14} />
      </button>
      <h2>{title}</h2>
      <span className="hint num">{hint}</span>
    </div>
  )

  const renderSub = () => {
    if (screen === 'running') {
      return (
        <>
          {subhead('运行中', `${runningList.length} 条会话正在运行`)}
          {runningList.length === 0 ? (
            <div className="wb-empty-state">当前没有运行中的会话。在宿主里开始一个会话后会自动出现在这里。</div>
          ) : (
            runningList.map(({ s, p }) => (
              <button key={s.id} type="button" className="wb-runcard" onClick={() => openWithFallback(s.id, p.id)}>
                <span className="breathe" />
                <span className="wb-runcard-main">
                  <b>{s.title ?? '(无标题)'}</b>
                  <span className="num">
                    {p.title} · 运行 {fmtRelative(s.lastActivityAt)} · {s.turns ?? 0} 轮 · 待办 {todoCount(s)}
                  </span>
                </span>
                <span className="wb-openbtn">打开</span>
              </button>
            ))
          )}
        </>
      )
    }
    if (screen === 'continue') {
      const shown = continueList.slice(0, CONTINUE_LIST_LIMIT)
      return (
      <>
        {subhead('继续工作', `最近 7 天 · ${continueList.length} 条会话`)}
        {shown.length === 0 ? (
          <div className="wb-empty-state">最近 7 天没有会话活动。</div>
        ) : (
          <>
            <div className="wb-side-card is-tight">
              {shown.map(({ s, p }) => (
                <button key={s.id} type="button" className="wb-srow" onClick={() => openWithFallback(s.id, p.id)}>
                  <span className={'wb-dot ' + (runIdSet.has(s.id) ? 'wb-dot-run' : 'wb-dot-idle')} />
                  <span className="wb-srow-main">
                    <span className="t">{s.title ?? '(无标题)'}</span>
                    <span className="sub">
                      {p.title} · {s.turns ?? 0} 轮
                    </span>
                  </span>
                  <span className="m num">{fmtRelative(s.lastActivityAt)}</span>
                </button>
              ))}
            </div>
            {continueList.length > shown.length && (
              <p className="wb-listnote">还有 {continueList.length - shown.length} 条更早的 · 用顶栏搜索找它们</p>
            )}
          </>
        )}
        </>
      )
    }
    if (screen === 'todos') {
      const groups = rows
        .map((r) => ({
          r,
          host: projectTodos(r.p),
          manual: readManualTodos(r.p.id),
        }))
        .filter((g) => g.host.length > 0 || g.manual.length > 0)
        .sort((a, b) => (b.r.p.lastActivityAt ?? 0) - (a.r.p.lastActivityAt ?? 0))
      return (
      <>
        {subhead('待办', `${todoTotal} 条未完成 · ${groups.length} 个项目 · 含手动 ${manualTotal} 条`)}
        {groups.length === 0 ? (
          <div className="wb-empty-state">没有未完成的待办。会话内的 todo 记录会聚合到这里。</div>
        ) : (
          groups.map((g) => (
            <div key={g.r.p.id} className="wb-side-card">
              <h3>
                <span className="wb-mini sm" style={{ background: g.r.color, color: textOn(g.r.color) }}>
                  {g.r.tile}
                </span>
                {g.r.p.title}
                <span className={'cnt' + (g.host.length + g.manual.length ? ' hot' : '')}>
                  {g.host.length + g.manual.length}
                </span>
              </h3>
              <div className="wb-todo-feed">
                {g.host.map((t, i) => (
                  <div
                    key={`${t.sessionId}-${i}`}
                    className={'f is-click' + (t.status === 'in_progress' ? ' is-run' : '')}
                    onClick={() => openWithFallback(t.sessionId, g.r.p.id)}
                    title="打开来源会话"
                  >
                    <span className="f-txt">{t.content}</span>
                    <span className="f-w">{t.sessionTitle ?? '会话 ' + t.sessionId.slice(0, 8)}</span>
                  </div>
                ))}
                {g.manual.map((m) => (
                  <label key={m.id} className={'f f-manual' + (m.done ? ' is-done' : '')}>
                    <input
                      type="checkbox"
                      checked={m.done}
                      onChange={() => {
                        toggleManualTodo(g.r.p.id, m.id)
                        setManualTick((n) => n + 1)
                      }}
                    />
                    <span className="f-txt">{m.text}</span>
                    <span className="f-tag">手动</span>
                    <button
                      type="button"
                      className="f-del"
                      aria-label="删除这条手动待办"
                      onClick={() => {
                        removeManualTodo(g.r.p.id, m.id)
                        setManualTick((n) => n + 1)
                      }}
                    >
                      ×
                    </button>
                  </label>
                ))}
              </div>
            </div>
          ))
        )}
        </>
      )
    }
    return null
  }

  return (
    <>
      {screen !== 'home' && (
        <div className="wb-sub" key={screen}>
          <div className="wb-main">{renderSub()}</div>
        </div>
      )}

      {screen === 'home' && (
        <div className="wb-main">
          <>
          <div className="wb-hero">
            <div className="wb-herobox">
              <textarea
                ref={taskRef}
                rows={1}
                placeholder="描述要继续的任务或问题，回车后在所选项目中打开会话"
                aria-label="任务描述"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    jump()
                  }
                }}
              />
              <div className="wb-herorow">
                <div className="wb-pick" ref={pickRootRef}>
                  <button
                    type="button"
                    className="wb-pickbtn"
                    aria-haspopup="listbox"
                    aria-expanded={pickOpen}
                    onClick={() => setPickOpen(!pickOpen)}
                  >
                    {picked ? (
                      <>
                        <span className="wb-mini" style={{ background: picked.color, color: textOn(picked.color) }}>
                          {picked.tile}
                        </span>
                        {picked.p.title}
                      </>
                    ) : (
                      '选择项目'
                    )}
                    <Icon name="chevron-down" size={12} />
                  </button>
                  {pickOpen && (
                    <div className="wb-pickmenu" role="listbox" aria-label="选择项目">
                      <div className="wb-pickcap">在哪个项目中继续</div>
                      {pickItems.map((r) => (
                        <button
                          key={r.p.id}
                          type="button"
                          className="wb-pickitem"
                          role="option"
                          aria-selected={r.p.id === pickId}
                          onClick={() => {
                            setPickId(r.p.id)
                            setPickOpen(false)
                            taskRef.current?.focus()
                          }}
                        >
                          <span className="wb-mini" style={{ background: r.color, color: textOn(r.color) }}>
                            {r.tile}
                          </span>
                          {r.p.title}
                          {r.liveness === 'running' && <span className="wb-dot wb-dot-run" />}
                          <span className="n num">{r.activeCount} 会话</span>
                          <Icon name="check" size={13} className="ck" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="wb-hint">
                  回车 ↵ 在 <b>{picked?.p.title ?? '—'}</b> 中打开会话
                </span>
                <span className="wb-sel" title="模式由 DSH 的 agent preset 决定（cordis.patch.yml 声明后这里出现对应选项）">
                  <b>模式</b>
                  <select
                    value={modeId}
                    onChange={(e) => setModeId(e.target.value)}
                    aria-label="会话模式"
                  >
                    {MODES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <Icon name="chevron-down" size={11} />
                </span>
                <span
                  className="wb-sel"
                  title="宿主发起会话的接口暂不支持指定模型；模型跟随 DSH 全局默认，可在会话输入框里切换"
                >
                  <b>模型</b>
                  <span className="wb-sel-v">DSH 默认</span>
                </span>
                <button type="button" className="wb-send" aria-label="打开会话" onClick={jump}>
                  <Icon name="arrow-up" size={14} />
                </button>
              </div>
            </div>
            {heroNotice && (
              <div className="wb-notebar" role="status" onClick={() => setHeroNotice(null)} title="点击关闭">
                <Icon name="alert-triangle" size={14} />
                <span>{heroNotice}</span>
              </div>
            )}
          </div>

          <section className="wb-quick" aria-label="快捷入口">
            <button
              type="button"
              className={'wb-qcard' + (runningList.length ? ' is-run' : '')}
              onClick={() => setScreen('running')}
            >
              <span className="wb-qicon is-accent">
                <Icon name="activity" size={17} />
              </span>
              <span className="wb-qbody">
                <span className="wb-qlabel">运行中</span>
                <span className="wb-qvalue">
                  <b className="num">{runningList.length}</b>
                </span>
                <span className="wb-qdesc">
                  {runningList.length
                    ? runningList
                        .slice(0, 2)
                        .map((x) => x.p.title)
                        .join(' · ')
                    : '暂无运行中的会话'}
                </span>
              </span>
              <span className="wb-qgo">
                <Icon name="arrow-right" size={13} />
              </span>
            </button>
            <button type="button" className="wb-qcard" onClick={() => setScreen('continue')}>
              <span className="wb-qicon is-blue">
                <Icon name="history" size={17} />
              </span>
              <span className="wb-qbody">
                <span className="wb-qlabel">继续工作</span>
                <span className="wb-qvalue">
                  <b className="num">{continueList.length}</b>
                  <span className="delta">最近 7 天</span>
                </span>
                <span className="wb-qdesc">
                  {continueList[0] ? `最近：${continueList[0].s.title ?? '(无标题)'}` : '暂无近期会话'}
                </span>
              </span>
              <span className="wb-qgo">
                <Icon name="arrow-right" size={13} />
              </span>
            </button>
            <button type="button" className="wb-qcard" onClick={() => setScreen('todos')}>
              <span className="wb-qicon is-amber">
                <Icon name="list-todo" size={17} />
              </span>
              <span className="wb-qbody">
                <span className="wb-qlabel">待办</span>
                <span className="wb-qvalue">
                  <b className="num">{todoTotal}</b>
                  {manualTotal > 0 && <span className="delta hot">含手动 {manualTotal}</span>}
                </span>
                <span className="wb-qdesc">
                  {rows.filter((r) => r.todoTotal > 0).length
                    ? `分布在 ${rows.filter((r) => r.todoTotal > 0).length} 个项目`
                    : '暂无未完成待办'}
                </span>
              </span>
              <span className="wb-qgo">
                <Icon name="arrow-right" size={13} />
              </span>
            </button>
            <button type="button" className="wb-qcard" onClick={onOpenDiagnostics}>
              <span className="wb-qicon is-danger">
                <Icon name="alert-triangle" size={17} />
              </span>
              <span className="wb-qbody">
                <span className="wb-qlabel">诊断</span>
                <span className="wb-qvalue">
                  <b className="num">{diagCount}</b>
                </span>
                <span className="wb-qdesc">
                  {diagCount > 0
                    ? `缓存缺失 ${state.diagnostics.cacheIssues.length} · 无主转录 ${state.diagnostics.unclaimed.length}`
                    : '没有发现异常'}
                </span>
              </span>
              <span className="wb-qgo">
                <Icon name="arrow-right" size={13} />
              </span>
            </button>
          </section>

          <section className="wb-recent" aria-label="项目总览">
            <div className="wb-ovhead">
              <h2>项目总览</h2>
              <div className="tools">
                <div className="wb-seg" role="tablist" aria-label="项目状态筛选">
                  {(
                    [
                      ['active', '进行中', rows.filter((r) => !r.p.archived).length],
                      ['archived', '已归档', rows.filter((r) => !!r.p.archived).length],
                      ['all', '全部', rows.length],
                    ] as const
                  ).map(([key, label, count]) => (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={filter === key}
                      onClick={() => setFilter(key)}
                    >
                      {label}
                      <span className="cnt num">{count}</span>
                    </button>
                  ))}
                </div>
                <div className="wb-viewseg" role="group" aria-label="视图切换">
                  <button
                    type="button"
                    aria-pressed={viewMode === 'grid'}
                    aria-label="卡片视图"
                    onClick={() => setViewMode('grid')}
                  >
                    <Icon name="layout-grid" size={14} />
                  </button>
                  <button
                    type="button"
                    aria-pressed={viewMode === 'list'}
                    aria-label="列表视图"
                    onClick={() => setViewMode('list')}
                  >
                    <Icon name="list" size={14} />
                  </button>
                </div>
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="wb-empty-state">该分组下没有项目</div>
            ) : viewMode === 'grid' ? (
              <div className="wb-pgrid">
                {visible.map((r) => (
                  <button
                    key={r.p.id}
                    type="button"
                    className={
                      'wb-pcard' + (r.liveness === 'running' ? ' is-run' : '') + (r.p.archived ? ' is-arch' : '')
                    }
                    onClick={() => onOpenProject(r.p.id)}
                  >
                    <span className="wb-ptop">
                      <span className={'wb-dot ' + dotFor(r)} />
                      <span className="wb-pname">{r.p.title}</span>
                      {badgeFor(r)}
                      <span className="wb-plast num">最近活动 · {freshnessLabel(r.p.lastActivityAt)}</span>
                    </span>
                    <span className="wb-ppath mono">{r.p.path}</span>
                    <span className="wb-ptiles num">
                      <span className="wb-ptile">
                        <b>{r.activeCount}</b>
                        <span>近期活跃</span>
                      </span>
                      <span className="wb-ptile">
                        <b className={r.todoTotal ? 'hot' : ''}>{r.todoTotal}</b>
                        <span>待办</span>
                      </span>
                      <span className="wb-ptile">
                        <b>{r.archivedCount}</b>
                        <span>归档</span>
                      </span>
                    </span>
                    <span className="wb-pfoot">
                      <span className="t">{r.latest?.title ?? '—'}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="wb-lhead" aria-hidden="true">
                  <span>项目</span>
                  <span className="pth">路径</span>
                  <span className="r">活跃</span>
                  <span className="r">待办</span>
                  <span className="r">归档</span>
                  <span className="r">最近活动</span>
                  <span />
                </div>
                <div>
                  {visible.map((r) => (
                    <button
                      key={r.p.id}
                      type="button"
                      className={'wb-lrow' + (r.p.archived ? ' is-arch' : '')}
                      onClick={() => onOpenProject(r.p.id)}
                    >
                      <span className="nm">
                        <span className="wb-mini sm" style={{ background: r.color, color: textOn(r.color) }}>
                          {r.tile}
                        </span>
                        <span>{r.p.title}</span>
                        {badgeFor(r)}
                      </span>
                      <span className="pth mono">{r.p.path}</span>
                      <span className="n num">{r.activeCount}</span>
                      <span className={'n num' + (r.todoTotal ? ' hot' : '')}>{r.todoTotal}</span>
                      <span className="n num">{r.archivedCount}</span>
                      <span className="tm num">{fmtRelative(r.p.lastActivityAt)}</span>
                      <span />
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
          </>
        </div>
      )}
    </>
  )
}
