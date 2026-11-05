import type {
  CacheIssue,
  Diagnostics,
  ProjcacheRecord,
  ProjectState,
  SessionFileInfo,
  SessionMeta,
  UnclaimedSession,
  WorkbenchState,
} from './types.ts'
import { statSync } from 'node:fs'
import { normalizePath, sessionIdVariants } from './paths.ts'
import { extractLastPromptAt, extractTitle, extractTokenTotals, extractTodoItems, extractTurns } from './rows.ts'
import {
  readArchiveRecords,
  readHostArchivedIds,
  readProjcacheRecords,
  readSessionHeads,
  probeSessionFile,
  readWorkspaces,
  type SourceResult,
  type WorkspaceEntry,
} from './sources.ts'
import { archiveDir, projcacheDir, sessionsRoot, workspaceJsonPath } from './paths.ts'

export interface BuildStateOptions {
  /** DSH home 目录；默认 ~/.dsh（测试时传 fixture 目录） */
  home: string
  /** 工作区目录存在性检查（测试/离线环境可关） */
  checkDisk?: boolean
  /**
   * 插件自己的归属表：normalizePath(旧 cwd) → workspaceId（见 src/host/adopt.ts）。
   * 成员表查不到时用它兜底 —— 项目改名/搬目录后宿主不会保留成员关系，cwd 又指向旧路径。
   */
  aliases?: Record<string, string>
}

/**
 * 聚合四源 → WorkbenchState。
 *
 * 关联键（本机探查验证，scripts/probe-projcache-map.mjs，46/47 命中）：
 *  - projcache ↔ 会话文件：normalizePath(identity.cwd) + identity.createdAt === head.createdAt
 *  - 归档记录 ↔ 项目：record.sessionId 自标识 + identity.cwd
 *  - 会话 ↔ 工作区：normalizePath(cwd) === normalizePath(workspace.path)
 */
