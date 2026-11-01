/**
 * 会话删除（宿主侧）：物理清理转录目录 + 投影缓存 + 工作区记账。
 *
 * 语义对齐参考实现 @michengai/dsh-archive-manager 1.1.22 的 deleteSessionCore：
 *   1. 校验会话已知（实时实例或持久化头部），未知时只清残留记账后按幂等成功返回；
 *   2. 实时会话先 flush 再 detach（保证删除前没有排队写入复活文件）；
 *   3. 删投影缓存、子代理（origin=subagent）会话、spill 目录；
 *   4. 删转录目录——仅当 jsonl 后端能证明目录归属时递归删目录，否则只删定位到的工件；
 *   5. 物理删除成功后才动记账（归档集合、工作区 sessionIds），失败保留记账以便重试；
 *   6. 广播 api-session/removed，让宿主侧边栏与我们的 /state 一起刷新。
 *
 * 与参考实现的差异：不继承 WorkspaceRegistry、不注册 Typert 远程方法，
 * 而是在插件自己的 webServer 路由里调用同一批宿主服务（sessions / sessionPersistence /
 * sessionProjectionCache / workspaceRegistry），从而不依赖 archive-manager 是否安装。
 * 能力探测失败时返回明确错误，绝不猜测路径删除。
 */
import { lstat, readFile, readdir, rm, stat, unlink } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'

/** session-<uuid> 或裸 uuid；拒绝路径分隔符与点号目录 */
const SESSION_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/

export interface DeleteSessionResult {
  deleted: boolean
  skipped?: boolean
  warnings: string[]
  removedPath?: string
}

interface CtxLike {
  get(name: string): unknown
  emit?(event: string, sessionId: string): unknown
  logger?: { warn(message: string): void }
}

// 宿主服务的最小结构（跨版本探测，全部可选）
interface SessionsLike {
  get?(id: string): { header?: Header } | undefined
  flush?(session: unknown): Promise<unknown>
  liveEntryFor?(session: unknown): unknown
  detachEntered?(entry: unknown): unknown
  announce?(session: unknown): unknown
  enter?(session: unknown): (() => void) | undefined
}

interface PersistenceLike {
  name?: string
  root?: string
  config?: { root?: string }
  stat?(id: string): Promise<{ header?: Header } | undefined>
  locate?(header: Header): { path?: string; kind?: string } | undefined
  list?(): Promise<unknown[]>
  prepare?(id: string): Promise<{ session: unknown; [Symbol.dispose]?(): void }>
  findLog?(id: string): Promise<unknown>
}

interface Header {
  id?: string
  cwd?: string
  origin?: string
  parentSession?: string
  [key: string]: unknown
}

interface ProjCacheLike {
  requireTable?(): { delete?(id: string): unknown }
}

interface RegistryLike {
  requireState?(): { archivedSessionIds?: string[]; workspaceIds?: string[] }
  setState?(state: unknown): Promise<unknown>
  requireTable?(): {
    get?(id: string): { sessionIds?: string[]; [key: string]: unknown } | undefined
    update?(
      id: string,
      patch: (current: Record<string, unknown>) => Record<string, unknown>,
    ): Promise<Record<string, unknown>>
  }
  entities?: { get?(id: string): { record?: unknown } | undefined }
  headers?: Map<string, unknown>
  sessionPaths?: Map<string, unknown>
  invalidSessionPaths?: Map<string, unknown>
}

