import { useMemo, useState } from '../react.ts'
import type { ProjectState, SessionMeta, WorkbenchState } from '../../model/types.ts'
import { runSerialBatch, type BatchResult } from '../../model/batch.ts'
import { idleCandidates, type IdleCandidate } from '../../model/organize.ts'
import {
  adoptSessions,
  deleteSession,
  migrateSessions,
  deleteSessionsBatch,
  splitSessions,
  projectTodoCount,
  projectTodos,
} from '../api.ts'
import type { SessionGroups } from '../api.ts'
import {
  addManualTodo,
  readManualTodos,
  removeManualTodo,
  toggleManualTodo,
  type ManualTodo,
} from '../manualTodos.ts'
import { buildResumeText, queueResumeDraft } from '../resume.ts'
import { fmtRelative } from '../util.ts'
import { Icon } from './Home.tsx'

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

/** 列表筛选：只做「按会话自身已加载的字段」能判定的三种，不假装能按内容过滤 */
type ListFilter = 'all' | 'todo' | 'untitled' | 'cacheOnly' | 'empty'
/** 列表排序：默认最近活动（与 buildState 的排序一致，翻页时不会跳） */
type ListSort = 'activity' | 'created' | 'turns'

const FILTER_LABEL: Record<ListFilter, string> = {
  all: '全部会话',
  todo: '有待办',
  untitled: '无标题',
  cacheOnly: '仅缓存记录',
  empty: '空壳会话',
}

const SORT_LABEL: Record<ListSort, string> = {
  activity: '最近活动',
  created: '创建时间',
  turns: '对话轮次',
}

/**
 * L2 工作区详情。
 *
 * 版式（对齐用户线框）：单行头部（返回 / 工作区名 + 路径 / 新建会话）→ 四格 KPI 条 →
 * 左列「tab + 筛选排序」+ 两行会话行，右栏两张卡（待办、诊断与变更）。
 * 统计口径：本页所有数字都只算本工作区；顶栏胶囊各自带「全部」标注。
 */