export async function buildState(options: BuildStateOptions): Promise<WorkbenchState> {
  const warnings: string[] = []
  const { home } = options
  const checkDisk = options.checkDisk ?? true
  const aliases = options.aliases ?? {}

  const wsRes = readWorkspaces(workspaceJsonPath(home))
  const arcRes = readHostArchivedIds(workspaceJsonPath(home))
  const pcRes = readProjcacheRecords(projcacheDir(home))
  const arRes = readArchiveRecords(archiveDir(home))
  const sfRes = await readSessionHeads(sessionsRoot(home))
  warnings.push(...wsRes.warnings, ...arcRes.warnings, ...pcRes.warnings, ...arRes.warnings, ...sfRes.warnings)

  // 宿主归档集合：唯一归档真相。live 会话也可以处于归档态（归档不删文件），
  // 因此这里不能把「有会话文件」等同于「未归档」。
  const archivedIds = new Set(arcRes.data)
  const isArchivedInHost = (id: string): boolean =>
    archivedIds.has(id) ||
    archivedIds.has(id.startsWith('session-') ? id.slice('session-'.length) : `session-${id}`)

  // projcache 按 (cwd, createdAt) 建索引
  const pcByKey = new Map<string, ProjcacheRecord>()
  for (const rec of pcRes.data) {
    const key = `${normalizePath(rec.record.identity.cwd)}|${rec.record.identity.createdAt}`
    // 后写覆盖先写：projcache 每个 (cwd, createdAt) 理论上唯一
    pcByKey.set(key, rec)
  }

  interface MetaBase {
    id: string
    archived: boolean
    source: SessionMeta['source']
    dirName: string | null
  }
  const metaForRecord = (rec: ProjcacheRecord, base: MetaBase): SessionMeta => ({
    id: rec.record.sessionId ?? base.id,
    title: extractTitle(rec),
    cwd: rec.record.identity.cwd,
    createdAt: rec.record.identity.createdAt,
    lastPromptAt: extractLastPromptAt(rec),
    lastActivityAt: null,
    turns: extractTurns(rec),
    tokenTotals: extractTokenTotals(rec),
    todos: extractTodoItems(rec),
    archived: base.archived,
    source: base.source,
    dirName: base.dirName,
    origin: null,
    parentSession: null,
    derived: false,
    sizeBytes: null,
    empty: false,
  })

  // 1) 归档会话：record.sessionId 自标识（仅作元数据兜底，归档状态见第 5 步）
  const sessions = new Map<string, SessionMeta>()
  for (const rec of arRes.data) {
    const id = rec.record.sessionId
    if (!id) continue
    const meta = metaForRecord(rec, { id: rec.record.sessionId!, archived: false, source: 'archive', dirName: null })
    meta.lastActivityAt = meta.lastPromptAt ?? meta.createdAt
    sessions.set(id, meta)
  }

  // 2) 会话文件：头 + projcache 合并
  const noRecordIds = new Set<string>()
  for (const info of sfRes.data) {
    const head = info.head
    const pcKey = `${normalizePath(head.cwd)}|${head.createdAt}`
    const rec = pcByKey.get(pcKey)
    const meta: SessionMeta = rec
      ? metaForRecord(rec, {
          id: head.id,
          archived: false,
          source: 'live',
          dirName: info.dirName,
        })
      : {
          id: head.id,
          title: null,
          cwd: head.cwd,
          createdAt: head.createdAt,
          lastPromptAt: null,
          lastActivityAt: null,
          turns: null,
          tokenTotals: null,
          todos: [],
          archived: false,
          source: 'live',
          dirName: info.dirName,
          origin: null,
          parentSession: null,
          derived: false,
          sizeBytes: null,
          empty: false,
        }
    if (!rec) noRecordIds.add(head.id)
    meta.origin = typeof head.origin === 'string' ? head.origin : null
    meta.parentSession = typeof head.parentSession === 'string' ? head.parentSession : null
    meta.sizeBytes = info.size
    meta.lastActivityAt = Math.max(meta.lastPromptAt ?? 0, info.fileMtime) || meta.lastPromptAt || info.fileMtime
    // live 数据优先于同 id 的 archive/cacheOnly
    const prev = sessions.get(head.id)
    if (!prev || prev.source !== 'live') sessions.set(head.id, meta)
  }

  // 2b) 没有 projcache 标题的 live 会话：用首条 user 消息兜底（流式扫描，缺标题才读）。
  //     这类会话在真实数据里不算少（宿主并非每次都写 title 行），裸 id 对用户没有信息量。
  const infoById = new Map(sfRes.data.map((info) => [info.head.id, info]))
  for (const meta of sessions.values()) {
    if (meta.source !== 'live' || meta.title) continue
    const info = infoById.get(meta.id)
    if (!info) continue
    // 顺带判定空壳会话：没有标题 + 扫完整个文件也没有任何消息 = 宿主新建后切走留下的空壳
    const probe = await probeSessionFile(info.file)
    if (probe.title) meta.title = probe.title
    meta.empty = probe.complete && !probe.hasMessages
  }

  // 3) 仅 projcache 有记录的会话（会话文件缺失，如清理过）
  for (const rec of pcRes.data) {
    const alreadyCovered = [...sessions.values()].some(
      (s) =>
        s.cwd !== null &&
        normalizePath(s.cwd) === normalizePath(rec.record.identity.cwd) &&
        s.createdAt === rec.record.identity.createdAt,
    )
    if (alreadyCovered) continue
    const candidateId = `pc-${rec.record.identity.createdAt}-${normalizePath(rec.record.identity.cwd)}`
    const meta = metaForRecord(rec, { id: candidateId, archived: false, source: 'cacheOnly', dirName: null })
    meta.lastActivityAt = meta.lastPromptAt ?? meta.createdAt
    sessions.set(meta.id, meta)
  }

  // 4) 丢弃孤儿归档记录：只在归档缓存里、没有转录文件、且宿主归档集合里也没有的会话。
  //    归档缓存是宿主写下的历史快照（本机 32 条里多数已无会话文件也不必再显示）；这类行
  //    打不开、删除也只能清记账，留在列表里就是"无标题且删不掉"的幽灵记录。
  //    宿主明确归档的 id 仍然保留（归档不删文件，文件缺失时也应能取消归档/删除）。
  let staleArchiveRecords = 0
  for (const [id, meta] of sessions) {
    if (meta.source === 'archive' && !meta.dirName && !isArchivedInHost(id)) {
      sessions.delete(id)
      staleArchiveRecords += 1
    }
  }

  // 5) 按归属归组到工作区：workspace.sessionIds 是权威成员表，cwd 只是旧路径线索
  const claimedKeys = new Set<string>()
  for (const ws of wsRes.data) {
    for (const sid of ws.sessionIds) for (const key of sessionIdVariants(sid)) claimedKeys.add(key)
  }
  // 归属表里有的旧 cwd 也算「已归属」：它们是被用户显式并进某个工作区的，不该再出现在
  // 「无主转录」诊断里反复催用户处理。
  const aliasedIds = new Set<string>()
  for (const meta of sessions.values()) {
    if (!meta.cwd) continue
    const target = aliases[normalizePath(meta.cwd)]
    if (target && !sessionIdVariants(meta.id).some((key) => claimedKeys.has(key))) aliasedIds.add(meta.id)
  }
  // 「成员表没登记」有两种人：工作区还在、只是没登记（打开一次就回来了），
  // 和彻底无主（工作区已删/目录已搬）。后者才允许被批量清理，前者只提示。
  const registeredPaths = new Set(wsRes.data.map((ws) => normalizePath(ws.path)))
  /** 靠父会话挂进项目的子会话：既不算 staleCwd，也不再算「无主转录」 */
  const derivedIds = new Set<string>()
  const projects = groupIntoProjects(wsRes.data, [...sessions.values()], warnings, checkDisk, aliases, derivedIds)

  // 6) 归档状态以宿主 workspace 域为准（唯一真相）：
  //    归档不移动/不删除转录文件，所以 live 会话同样可以 archived=true；
  //    归档缓存里查不到宿主标记的记录只当元数据兜底，不再冒充「已归档」。
  for (const meta of sessions.values()) {
    meta.archived = isArchivedInHost(meta.id)
  }

  const diagnostics = buildDiagnostics({
    sessions: [...sessions.values()],
    claimedKeys,
    aliasedIds,
    derivedIds,
    registeredPaths,
    noRecordIds,
    staleArchiveRecords,
  })

  return { generatedAt: Date.now(), projects, warnings, diagnostics }
}