const warn = (ctx: CtxLike, message: string): void => {
  try {
    ctx.logger?.warn(`dsh-overview: ${message}`)
  } catch {
    /* logger 不可用不影响删除 */
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

/** 官方 JSONL 目录分段编码（非 [A-Za-z0-9._-] 一律 ~XXXX） */
function encodeSegment(text: string): string {
  return text.replace(
    /[^A-Za-z0-9._-]/g,
    (ch) => `~${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`,
  )
}

/**
 * 证明 transcript 所在目录归属该会话，返回可递归删除的目录。
 * 任何一环对不上就返回 undefined——调用方退化为只删 locate() 指到的工件。
 */
function jsonlSessionDirectory(
  persistence: PersistenceLike,
  header: Header,
  location: { path: string; kind?: string },
): string | undefined {
  if (persistence.name !== 'session-persistence-jsonl' || location.kind !== 'jsonl') return undefined
  const root = persistence.root ?? persistence.config?.root
  if (typeof root !== 'string' || !isAbsolute(root)) return undefined
  const cwd = header.cwd
  const id = header.id
  if (typeof cwd !== 'string' || typeof id !== 'string') return undefined
  const readable = encodeSegment(cwd.replace(/[\\/:]+/g, '-')).replace(/^-+/, '') || 'root'
  const project = `--${readable.slice(0, 251)}--`
  const segment = id === '.' ? '~002E' : id === '..' ? '~002E~002E' : encodeSegment(id)
  const directory = join(resolve(root), project, segment)
  if (join(directory, basename(location.path)) !== join(location.path)) return undefined
  return directory
}

async function statHeader(
  persistence: PersistenceLike | undefined,
  sessionId: string,
): Promise<Header | undefined> {
  if (typeof persistence?.stat !== 'function') return undefined
  try {
    return (await persistence.stat(sessionId))?.header
  } catch {
    return undefined
  }
}

/** 只认子代理会话；fork 分支有 parentSession 但 origin 不同，绝不级联。 */
async function listSubagentDescendants(
  persistence: PersistenceLike | undefined,
  parentId: string,
): Promise<Array<{ id: string; header: Header }>> {
  if (typeof persistence?.list !== 'function') return []
  let listed: unknown[]
  try {
    listed = await persistence.list()
  } catch {
    return []
  }
  const out: Array<{ id: string; header: Header }> = []
  for (const item of listed) {
    const header = ((item as { header?: Header })?.header ?? item) as Header | undefined
    if (typeof header?.id !== 'string') continue
    if (header.parentSession !== parentId) continue
    if (header.origin !== 'subagent') continue
    out.push({ id: header.id, header })
  }
  return out
}

async function publishColdSessionRemoval(
  ctx: CtxLike,
  sessions: SessionsLike | undefined,
  persistence: PersistenceLike | undefined,
  sessionId: string,
): Promise<void> {
  if (typeof persistence?.prepare !== 'function' || typeof sessions?.enter !== 'function') return
  try {
    const preparation = await persistence.prepare(sessionId)
    const detach = sessions.enter(preparation.session)
    try {
      sessions.announce?.(preparation.session)
    } finally {
      detach?.()
      preparation[Symbol.dispose]?.()
    }
  } catch (error) {
    warn(ctx, `could not publish removal for stored session "${sessionId}": ${String(error)}`)
  }
}

/** 删除转录工件；返回被删路径。失败抛错（调用方据此保留记账）。 */
async function removeTranscriptArtifact(
  ctx: CtxLike,
  persistence: PersistenceLike | undefined,
  sessionId: string,
  header: Header,
): Promise<string> {
  if (typeof persistence?.locate !== 'function') {
    throw new Error(
      `cannot delete session "${sessionId}": sessionPersistence does not expose locate()`,
    )
  }
  const location = persistence.locate(header)
  if (typeof location?.path !== 'string') {
    throw new Error(`cannot delete session "${sessionId}": transcript location unavailable`)
  }
  const located = { path: location.path, kind: location.kind }

  let target = { path: located.path, kind: 'transcript artifact' }
  const directory = jsonlSessionDirectory(persistence, header, located)
  if (directory !== undefined) {
    target = { path: directory, kind: 'session directory' }
    for (const path of [dirname(directory), directory]) {
      let info
      try {
        info = await lstat(path)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue
        throw error
      }
      if (info.isSymbolicLink()) throw new Error(`refusing to delete through symbolic link "${path}"`)
      if (!info.isDirectory()) throw new Error(`expected session storage directory "${path}"`)
    }
  } else {
    warn(ctx, `session "${sessionId}": directory ownership unverified; deleting artifact only`)
  }

  const existed = await pathExists(target.path)
  await rm(target.path, { recursive: true, force: true })

  if (typeof persistence.stat === 'function') {
    let stillPresent: unknown
    let statFailed: unknown
    try {
      stillPresent = await persistence.stat(sessionId)
    } catch (error) {
      statFailed = error
    }
    if (stillPresent !== undefined) throw new Error(`session "${sessionId}" artifact is still present`)
    if (statFailed !== undefined) {
      const gone = !(await pathExists(target.path))
      if (!existed || !gone) {
        throw new Error(
          `cannot verify removal of session "${sessionId}": stat failed and "${target.path}" was not an artifact removed by this call`,
        )
      }
    }
  }
  return target.path
}

/** 清残留记账（归档集合 + 每个工作区的 sessionIds + 父类索引） */
async function cleanupBookkeeping(ctx: CtxLike, registry: RegistryLike | undefined, sessionId: string): Promise<void> {
  if (!registry) return
  try {
    const state = registry.requireState?.()
    if (state !== undefined && typeof registry.setState === 'function') {
      const archived = Array.isArray(state.archivedSessionIds) ? state.archivedSessionIds : []
      if (archived.includes(sessionId)) {
        await registry.setState({ ...state, archivedSessionIds: archived.filter((id) => id !== sessionId) })
      }
    }
    const table = registry.requireTable?.()
    for (const workspaceId of state?.workspaceIds ?? []) {
      if (typeof table?.get !== 'function' || typeof table.update !== 'function') break
      const record = table.get(workspaceId)
      if (!record?.sessionIds?.includes(sessionId)) continue
      const next = await table.update(workspaceId, (current) => ({
        ...current,
        sessionIds: ((current['sessionIds'] as string[] | undefined) ?? []).filter((id) => id !== sessionId),
        updatedAt: new Date().toISOString(),
      }))
      const entity = registry.entities?.get?.(workspaceId)
      if (entity) entity.record = next
    }
  } catch (error) {
    warn(ctx, `bookkeeping cleanup for "${sessionId}" failed: ${String(error)}`)
  }
  registry.headers?.delete?.(sessionId)
  registry.sessionPaths?.delete?.(sessionId)
  registry.invalidSessionPaths?.delete?.(sessionId)
}

async function cleanupSpill(ctx: CtxLike, sessionId: string): Promise<void> {
  try {
    const spill = ctx.get('spillStore') as { root?: unknown } | undefined
    if (typeof spill?.root !== 'string') return
    // spill 目录布局由 dsh-spill-local 决定；这里只按 <root>/<sessionId> 清理，
    // 不存在时 rm(force) 是空操作。布局变化时最多留下孤儿块，不会误删他人数据。
    await rm(join(spill.root, sessionId), { recursive: true, force: true })
  } catch (error) {
    warn(ctx, `spill cleanup for "${sessionId}" failed: ${String(error)}`)
  }
}

/** 清投影缓存条目（能力缺失时静默跳过） */
async function dropProjectionCache(projCache: ProjCacheLike | undefined, sessionId: string): Promise<void> {
  const table = projCache?.requireTable?.()
  const drop = table?.delete
  if (typeof drop !== 'function') return
  await drop.call(table, sessionId)
}

export async function deleteSessionArtifacts(
  ctx: CtxLike,
  sessionId: string,
): Promise<DeleteSessionResult> {
  if (!SESSION_ID_RE.test(sessionId) || sessionId === '.' || sessionId === '..') {
    throw new Error(`invalid session id: ${sessionId}`)
  }
  const warnings: string[] = []
  const note = (message: string): void => {
    warnings.push(message)
    warn(ctx, message)
  }

  const sessions = ctx.get('sessions') as SessionsLike | undefined
  const persistence = ctx.get('sessionPersistence') as PersistenceLike | undefined
  const projCache = ctx.get('sessionProjectionCache') as ProjCacheLike | undefined
  const registry = ctx.get('workspaceRegistry') as RegistryLike | undefined

  const live = sessions?.get?.(sessionId)
  const header = (live?.header as Header | undefined) ?? (await statHeader(persistence, sessionId))

  if (header === undefined && live === undefined) {
    // 幂等：工件已经不在了，只清记账，避免工作区里留死链
    try {
      await dropProjectionCache(projCache, sessionId)
    } catch (error) {
      note(`projection cache cleanup failed: ${String(error)}`)
    }
    await cleanupBookkeeping(ctx, registry, sessionId)
    return { deleted: true, skipped: true, warnings }
  }

  // 1) 实时会话：flush → detach；冷会话：发布一次 removed 生命周期
  if (live !== undefined) {
    if (typeof sessions?.flush === 'function') {
      try {
        await sessions.flush(live)
      } catch (error) {
        note(`flush before delete failed: ${String(error)}`)
      }
    }
    try {
      const entry = sessions?.liveEntryFor?.(live)
      if (entry !== undefined) sessions?.detachEntered?.(entry)
    } catch (error) {
      note(`detach before delete failed: ${String(error)}`)
    }
  } else {
    await publishColdSessionRemoval(ctx, sessions, persistence, sessionId)
  }

  // 2) 投影缓存
  try {
    await dropProjectionCache(projCache, sessionId)
  } catch (error) {
    note(`projection cache cleanup failed: ${String(error)}`)
  }

  // 3) 子代理会话（递归一层，孙代理再入队）
  const queue = await listSubagentDescendants(persistence, sessionId)
  while (queue.length > 0) {
    const child = queue.shift()!
    try {
      await removeTranscriptArtifact(ctx, persistence, child.id, child.header)
      queue.push(...(await listSubagentDescendants(persistence, child.id)))
    } catch (error) {
      note(`subagent "${child.id}" cleanup failed: ${String(error)}`)
    }
  }

  // 4) spill + 转录目录；物理删除失败会抛错，记账保留供重试
  await cleanupSpill(ctx, sessionId)
  if (header === undefined) {
    throw new Error(`cannot delete session "${sessionId}": header unavailable for transcript lookup`)
  }
  const removedPath = await removeTranscriptArtifact(ctx, persistence, sessionId, header)

  // 5) 记账（必须在物理删除成功之后）
  await cleanupBookkeeping(ctx, registry, sessionId)

  try {
    ctx.emit?.('api-session/removed', sessionId)
  } catch (error) {
    note(`removal event failed: ${String(error)}`)
  }

  return { deleted: true, warnings, removedPath }
}

/**
 * 清理宿主归档缓存里属于该会话的陈旧记录。
 *
 * 归档缓存（session_projcache_archive_manager_v2/sessions/*.json）是宿主写入的元数据快照，
 * 会话被删除后不会自动消失；只要记录还在，聚合层就会把它当成"归档会话"重新列出来，
 * 表现为「无标题、点删除提示成功但刷新后又回来」。这里按 record.sessionId 精确匹配删除，
 * 只删缓存文件，不动任何转录/工作区数据；损坏或无法解析的文件一律跳过。
 */
export async function purgeArchiveCache(home: string, sessionId: string): Promise<string[]> {
  const dir = join(home, 'storages', 'session_projcache_archive_manager_v2', 'sessions')
  let names: string[]
  try {
    names = await readdir(dir)
  } catch {
    return []
  }
  const removed: string[] = []
  for (const name of names) {
    if (!name.endsWith('.json')) continue
    const file = join(dir, name)
    try {
      const parsed = JSON.parse(await readFile(file, 'utf-8')) as { record?: { sessionId?: unknown } }
      if (parsed?.record?.sessionId === sessionId) {
        await unlink(file)
        removed.push(name)
      }
    } catch {
      // 读/解析/删除失败都跳过：缓存清理失败不应让删除整体失败
    }
  }
  return removed
}