export function Detail({
  state,
  project,
  liveIds,
  getUiWorkspace,
  getWorkspaces,
  onPreview,
  onOpenDiagnostics,
  onChanged,
  onBack,
}: {
  state: WorkbenchState
  project: ProjectState
  /** 运行中会话 id（客户端会话快照）；未提供时回退时间窗 */
  liveIds?: readonly string[] | null
  getUiWorkspace?: GetUiWorkspace
  getWorkspaces?: GetWorkspaces
  /** 打开只读预览（父级负责抽屉） */
  onPreview?: (sessionId: string, sessionTitle: string | null) => void
  /** 打开数据诊断抽屉（右栏诊断卡） */
  onOpenDiagnostics?: () => void
  /** 会话归档/删除后由父级刷新数据 */
  onChanged?: () => void
  onBack: () => void
  /** 项目切换交给 L1 卡片墙（详情页不再放第二个切换器） */
  onSwitch?: (projectId: string) => void
}) {
  const [tab, setTab] = useState<'running' | 'history' | 'archived'>('running')
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [idleOpen, setIdleOpen] = useState(false)
  const [idleDays, setIdleDays] = useState(30)
  const [idlePicked, setIdlePicked] = useState<string[]>([])
  const [undoIds, setUndoIds] = useState<string[]>([])
  const [manual, setManual] = useState<ManualTodo[]>(() => readManualTodos(project.id))
  const [draft, setDraft] = useState('')
  const [adoptTarget, setAdoptTarget] = useState('')
  const [pop, setPop] = useState<'filter' | 'sort' | null>(null)
  const [filter, setFilter] = useState<ListFilter>('all')
  const [sort, setSort] = useState<ListSort>('activity')

  const groups = useMemo(() => splitSessions(project, Date.now(), liveIds ?? null), [project, liveIds])
  const idle = useMemo<IdleCandidate[]>(
    () => idleCandidates(project, { days: idleDays, liveIds: liveIds ?? null }),
    [project, idleDays, liveIds],
  )

  const todos = projectTodoCount(project)
  const manualOpen = manual.filter((t) => !t.done).length
  const todoTotal = todos + manualOpen
  const todoRows = useMemo(() => projectTodos(project), [project])
  const inProgressTodos = project.sessions.reduce(
    (sum, s) => sum + s.todos.filter((t) => t.status === 'in_progress').length,
    0,
  )

  /** KPI / 右栏数字全部只统计本工作区（顶栏胶囊另行标注「全部」） */
  const nowMs = Date.now()
  const todayStart = new Date().setHours(0, 0, 0, 0)
  const sessionCount = project.sessions.length
  const archivedCount = groups.archived.length
  const createdToday = project.sessions.filter((s) => (s.createdAt ?? 0) >= todayStart).length
  const activeRecent7 = project.sessions.filter((s) => (s.lastActivityAt ?? 0) >= nowMs - 7 * 86_400_000).length
  const manualToday = manual.filter((t) => t.createdAt >= todayStart).length
  /** 运行中列表：tab 的「进行中」用的是同一份 groups.running，两处数字不会打架 */
  const runningList = groups.running

  /** 诊断里属于本工作区的部分（投影缓存异常按会话 id、未归属按 cwd 比对） */
  const projectIds = new Set(project.sessions.map((s) => s.id))
  const projectKey = project.path.replace(/[\\/]+$/, '').toLowerCase()
  const myCacheIssues = state.diagnostics.cacheIssues.filter((c) => projectIds.has(c.sessionId))
  const myUnclaimed = state.diagnostics.unclaimed.filter(
    (u) => (u.cwd ?? '').replace(/[\\/]+$/, '').toLowerCase() === projectKey,
  )

  /** 左列实际展示的会话：先按 tab 分组，再筛，再排 */
  const visibleList = useMemo(() => {
    const base = groups[tab].filter((s) => {
      if (filter === 'todo') return s.todos.some((t) => t.status !== 'completed')
      if (filter === 'untitled') return s.title === null
      if (filter === 'cacheOnly') return s.source === 'cacheOnly'
      if (filter === 'empty') return s.empty
      return true
    })
    const sorted = base.slice()
    if (sort === 'created') sorted.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    else if (sort === 'turns') sorted.sort((a, b) => (b.turns ?? -1) - (a.turns ?? -1))
    else sorted.sort((a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0))
    return sorted
  }, [groups, tab, filter, sort])
  const filteredOut = groups[tab].length - visibleList.length

  /** 空壳会话：宿主新建后切走，磁盘留壳但它自己已经不再列出（运行中的不碰） */
  const shells = useMemo(() => {
    const live = new Set(liveIds ?? [])
    return project.sessions.filter((x) => x.empty && !x.archived && !live.has(x.id)).map((x) => x.id)
  }, [project.sessions, liveIds])

  /**
   * 右栏「诊断与变更」：只收左栏不重复的信息 —— 异常计数 + 今日变化 + 运行中。
   * 每条尽量带时间（有就用真实时间戳，没有就留空），不编造日期。
   */
  interface ChangeRow {
    key: string
    text: string
    at: number | null
    tone: 'warn' | 'ok' | 'muted'
  }
  const changes: ChangeRow[] = []
  if (runningList.length > 0) {
    changes.push({ key: 'running', text: `${runningList.length} 个会话正在执行`, at: nowMs, tone: 'ok' })
  }
  if (shells.length > 0) {
    changes.push({ key: 'shell', text: `${shells.length} 个空壳会话可清理`, at: null, tone: 'warn' })
  }
  if (myCacheIssues.length > 0) {
    const ids = new Set(myCacheIssues.map((c) => c.sessionId))
    const at = Math.max(
      0,
      ...project.sessions.filter((s) => ids.has(s.id)).map((s) => s.lastActivityAt ?? s.createdAt ?? 0),
    )
    changes.push({ key: 'untitled', text: `${myCacheIssues.length} 个会话缺少标题记录`, at: at || null, tone: 'warn' })
  }
  if (myUnclaimed.length > 0) {
    const at = Math.max(0, ...myUnclaimed.map((u) => u.createdAt ?? 0))
    changes.push({ key: 'unclaimed', text: `${myUnclaimed.length} 个转录未归属到本工作区`, at: at || null, tone: 'warn' })
  }
  if (createdToday > 0) {
    const at = Math.max(0, ...project.sessions.filter((s) => (s.createdAt ?? 0) >= todayStart).map((s) => s.createdAt ?? 0))
    changes.push({ key: 'created', text: `今日新建 ${createdToday} 个会话`, at: at || null, tone: 'muted' })
  }
  if (manualToday > 0) {
    changes.push({
      key: 'manual',
      text: `今日新增 ${manualToday} 条手动待办`,
      at: Math.max(...manual.filter((t) => t.createdAt >= todayStart).map((t) => t.createdAt)),
      tone: 'muted',
    })
  }
  if (archivedCount > 0) {
    const at = Math.max(0, ...groups.archived.map((s) => s.lastActivityAt ?? 0))
    changes.push({ key: 'archived', text: `归档会话 ${archivedCount} 个`, at: at || null, tone: 'muted' })
  }
  changes.sort((a, b) => (b.at ?? 0) - (a.at ?? 0))

  /**
   * 批量操作统一入口：删除走宿主批量路由（转录物理清理），归档/取消归档走官方 workspaces 服务。
   * 两边都收敛成 BatchResult，失败项留在 remaining 里，用户可以原样重试。
   */
  const applyBatch = (action: 'archive' | 'unarchive' | 'delete', ids: readonly string[]) => {
    if (ids.length === 0) return
    if (action === 'delete' && !confirm(`永久删除 ${ids.length} 个会话？（转录文件被删除，不可恢复）`)) return
    setBusy(true)
    setNotice(null)
    const run = async (): Promise<BatchResult> => {
      if (action === 'delete') return deleteSessionsBatch(ids)
      const ws = getWorkspaces?.()
      if (action === 'archive' && !ws?.archiveSession) throw new Error('归档服务不可用')
      if (action === 'unarchive' && !ws?.unarchiveSession) throw new Error('取消归档服务不可用')
      return runSerialBatch(ids, async (id) => {
        if (action === 'archive') await ws!.archiveSession!(id, { stopActivity: true })
        else await ws!.unarchiveSession!(id)
        return 'ok'
      })
    }
    void run().then(
      (r) => {
        setBusy(false)
        if (action === 'archive') setUndoIds(r.succeeded)
        const verb = action === 'archive' ? '归档' : action === 'unarchive' ? '取消归档' : '删除'
        const base = `${verb}：成功 ${r.succeeded.length} · 跳过 ${r.skipped.length} · 失败 ${r.failures.length}`
        setNotice(r.failures.length > 0 ? `${base}（${r.failures[0]?.error ?? '未知错误'}）` : base)
        const done = new Set([...r.succeeded, ...r.skipped])
        setSelected((prev) => prev.filter((id) => !done.has(id)))
        setIdlePicked((prev) => prev.filter((id) => !done.has(id)))
        onChanged?.()
      },
      (e) => {
        setBusy(false)
        setNotice(`操作失败：${String((e as Error)?.message ?? e)}`)
      },
    )
  }

  const undoArchive = () => {
    const ids = undoIds
    setUndoIds([])
    applyBatch('unarchive', ids)
  }

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const toggleIdle = (id: string) =>
    setIdlePicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const submitDraft = () => {
    if (!draft.trim()) return
    setManual(addManualTodo(project.id, draft))
    setDraft('')
  }

  /**
   * 新建会话：宿主 openWorkspace 会切到该工作区并开一个新会话。
   * 不自己造会话 id —— 会话头由宿主写，插件造出来的 id 打不开。
   */
  const newSession = () => {
    const ui = getUiWorkspace?.()
    if (!project.workspaceId) {
      setNotice('这个项目没有宿主工作区（多为目录改名/搬迁后的历史记录），无法新建会话。')
      return
    }
    if (!ui?.openWorkspace) {
      setNotice('宿主未提供新建会话接口（插件路由在应用启动时加载），请重启桌面应用后再试。')
      return
    }
    ui.openWorkspace(project.workspaceId, () => {})
  }

  /** 可并入的目标工作区（只列出真正注册过工作区的项目） */
  const adoptTargets = state.projects.filter((p) => p.workspaceId !== null && p.id !== project.id)

  /**
   * 宿主路由在内存里加载：装了新版插件但没重启应用时，客户端发的是 { workspaceId, cwd }，
   * 旧宿主还在按 { sessionIds } 校验，回一句「workspaceId and sessionIds are required」。
   * 这种原样抛出对用户毫无意义，直接翻译成可执行的下一步。
   */
  const hintFor = (message: string): string =>
    message.includes('sessionIds are required') || message.includes('workspaceId and sessionIds')
      ? '宿主插件仍是旧版本（路由在应用启动时加载），请重启桌面应用后再试'
      : message

  /** 目录名（用于提示文案） */
  const baseName = (p: string): string => p.split(/[\\/]/).filter(Boolean).pop() ?? p

  /**
   * 并入工作区：项目目录被改名/搬迁后，宿主会新建工作区而把旧会话留下 —— 它们在宿主成员表里
   * 查不到，插件只能当孤儿桶。这里把「这条旧 cwd」记进插件自己的归属表，聚合时按它归组。
   * 不写宿主 workspace.json：宿主成员表读取时就过滤 cwd 不匹配的会话，且是内存真相，
   * 文件里追加的 id 会在宿主下一次写入时消失（v0.1.14 的真机教训）。
   */
  const runAdopt = (target: ProjectState) => {
    const workspaceId = target.workspaceId
    if (!workspaceId) return
    const count = project.sessions.length
    const cwd = project.path
    const yes = confirm(
      `把「${cwd}」下的 ${count} 个会话归到工作区「${target.title}」下？\n\n` +
        '只写插件自己的归属表（~/.dsh/storages/dsh-overview-aliases.json），' +
        '不修改宿主 workspace.json，也不动转录文件与归档状态；' +
        '宿主的侧栏与 CLI 仍按它们自己的成员表，看不到这些会话。可随时「取消并入」。',
    )
    if (!yes) return
    setBusy(true)
    setNotice(null)
    void adoptSessions(workspaceId, cwd).then(
      (r) => {
        setBusy(false)
        setNotice(r.refreshError ? `已写入，但刷新失败：${r.refreshError}` : `已把「${baseName(cwd)}」归到「${target.title}」下（${count} 个会话）`)
        onChanged?.()
      },
      (e) => {
        setBusy(false)
        setNotice(`并入失败：${hintFor(String((e as Error)?.message ?? e))}`)
      },
    )
  }

  /** 撤销并入：删掉这条旧 cwd 的归属，会话回到孤儿桶 */
  const runForget = (cwd: string) => {
    if (!confirm(`取消「${baseName(cwd)}」的并入？这些会话会回到孤儿列表。`)) return
    setBusy(true)
    void adoptSessions('', cwd, { forget: true }).then(
      () => {
        setBusy(false)
        setNotice('已取消并入')
        onChanged?.()
      },
      (e) => {
        setBusy(false)
        setNotice(`取消失败：${hintFor(String((e as Error)?.message ?? e))}`)
      },
    )
  }

  /** 记录在旧路径下的会话（迁移的候选） */
  const staleIds = useMemo(
    () =>
      project.staleCwds.length === 0
        ? []
        : project.sessions
            .filter((s) => s.cwd !== null && project.staleCwds.some((cwd) => cwd === s.cwd))
            .map((s) => s.id),
    [project],
  )

  /**
   * 迁移：改写转录头 cwd + 搬目录，让宿主侧栏也归到这个工作区。
   * 与并入的区别就是「宿主认不认」——代价是写宿主转录文件，所以逐条备份、逐条报告。
   */
  const runMigrate = (workspaceId: string, rawIds: string[], title: string) => {
    // 运行中的会话可能正被宿主追加写入，迁移会动它的转录文件 —— 一律跳过，让用户先结束会话
    const running = new Set(groups.running.map((x) => x.id))
    const ids = rawIds.filter((id) => !running.has(id))
    const skippedRunning = rawIds.length - ids.length
    if (ids.length === 0) {
      setNotice('选中的会话都在运行中，先结束会话再迁移。')
      return
    }
    const yes = confirm(
      `把这 ${ids.length} 个会话真正迁移到「${title}」？\n\n` +
        '会改写每个转录头里的 cwd 并搬到对应目录（只重写首帧，其余帧逐字节保留）。' +
        '原件先备份到 ~/.dsh/storages/dsh-overview-migration-backup/，失败的那条不会动。' +
        '重启桌面应用后，宿主侧栏里它们就会出现在该工作区下。',
    )
    if (!yes) return
    setBusy(true)
    setNotice(null)
    void migrateSessions(workspaceId, ids).then(
      (r) => {
        setBusy(false)
        const first = r.failures[0]?.error
        setNotice(
          `迁移：成功 ${r.succeeded.length} · 失败 ${r.failures.length}${skippedRunning > 0 ? ` · 跳过运行中 ${skippedRunning}` : ''}${first ? `（${first}）` : ''}` +
            (r.refreshError ? `；刷新失败：${r.refreshError}` : ''),
        )
        onChanged?.()
      },
      (e) => {
        setBusy(false)
        setNotice(`迁移失败：${hintFor(String((e as Error)?.message ?? e))}`)
      },
    )
  }

  return (
    /* .wb-main 提供和 L1 一致的 24px 沟槽 + 1680px 上限：
       此前 L2 完全没有横向内边距，KPI / 列表 / 右栏是贴到窗口边上的，
       和顶栏（有 24px 内边距）不在同一条竖线上 */
    <section className="wb-main">
      <header className="wb-dhead">
        <button type="button" className="wb-back-btn" aria-label="返回工作区列表" title="返回工作区列表" onClick={onBack}>
          <Icon name="arrow-left" size={14} />
        </button>
        <div className="wb-dhead-main">
          <h1>{project.title}</h1>
          <span className="wb-proj-path mono">{project.path}</span>
        </div>
        <button
          type="button"
          className="wb-ghost-btn is-primary wb-new-session"
          disabled={busy}
          title={project.workspaceId ? '在这个工作区开一个新会话' : '孤儿项目没有宿主工作区，无法新建会话'}
          onClick={newSession}
        >
          新建会话
        </button>
      </header>

      {!project.existsOnDisk && (
        <div className="wb-dead-banner">工作区目录当前不存在（被移动或删除），以下为历史数据。</div>
      )}

      {project.staleCwds.length > 0 && (
        <div className="wb-stale-banner">
          有 {project.staleCwds.length} 个会话记录在旧路径 <span className="mono">{project.staleCwds[0]}</span>
          {project.staleCwds.length > 1 ? ` 等 ${project.staleCwds.length} 处` : ''}
          。项目被改名或移动过，会话已按工作区成员表或插件归属表归到这里，不影响统计与续接。
          {project.workspaceId !== null && staleIds.length > 0 ? (
            <button
              type="button"
              className="wb-link-btn"
              disabled={busy}
              title="改写转录头 cwd 并搬目录，让宿主侧栏也归到这个工作区"
              onClick={() => runMigrate(project.workspaceId!, staleIds, project.title)}
            >
              迁移到本项目（{staleIds.length}）
            </button>
          ) : null}
          {project.workspaceId !== null && project.staleCwds[0] ? (
            <button type="button" className="wb-link-btn" disabled={busy} onClick={() => runForget(project.staleCwds[0]!)}>
              取消并入
            </button>
          ) : null}
        </div>
      )}

      {project.workspaceId === null && adoptTargets.length > 0 && (
        <div className="wb-adopt">
          <span className="txt">
            这个项目没有对应的宿主工作区（多为目录改名/搬迁后的历史记录）。可以把它的 {project.sessions.length} 个会话归到某个现有工作区下：「并入」只改插件归属表（宿主侧栏仍显示未分组），「迁移过来」会改写转录头 cwd（宿主也认，会先备份）：
          </span>
          <select aria-label="选择目标工作区" value={adoptTarget} onChange={(e) => setAdoptTarget(e.target.value)}>
            <option value="">选择工作区…</option>
            {adoptTargets.map((p) => (
              <option key={p.workspaceId} value={p.workspaceId ?? ''}>
                {p.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="wb-ghost-btn is-primary"
            disabled={busy || !adoptTarget}
            onClick={() => {
              const target = adoptTargets.find((p) => p.workspaceId === adoptTarget)
              if (target) runAdopt(target)
            }}
          >
            并入
          </button>
          <button
            type="button"
            className="wb-ghost-btn"
            disabled={busy || !adoptTarget}
            title="改写转录头 cwd 并搬目录：宿主侧栏也认（会先备份）"
            onClick={() => {
              const target = adoptTargets.find((p) => p.workspaceId === adoptTarget)
              if (target?.workspaceId) runMigrate(target.workspaceId, project.sessions.map((x) => x.id), target.title)
            }}
          >
            迁移过来
          </button>
        </div>
      )}

      {/* 四格等宽 KPI：标签在上、数值在下。0 值弱化，变化量跟数值同一行 */}
      <div className="wb-kpi num" title="统计范围：本工作区（当前项目）">
        <div className={`kv${sessionCount === 0 ? ' is-zero' : ''}`}>
          <span className="k">会话</span>
          <span className="vv">
            <span className="v">{sessionCount}</span>
            {createdToday > 0 && <span className="d">+{createdToday} 今日</span>}
          </span>
        </div>
        <div className={`kv${todoTotal === 0 ? ' is-zero' : ''}`}>
          <span className="k">待办</span>
          <span className="vv">
            <span className="v">{todoTotal}</span>
            {inProgressTodos > 0 && <span className="d">{inProgressTodos} 进行中</span>}
          </span>
        </div>
        <div className={`kv${archivedCount === 0 ? ' is-zero' : ''}`}>
          <span className="k">归档</span>
          <span className="vv">
            <span className="v">{archivedCount}</span>
          </span>
        </div>
        <div className={`kv${activeRecent7 === 0 ? ' is-zero' : ''}`}>
          <span className="k">近 7 日活跃</span>
          <span className="vv">
            <span className="v">{activeRecent7}</span>
          </span>
        </div>
      </div>

      <div className="wb-cols">
        <div>
          <div className="wb-listbar">
            <div className="wb-tabs" role="tablist" aria-label="本项目的会话分组">
              <button
                type="button"
                className="wb-tab"
                role="tab"
                aria-selected={tab === 'running'}
                title="本项目进行中的会话（顶栏「运行中」统计的是全部工作区）"
                onClick={() => setTab('running')}
              >
                进行中<span className="cnt num">{groups.running.length}</span>
              </button>
              <button type="button" className="wb-tab" role="tab" aria-selected={tab === 'history'} title="本项目的历史会话" onClick={() => setTab('history')}>
                历史<span className="cnt num">{groups.history.length}</span>
              </button>
              <button type="button" className="wb-tab" role="tab" aria-selected={tab === 'archived'} title="本项目已归档的会话" onClick={() => setTab('archived')}>
                归档<span className="cnt num">{groups.archived.length}</span>
              </button>
            </div>
            <div className="wb-listctl">
              <button
                type="button"
                className={`wb-ctl${filter !== 'all' ? ' is-on' : ''}`}
                aria-haspopup="true"
                aria-expanded={pop === 'filter'}
                onClick={() => setPop(pop === 'filter' ? null : 'filter')}
              >
                筛选{filter !== 'all' ? <span className="cnt">·1</span> : null}
              </button>
              <button
                type="button"
                className={`wb-ctl${sort !== 'activity' ? ' is-on' : ''}`}
                aria-haspopup="true"
                aria-expanded={pop === 'sort'}
                onClick={() => setPop(pop === 'sort' ? null : 'sort')}
              >
                排序<span className="caret">▾</span>
              </button>
              {pop !== null && <div className="wb-pop-scrim" onClick={() => setPop(null)} />}
              {pop === 'filter' && (
                <div className="wb-pop" role="menu" aria-label="筛选与整理">
                  <div className="pop-hd">筛选</div>
                  {(Object.keys(FILTER_LABEL) as ListFilter[]).map((key) => (
                    <button
                      type="button"
                      key={key}
                      role="menuitemradio"
                      aria-checked={filter === key}
                      className="pop-row"
                      onClick={() => {
                        setFilter(key)
                        setPop(null)
                      }}
                    >
                      <span>{FILTER_LABEL[key]}</span>
                      {filter === key && <span className="tick">✓</span>}
                    </button>
                  ))}
                  <div className="pop-sep" />
                  <button
                    type="button"
                    className="pop-row"
                    onClick={() => {
                      setSelecting(!selecting)
                      setSelected([])
                      setPop(null)
                    }}
                  >
                    {selecting ? '完成选择' : '批量选择'}
                  </button>
                  <button
                    type="button"
                    className="pop-row"
                    onClick={() => {
                      setIdleOpen(!idleOpen)
                      setIdlePicked([])
                      setPop(null)
                    }}
                  >
                    整理闲置…
                  </button>
                  {shells.length > 0 && (
                    <button
                      type="button"
                      className="pop-row"
                      disabled={busy}
                      title="宿主新建会话后切走留下的空壳（转录里没有任何消息），宿主已不再列出，删掉不影响任何对话"
                      onClick={() => {
                        setPop(null)
                        applyBatch('delete', shells)
                      }}
                    >
                      清理空壳会话（{shells.length}）
                    </button>
                  )}
                  {undoIds.length > 0 && (
                    <button
                      type="button"
                      className="pop-row"
                      disabled={busy}
                      onClick={() => {
                        setPop(null)
                        undoArchive()
                      }}
                    >
                      撤销归档（{undoIds.length}）
                    </button>
                  )}
                </div>
              )}
              {pop === 'sort' && (
                <div className="wb-pop" role="menu" aria-label="排序">
                  <div className="pop-hd">排序</div>
                  {(Object.keys(SORT_LABEL) as ListSort[]).map((key) => (
                    <button
                      type="button"
                      key={key}
                      role="menuitemradio"
                      aria-checked={sort === key}
                      className="pop-row"
                      onClick={() => {
                        setSort(key)
                        setPop(null)
                      }}
                    >
                      <span>{SORT_LABEL[key]}</span>
                      {sort === key && <span className="tick">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {notice && <div className="wb-listnote">{notice}</div>}
          {filter !== 'all' && filteredOut > 0 && (
            <div className="wb-listnote num">
              已按「{FILTER_LABEL[filter]}」过滤掉 {filteredOut} 个会话
            </div>
          )}

          {idleOpen && (
            <div className="wb-idle-panel">
              <div className="hd">
                超过
                <select
                  aria-label="闲置天数阈值"
                  value={idleDays}
                  onChange={(e) => {
                    setIdleDays(Number(e.target.value))
                    setIdlePicked([])
                  }}
                >
                  <option value={7}>7</option>
                  <option value={30}>30</option>
                  <option value={90}>90</option>
                </select>
                天没有活动的未归档会话（运行中、等待交互、当前会话自动排除）
              </div>
              {idle.length === 0 ? (
                <div className="wb-side-empty">没有符合条件的会话，说明这个项目还挺活跃。</div>
              ) : (
                <>
                  <ul className="wb-pick-list">
                    {idle.map((c) => (
                      <li key={c.sessionId}>
                        <label>
                          <input type="checkbox" checked={idlePicked.includes(c.sessionId)} onChange={() => toggleIdle(c.sessionId)} />
                          <span className="t">{c.title ?? '(无标题)'}</span>
                        </label>
                        <span className="m num">{c.idleDays} 天未动</span>
                      </li>
                    ))}
                  </ul>
                  <div className="wb-idle-actions">
                    <button
                      type="button"
                      className="wb-ghost-btn"
                      onClick={() => setIdlePicked(idle.map((c) => c.sessionId))}
                    >
                      全选（{idle.length}）
                    </button>
                    <button
                      type="button"
                      className="wb-ghost-btn is-primary"
                      disabled={busy || idlePicked.length === 0}
                      onClick={() => applyBatch('archive', idlePicked)}
                    >
                      归档选中（{idlePicked.length}）
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {selecting && (
            <div className="wb-batchbar">
              <span className="n num">已选 {selected.length}</span>
              <button
                type="button"
                className="wb-ghost-btn"
                disabled={busy || selected.length === 0}
                onClick={() => applyBatch(tab === 'archived' ? 'unarchive' : 'archive', selected)}
              >
                {tab === 'archived' ? '取消归档' : '归档'}
              </button>
              <button
                type="button"
                className="wb-ghost-btn wb-danger"
                disabled={busy || selected.length === 0}
                onClick={() => applyBatch('delete', selected)}
              >
                永久删除
              </button>
              <button type="button" className="wb-ghost-btn" onClick={() => setSelected([])}>
                清空
              </button>
              <button
                type="button"
                className="wb-ghost-btn"
                onClick={() => {
                  setSelecting(false)
                  setSelected([])
                }}
              >
                完成
              </button>
            </div>
          )}

          <SessionList
            list={visibleList}
            tab={tab}
            project={project}
            selecting={selecting}
            selected={selected}
            onToggle={toggle}
            onPreview={onPreview}
            getUiWorkspace={getUiWorkspace}
            getWorkspaces={getWorkspaces}
            onChanged={onChanged}
          />
        </div>

        <aside>
          <div className="wb-side-card">
            <h3>
              待办
              <span className="cnt num">{manualOpen + todoRows.length}</span>
            </h3>
            <form
              className="wb-todo-add"
              onSubmit={(e) => {
                e.preventDefault()
                submitDraft()
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="添加一条待办…"
                aria-label="添加人工待办"
                maxLength={200}
              />
              <button type="submit" className="wb-ghost-btn is-primary" disabled={!draft.trim()}>
                添加
              </button>
            </form>
            {manualOpen + todoRows.length === 0 ? (
              <div className="wb-side-empty">
                暂无未完成待办。会话内的 todo 记录会聚合到这里，也可以在上面手动记一条。
              </div>
            ) : (
              <div className="wb-feed wb-todo-feed">
                {manual
                  .slice()
                  .sort((a, b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt)
                  .map((t) => (
                    <div className={`f f-manual${t.done ? ' is-done' : ''}`} key={t.id}>
                      <input
                        type="checkbox"
                        checked={t.done}
                        aria-label="标记待办完成"
                        onChange={() => setManual(toggleManualTodo(project.id, t.id))}
                      />
                      <span className="f-txt">{t.text}</span>
                      <span className="f-tag">手动</span>
                      <button
                        type="button"
                        className="f-del"
                        aria-label="删除待办"
                        title="删除这条待办"
                        onClick={() => setManual(removeManualTodo(project.id, t.id))}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                {todoRows.map((t, i) => (
                  <div className={`f${t.status === 'in_progress' ? ' is-run' : ''}`} key={`${t.sessionId}-${i}`}>
                    <span className="f-txt">{t.content}</span>
                    <span className="f-w">{t.sessionTitle ?? '未命名会话'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 右栏只放左栏没有的信息：异常、变化与运行中，不再复述会话标题 */}
          <div className="wb-side-card">
            <h3>
              诊断与变更
              <span className="cnt num">{changes.length}</span>
            </h3>
            {changes.length === 0 ? (
              <div className="wb-side-empty">没有异常，最近也没有变化。今日有活动 {project.sessions.filter((s) => (s.lastActivityAt ?? 0) >= todayStart).length} 个会话。</div>
            ) : (
              <div className="wb-timeline">
                {changes.map((c) => (
                  <div className={`wb-tl is-${c.tone}`} key={c.key}>
                    <span className="tl-dot" />
                    <span className="tl-txt">{c.text}</span>
                    <span className="tl-when num">{c.at ? fmtRelative(c.at) : ''}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="wb-side-foot">
              <span>会话明细见左侧列表</span>
              {onOpenDiagnostics && (
                <button type="button" className="wb-link-btn" onClick={onOpenDiagnostics}>
                  打开数据诊断
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

/**
 * 会话行的第二行（线框里的灰色副标题）：只说这一行会话自己身上已经加载的事实，
 * 不为了「看起来有副标题」去编内容。没有可说的就不占行高。
 */
function rowSubtitle(s: SessionMeta, tab: keyof SessionGroups): string | null {
  if (tab === 'running') return '正在执行'
  const open = s.todos.filter((t) => t.status !== 'completed')
  if (open.length > 0) {
    const head = open[0]!.content
    return `待办 · ${head}${open.length > 1 ? `（共 ${open.length} 条）` : ''}`
  }
  if (s.source === 'cacheOnly') return '只有缓存记录，会话文件已不在磁盘'
  if (s.origin === 'subagent') return '子代理会话（宿主侧栏不显示）'
  if (tab === 'archived') return '已归档'
  return null
}

function SessionList({
  list,
  tab,
  project,
  selecting,
  selected,
  onToggle,
  onPreview,
  getUiWorkspace,
  getWorkspaces,
  onChanged,
}: {
  list: SessionMeta[]
  tab: keyof SessionGroups
  project: ProjectState
  selecting: boolean
  selected: readonly string[]
  onToggle: (id: string) => void
  onPreview?: (sessionId: string, sessionTitle: string | null) => void
  getUiWorkspace?: GetUiWorkspace
  getWorkspaces?: GetWorkspaces
  onChanged?: () => void
}) {
  /* 每行的「⋯」操作菜单：同一时刻只允许一行展开。
     hooks 必须在下面的空列表提前 return 之前调用，否则首渲染与后续渲染的 hook 顺序不一致 */
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  /* 靠近视口底部的行向下展开会被挤出屏幕：打开时按剩余高度决定向上还是向下 */
  const [menuUp, setMenuUp] = useState(false)

  if (list.length === 0) {
    return (
      <div className="wb-side-empty is-pad">
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
      {list.map((s) => {
        const sub = rowSubtitle(s, tab)
        return (
          <div
            className={`wb-srow${selected.includes(s.id) ? ' is-picked' : ''}`}
            key={s.id}
            role="button"
            tabIndex={0}
            onClick={() => resume(s)}
            onKeyDown={(e) => {
              // 焦点在行内操作菜单里时，Enter/Space 属于菜单本身，不要再触发整行续接
              if ((e.target as HTMLElement).closest?.('.wb-sact')) return
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                resume(s)
              }
            }}
          >
            {selecting && (
              <input
                type="checkbox"
                className="wb-srow-check"
                checked={selected.includes(s.id)}
                aria-label={`选择会话 ${s.title ?? s.id}`}
                onChange={(e) => {
                  e.stopPropagation()
                  onToggle(s.id)
                }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <span className={`wb-dot ${tab === 'archived' ? 'wb-dot-off' : tab === 'running' ? 'wb-dot-run' : 'wb-dot-idle'}`} />
            <span className="wb-srow-main">
              <span className="wb-srow-t">
                <span className="t">{s.title ?? '(无标题)'}</span>
                {s.derived && (
                  <span className="wb-tag is-sub" title="子会话：cwd 与本项目不同，靠母会话归到这里">
                    子会话
                  </span>
                )}
                {s.empty && (
                  <span className="wb-tag is-empty" title="宿主新建会话后切走留下的空壳：转录里没有任何消息，宿主侧已不再列出">
                    空壳
                  </span>
                )}
              </span>
              {sub && <span className="sub">{sub}</span>}
            </span>
            <span className="m num">
              {s.turns !== null ? `${s.turns} 轮 · ` : ''}
              {fmtRelative(s.lastActivityAt)}
            </span>
            <span className={'wb-sact' + (openMenu === s.id ? ' is-open' : '')}>
              {openMenu === s.id && (
                <span
                  className="wb-sact-scrim"
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenMenu(null)
                  }}
                />
              )}
              <button
                type="button"
                className="wb-sact-btn"
                aria-haspopup="menu"
                aria-expanded={openMenu === s.id}
                aria-label="会话操作"
                title="会话操作"
                onClick={(e) => {
                  e.stopPropagation()
                  if (openMenu === s.id) {
                    setOpenMenu(null)
                    return
                  }
                  const r = e.currentTarget.getBoundingClientRect()
                  setMenuUp(r.bottom > window.innerHeight - 200)
                  setOpenMenu(s.id)
                }}
              >
                <Icon name="more-horizontal" size={15} />
              </button>
              {openMenu === s.id && (
                <span
                  className={'wb-sact-menu' + (menuUp ? ' is-up' : '')}
                  role="menu"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenMenu(null)
                      resume(s)
                    }}
                  >
                    <Icon name="corner-up-right" size={14} />
                    续接
                  </button>
                  {onPreview && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpenMenu(null)
                        onPreview(s.id, s.title)
                      }}
                    >
                      <Icon name="eye" size={14} />
                      只读预览
                    </button>
                  )}
                  {tab === 'archived' ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpenMenu(null)
                        mark('unarchive', s)
                      }}
                    >
                      <Icon name="unarchive" size={14} />
                      取消归档
                    </button>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpenMenu(null)
                        mark('archive', s)
                      }}
                    >
                      <Icon name="archive" size={14} />
                      归档
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    className="wb-danger"
                    onClick={() => {
                      setOpenMenu(null)
                      if (confirm('永久删除该会话？（会话文件将被删除，不可恢复）')) mark('delete', s)
                    }}
                  >
                    <Icon name="trash" size={14} />
                    永久删除
                  </button>
                </span>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