/** 诊断：只归纳证据，不做任何修复（修复动作由用户显式触发，见宿主路由） */
function buildDiagnostics(input: {
  sessions: SessionMeta[]
  claimedKeys: Set<string>
  aliasedIds: Set<string>
  derivedIds: Set<string>
  registeredPaths: Set<string>
  noRecordIds: Set<string>
  staleArchiveRecords: number
}): Diagnostics {
  const cacheIssues: CacheIssue[] = []
  const unclaimed: UnclaimedSession[] = []
  for (const meta of input.sessions) {
    if (meta.source !== 'live') continue
    if (meta.title === null) {
      cacheIssues.push({
        kind: input.noRecordIds.has(meta.id) ? 'no-record' : 'no-title',
        sessionId: meta.id,
        title: meta.title,
        cwd: meta.cwd,
      })
    }
    const claimed =
      input.derivedIds.has(meta.id) ||
      input.aliasedIds.has(meta.id) ||
      sessionIdVariants(meta.id).some((key) => input.claimedKeys.has(key))
    if (!claimed && !meta.archived) {
      unclaimed.push({
        sessionId: meta.id,
        title: meta.title,
        cwd: meta.cwd,
        createdAt: meta.createdAt,
        origin: meta.origin,
        sizeBytes: meta.sizeBytes ?? 0,
        dirName: meta.dirName,
        pathRegistered: meta.cwd ? input.registeredPaths.has(normalizePath(meta.cwd)) : false,
      })
    }
  }
  // 彻底无主的排前面（它们才是清理对象）；同组按体积降序，大的先看见
  unclaimed.sort((a, b) => Number(a.pathRegistered) - Number(b.pathRegistered) || b.sizeBytes - a.sizeBytes)
  return {
    cacheIssues: cacheIssues.slice(0, 200),
    unclaimed: unclaimed.slice(0, 200),
    staleArchiveRecords: input.staleArchiveRecords,
  }
}

