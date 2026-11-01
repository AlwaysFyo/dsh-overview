import type {
  ProjcacheRecord,
  ProjectState,
  SessionFileInfo,
  SessionMeta,
  WorkbenchState,
} from './types.ts'
import { statSync } from 'node:fs'
import { normalizePath } from './paths.ts'
import { extractLastPromptAt, extractTitle, extractTokenTotals, extractTodos, extractTurns } from './rows.ts'
import {
  readArchiveRecords,
  readHostArchivedIds,
  readProjcacheRecords,
  readSessionHeads,
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
}

/**
 * 聚合四源 → WorkbenchState。
 *
 * 关联键（本机探查验证，scripts/probe-projcache-map.mjs，46/47 命中）：
 *  - projcache ↔ 会话文件：normalizePath(identity.cwd) + identity.createdAt === head.createdAt
 *  - 归档记录 ↔ 项目：record.sessionId 自标识 + identity.cwd
 *  - 会话 ↔ 工作区：normalizePath(cwd) === normalizePath(workspace.path)
 */
export function buildState(options: BuildStateOptions): WorkbenchState {
  const warnings: string[] = []
  const { home } = options
  const checkDisk = options.checkDisk ?? true

  const wsRes = readWorkspaces(workspaceJsonPath(home))
  const arcRes = readHostArchivedIds(workspaceJsonPath(home))
  const pcRes = readProjcacheRecords(projcacheDir(home))
  const arRes = readArchiveRecords(archiveDir(home))
  const sfRes = readSessionHeads(sessionsRoot(home))
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
    todosRaw: extractTodos(rec),
    archived: base.archived,
    source: base.source,
    dirName: base.dirName,
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
          todosRaw: null,
          archived: false,
          source: 'live',
          dirName: info.dirName,
        }
    meta.lastActivityAt = Math.max(meta.lastPromptAt ?? 0, info.fileMtime) || meta.lastPromptAt || info.fileMtime
    // live 数据优先于同 id 的 archive/cacheOnly
    const prev = sessions.get(head.id)
    if (!prev || prev.source !== 'live') sessions.set(head.id, meta)
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
  for (const [id, meta] of sessions) {
    if (meta.source === 'archive' && !meta.dirName && !isArchivedInHost(id)) sessions.delete(id)
  }

  // 5) 按路径归组到工作区
  const projects = groupIntoProjects(wsRes.data, [...sessions.values()], warnings, checkDisk)

  // 6) 归档状态以宿主 workspace 域为准（唯一真相）：
  //    归档不移动/不删除转录文件，所以 live 会话同样可以 archived=true；
  //    归档缓存里查不到宿主标记的记录只当元数据兜底，不再冒充「已归档」。
  for (const meta of sessions.values()) {
    meta.archived = isArchivedInHost(meta.id)
  }

  return { generatedAt: Date.now(), projects, warnings }
}

function groupIntoProjects(
  workspaces: WorkspaceEntry[],
  sessions: SessionMeta[],
  warnings: string[],
  checkDisk: boolean,
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
      }
      byPath.set(key, project)
    }
    return project
  }

  for (const ws of workspaces) {
    if (!ws.path) {
      warnings.push(`工作区 ${ws.id} 缺少 path，已跳过`)
      continue
    }
    getProject(ws.path, ws)
  }

  for (const session of sessions) {
    if (!session.cwd) {
      warnings.push(`会话 ${session.id} 无 cwd，归入未知桶`)
      continue
    }
    const key = normalizePath(session.cwd)
    let project = byPath.get(key)
    if (!project) project = getProject(session.cwd, null) // 孤儿桶：工作区注册表之外的 cwd
    project.sessions.push(session)
  }

  const projects = [...byPath.values()]
  for (const project of projects) {
    project.sessions.sort((a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0))
    project.lastActivityAt = project.sessions[0]?.lastActivityAt ?? null
  }
  projects.sort((a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0))
  return projects
}

// 供测试注入假 SourceResult 用（保持 buildState 纯聚合的可测性）
export type { SourceResult, SessionFileInfo }