function groupIntoProjects(
  workspaces: WorkspaceEntry[],
  sessions: SessionMeta[],
  warnings: string[],
  checkDisk: boolean,
  aliases: Record<string, string>,
  derivedIds: Set<string>,
): ProjectState[] {
  const existsCache = new Map<string, boolean>()
  const dirExists = (p: string): boolean => {
    let hit = existsCache.get(p)
    if (hit === undefined) {
      try {
        // 目录是否存在：直接 stat
        hit = statSync(p).isDirectory()
      } catch {
        hit = false
      }
      existsCache.set(p, hit)
    }
    return hit
  }

  const byPath = new Map<string, ProjectState>()
  const getProject = (path: string, workspace: WorkspaceEntry | null): ProjectState => {
    const key = normalizePath(path)
    let project = byPath.get(key)
    if (!project) {
      const isWorkspace = workspace !== null
      project = {
        id: isWorkspace ? workspace!.id : `orphan:${key}`,
        path,
        title: isWorkspace ? workspace!.title : path.split('\\').pop() || path,
        workspaceId: isWorkspace ? workspace!.id : null,
        existsOnDisk: !checkDisk || dirExists(path),
        sessions: [],
        lastActivityAt: null,
        staleCwds: [],
      }
      byPath.set(key, project)
    }
    return project
  }

  // 权威归属表：workspace.sessionIds。项目改名/移动后 cwd 还是旧路径，只有成员表还准。
  const projectByWsId = new Map<string, ProjectState>()
  const ownerByKey = new Map<string, WorkspaceEntry>()
  const conflicts = new Set<string>()
  for (const ws of workspaces) {
    if (!ws.path) {
      warnings.push(`工作区 ${ws.id} 缺少 path，已跳过`)
      continue
    }
    projectByWsId.set(ws.id, getProject(ws.path, ws))
    for (const sid of ws.sessionIds ?? []) {
      for (const key of sessionIdVariants(sid)) {
        const prev = ownerByKey.get(key)
        if (prev && prev.id !== ws.id) {
          conflicts.add(key)
          continue
        }
        ownerByKey.set(key, ws)
      }
    }
  }
  if (conflicts.size > 0) {
    warnings.push(`${conflicts.size} 个会话同时登记在多个工作区，按首次出现归属`)
  }

  /** 子会话挂父会话用：id → 项目（两种写法都登记，父会话 id 带 session- 前缀） */
  const projectBySessionKey = new Map<string, ProjectState>()
  const remember = (session: SessionMeta, project: ProjectState): void => {
    for (const key of sessionIdVariants(session.id)) {
      if (!projectBySessionKey.has(key)) projectBySessionKey.set(key, project)
    }
  }
  /** 落在孤儿桶里的会话：稍后尝试按父会话改挂到工作区 */
  const pending: Array<{ session: SessionMeta; project: ProjectState }> = []

  for (const session of sessions) {
    let placed: ProjectState | null = null
    const owner = sessionIdVariants(session.id)
      .map((key) => ownerByKey.get(key))
      .find((ws): ws is WorkspaceEntry => ws !== undefined)
    if (owner) {
      const project = projectByWsId.get(owner.id)
      if (project) {
        project.sessions.push(session)
        // 记录旧路径：项目改名/移动后，会话头里的 cwd 仍是老路径
        if (session.cwd && normalizePath(session.cwd) !== normalizePath(owner.path) && !project.staleCwds.includes(session.cwd)) {
          project.staleCwds.push(session.cwd)
        }
        placed = project
      }
    }
    if (!placed && session.cwd) {
      const key = normalizePath(session.cwd)
      // 归属表兜底：用户显式并进过某个工作区的旧 cwd
      const aliasedWsId = aliases[key]
      const target = aliasedWsId ? projectByWsId.get(aliasedWsId) : undefined
      if (target) {
        target.sessions.push(session)
        if (normalizePath(target.path) !== key && !target.staleCwds.includes(session.cwd)) {
          target.staleCwds.push(session.cwd)
        }
        placed = target
      } else {
        let project = byPath.get(key)
        if (!project) project = getProject(session.cwd, null) // 孤儿桶：工作区注册表之外的 cwd
        project.sessions.push(session)
        placed = project
        if (project.workspaceId === null) pending.push({ session, project })
      }
    }
    if (!placed) {
      warnings.push(`会话 ${session.id} 无 cwd 且不在任何工作区，跳过`)
      continue
    }
    remember(session, placed)
  }

  /**
   * 子会话跟随父会话：宿主只在子代理转录头里写 parentSession，而子会话的 cwd 常是 ~/.dsh
   * 或父项目的旧路径，按 cwd 归桶会让它们留在孤儿桶里当「无主转录」。父会话既然已经落在
   * 某个工作区，子会话就该一起进去（标记 derived，且不往 staleCwds 里塞 ~/.dsh 这种噪声）。
   * 父会话本身可能也是另一个子会话（多级委派），所以迭代到不动为止。
   */
  let moved = true
  let guard = 0
  while (moved && guard < 8) {
    moved = false
    guard += 1
    for (const entry of pending) {
      if (entry.project.workspaceId !== null) continue
      const parent = entry.session.parentSession
      if (!parent) continue
      const parentProject = sessionIdVariants(parent)
        .map((key) => projectBySessionKey.get(key))
        .find((candidate): candidate is ProjectState => candidate !== undefined)
      if (!parentProject || parentProject.workspaceId === null) continue
      const index = entry.project.sessions.indexOf(entry.session)
      if (index < 0) continue
      entry.project.sessions.splice(index, 1)
      entry.session.derived = true
      parentProject.sessions.push(entry.session)
      derivedIds.add(entry.session.id)
      remember(entry.session, parentProject)
      entry.project = parentProject
      moved = true
    }
  }

  // 子会话可能把某个孤儿桶搬空：只剩空壳的孤儿桶不再展示（有工作区的项目即使 0 会话也留着）
  const projects = [...byPath.values()].filter((project) => project.workspaceId !== null || project.sessions.length > 0)
  for (const project of projects) {
    project.sessions.sort((a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0))
    project.lastActivityAt = project.sessions[0]?.lastActivityAt ?? null
  }
  projects.sort((a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0))
  return projects
}

// 供测试注入假 SourceResult 用（保持 buildState 纯聚合的可测性）
export type { SourceResult, SessionFileInfo }
