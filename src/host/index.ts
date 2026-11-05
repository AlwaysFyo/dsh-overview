/**
 * dsh-overview 宿主侧插件。
 *
 * 职责：读取 ~/.dsh 存储聚合出 WorkbenchState，通过宿主 webServer 暴露
 * REST + SSE，供渲染端工作台 UI 消费。
 *
 * 写入边界：默认零写入。只有两个显式用户动作会改宿主数据 ——
 *   1) 永久删除会话（/session/delete、/session/batch）删转录与投影缓存；
 *   2) 并入工作区（/session/adopt）把一条旧 cwd 记进插件自己的归属表，用于项目改名后的归组。
 * 其余路径（/state、/events、/search、/preview）只读。
 *
 * 服务注入与路由形态参照 browser-dock / dsh-better-sidebar 的成熟用法：
 *   ctx.inject(['webServer'], (scope) => scope.webServer.register({ kind, path, handler }))
 */
import { watch } from 'node:fs'
import type { Context } from '@deepseek-ai/cordis'
import { buildState } from '../model/buildState.ts'
import { runSerialBatch, type BatchResult } from '../model/batch.ts'
import { previewSessionContent, searchAcrossSessions } from '../model/content.ts'
import { dshHome, sessionIdVariants } from '../model/paths.ts'
import { readSessionHeads } from '../model/sources.ts'
import type { WorkbenchState } from '../model/types.ts'
import { sessionsRoot } from '../model/paths.ts'
import { deleteSessionArtifacts, purgeArchiveCache, type DeleteSessionResult } from './deleteSession.ts'
import { adoptCwdIntoWorkspace, forgetCwdAlias, readAliases } from './adopt.ts'
import { addSessionIdsToWorkspace, migrateSessionCwd } from './migrate.ts'
import { readWorkspaces } from '../model/sources.ts'
import { workspaceJsonPath } from '../model/paths.ts'

export const name = 'dsh-overview'

interface WorkbenchWebServer {
  register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: unknown, res: unknown) => void | Promise<void> }): () => void
}

interface Scope {
  webServer: WorkbenchWebServer
  effect(fn: () => () => void, label?: string): void
}

const SSE_DEBOUNCE_MS = 400
/** SSE 心跳：避免代理/休眠把长连接静默掐掉，客户端 EventSource 无需处理注释行 */
const SSE_HEARTBEAT_MS = 25_000

export function apply(ctx: Context): void {
  ctx.inject(['webServer'], ((scope: Scope) => {
    const home = dshHome()
    // 首个请求前可能还没建好：/state 会等待同一次构建（不阻塞宿主 boot）
    let state: WorkbenchState | null = null
    let revision = 0
    let lastSignature = ''
    let building: Promise<WorkbenchState> | null = null
    const sseClients = new Set<unknown>()

    const signature = (s: WorkbenchState): string => JSON.stringify({ ...s, generatedAt: '' })

    const broadcast = (): void => {
      for (const res of sseClients) {
        const r = res as { writableEnded?: boolean; write(s: string): boolean }
        if (r.writableEnded) {
          sseClients.delete(res)
          continue
        }
        try {
          r.write('event: change\ndata: changed\n\n')
        } catch {
          sseClients.delete(res)
        }
      }
    }

    /** 单飞构建：并发请求共享同一次扫描，避免事件风暴下重复解压 */
    const buildOnce = (): Promise<WorkbenchState> => {
      if (!building) {
        building = buildState({ home, aliases: readAliases(home) }).finally(() => {
          building = null
        })
      }
      return building
    }

    const rebuild = async (): Promise<void> => {
      try {
        const next = await buildOnce()
        const sig = signature(next)
        if (sig === lastSignature) return
        state = next
        lastSignature = sig
        revision += 1
        broadcast()
      } catch {
        // R5：重建失败保留旧快照，不崩宿主
      }
    }

    // 数据目录变更 → 防抖重建 + SSE 推送（watcher 失效时客户端仍可轮询 /state）
    let timer: ReturnType<typeof setTimeout> | null = null
    const scheduleRebuild = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => void rebuild(), SSE_DEBOUNCE_MS)
    }
    const watchRoots = [
      'sessions',
      'storages',
      'storages/session_projcache/sessions',
      'storages/session_projcache_archive_manager_v2/sessions',
    ]
    const watchers: ReturnType<typeof watch>[] = []
    for (const rel of watchRoots) {
      try {
        watchers.push(watch(`${home}/${rel}`, scheduleRebuild))
      } catch {
        // 目录可能不存在（无归档），降级为纯请求时重建
      }
    }
    scope.effect(() => () => {
      for (const w of watchers) w.close()
      if (timer) clearTimeout(timer)
    }, 'dsh-overview watchers')

    const json = (res: unknown, status: number, body: unknown) => {
      const r = res as { writeHead(s: number, h: Record<string, string>): unknown; end(s: string): unknown }
      r.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
      r.end(JSON.stringify(body))
    }

    /** 读取请求体（带字节上限，超限 reject） */
    const readBody = (
      q: { on(ev: string, fn: (chunk?: Buffer) => void): void },
      limit: number,
    ): Promise<string> =>
      new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        let size = 0
        q.on('data', (chunk?: Buffer) => {
          if (!chunk) return
          size += chunk.length
          if (size > limit) {
            reject(new Error(`request body exceeds ${limit} bytes`))
            return
          }
          chunks.push(chunk)
        })
        q.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
      })

    scope.effect(
      () =>
        scope.webServer.register({
          kind: 'exact',
          path: '/dsh-overview/state',
          handler: async (_req, res) => {
            if (!state) await rebuild()
            if (!state) {
              json(res, 503, { ok: false, error: 'state unavailable' })
              return
            }
            json(res, 200, { revision, ...state })
          },
        }),
      'dsh-overview /state',
    )

    scope.effect(
      () =>
        scope.webServer.register({
          kind: 'exact',
          path: '/dsh-overview/events',
          handler: (_req, res) => {
            const r = res as {
              writeHead(s: number, h: Record<string, string>): unknown
              write(s: string): boolean
              on(ev: string, fn: () => void): unknown
            }
            r.writeHead(200, {
              'content-type': 'text/event-stream; charset=utf-8',
              'cache-control': 'no-store',
              connection: 'keep-alive',
            })
            r.write(`event: hello\ndata: ${JSON.stringify({ revision })}\n\n`)
            sseClients.add(r)
            const heartbeat = setInterval(() => {
              try {
                r.write(`: ping ${Date.now()}\n\n`)
              } catch {
                release()
              }
            }, SSE_HEARTBEAT_MS)
            const release = () => {
              clearInterval(heartbeat)
              sseClients.delete(r)
            }
            r.on('close', release)
          },
        }),
      'dsh-overview /events',
    )

    // 会话永久删除：宿主侧物理清理（转录目录 + 投影缓存 + 工作区记账），
    // 语义见 src/host/deleteSession.ts。客户端不再依赖 archive-manager 的远程方法。
    scope.effect(
      () =>
        scope.webServer.register({
          kind: 'exact',
          path: '/dsh-overview/session/delete',
          handler: async (req, res) => {
            const q = req as {
              method?: string
              headers?: Record<string, string | string[] | undefined>
              on(ev: string, fn: (chunk?: Buffer) => void): void
            }
            if (q.method !== 'POST') {
              json(res, 405, { ok: false, error: 'POST only' })
              return
            }
            // 同源校验：浏览器跨站 fetch 会带 Origin，先拒掉；无 Origin 的非浏览器调用放行。
            const origin = typeof q.headers?.origin === 'string' ? q.headers.origin : ''
            const hostHeader = typeof q.headers?.host === 'string' ? q.headers.host : ''
            if (origin) {
              let originHost = ''
              try {
                originHost = new URL(origin).host
              } catch {
                originHost = ''
              }
              if (!originHost || originHost !== hostHeader) {
                json(res, 403, { ok: false, error: 'cross-origin request rejected' })
                return
              }
            }

            let body = ''
            try {
              body = await readBody(q, 8192)
            } catch (error) {
              json(res, 413, { ok: false, error: String((error as Error).message) })
              return
            }
            let sessionId = ''
            try {
              const parsed = JSON.parse(body || '{}') as { sessionId?: unknown }
              if (typeof parsed.sessionId !== 'string') throw new Error('sessionId is required')
              sessionId = parsed.sessionId
            } catch (error) {
              json(res, 400, { ok: false, error: String((error as Error).message) })
              return
            }

            try {
              const result: DeleteSessionResult = await deleteSessionArtifacts(
                ctx as unknown as Parameters<typeof deleteSessionArtifacts>[0],
                sessionId,
              )
              // 宿主归档缓存不会随会话删除自动清理；残留记录会让会话以「无标题」幽灵行回来
              try {
                const purged = await purgeArchiveCache(dshHome(), sessionId)
                if (purged.length > 0) result.warnings.push(`purged archive cache: ${purged.join(', ')}`)
              } catch (error) {
                result.warnings.push(`archive cache purge failed: ${String(error)}`)
              }
              await rebuild()
              json(res, 200, { ok: true, ...result })
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error)
              json(res, 500, { ok: false, error: message })
            }
          },
        }),
      'dsh-overview POST /session/delete',
    )

    // ---------- 只读检索 / 预览 / 批量删除（P3） ----------

    interface HttpReq {
      method?: string
      headers?: Record<string, string | string[] | undefined>
      on(ev: string, fn: (chunk?: Buffer) => void): void
    }

    /** 同源校验：浏览器跨站 fetch 一定带 Origin；无 Origin 的非浏览器调用放行 */
    const sameOrigin = (q: HttpReq): boolean => {
      const origin = typeof q.headers?.origin === 'string' ? q.headers.origin : ''
      if (!origin) return true
      const hostHeader = typeof q.headers?.host === 'string' ? q.headers.host : ''
      if (!hostHeader) return false
      try {
        return new URL(origin).host === hostHeader
      } catch {
        return false
      }
    }

    /** POST + 同源 + 体积上限 + JSON 解析；任一步失败都已写好响应并返回 null */
    const guardedJson = async <T>(req: unknown, res: unknown, limit: number): Promise<T | null> => {
      const q = req as HttpReq
      if (q.method !== 'POST') {
        json(res, 405, { ok: false, error: 'POST only' })
        return null
      }
      if (!sameOrigin(q)) {
        json(res, 403, { ok: false, error: 'cross-origin request rejected' })
        return null
      }
      let body = ''
      try {
        body = await readBody(q, limit)
      } catch (error) {
        json(res, 413, { ok: false, error: String((error as Error).message) })
        return null
      }
      try {
        return JSON.parse(body || '{}') as T
      } catch (error) {
        json(res, 400, { ok: false, error: String((error as Error).message) })
        return null
      }
    }

    /** 会话文件索引：头部解析带 (size:mtime) 指纹缓存，重复调用只付目录扫描的钱 */
    const sessionFiles = async (): Promise<{
      files: Array<{ sessionId: string; file: string }>
      byId: Map<string, string>
    }> => {
      const res = await readSessionHeads(sessionsRoot(home))
      const byId = new Map<string, string>()
      const files: Array<{ sessionId: string; file: string }> = []
      for (const info of res.data) {
        const id = info.head.id
        files.push({ sessionId: id, file: info.file })
        for (const key of sessionIdVariants(id)) byId.set(key, info.file)
      }
      return { files, byId }
    }

    // 正文检索：每次都是流式读转录，不建索引、不落盘、不调模型
    scope.effect(
      () =>
        scope.webServer.register({
          kind: 'exact',
          path: '/dsh-overview/search',
          handler: async (req, res) => {
            const body = await guardedJson<{ query?: unknown; sessionIds?: unknown; limit?: unknown }>(req, res, 8192)
            if (!body) return
            const query = typeof body.query === 'string' ? body.query.trim().slice(0, 200) : ''
            if (!query) {
              json(res, 400, { ok: false, error: 'query is required' })
              return
            }
            const wanted = Array.isArray(body.sessionIds)
              ? new Set(body.sessionIds.filter((x): x is string => typeof x === 'string'))
              : null
            const limit = Math.min(100, Math.max(1, typeof body.limit === 'number' ? Math.floor(body.limit) : 50))
            try {
              const { files } = await sessionFiles()
              const refs = wanted ? files.filter((f) => wanted.has(f.sessionId)) : files
              const result = await searchAcrossSessions(refs, { query, limit, perSession: 5 })
              json(res, 200, { ok: true, query, ...result })
            } catch (error) {
              json(res, 500, { ok: false, error: String((error as Error).message) })
            }
          },
        }),
      'dsh-overview POST /search',
    )

    // 只读预览：命中处上下各 2 条，无命中取最近 8 条；单条截断 2000 码元
    scope.effect(
      () =>
        scope.webServer.register({
          kind: 'exact',
          path: '/dsh-overview/preview',
          handler: async (req, res) => {
            const body = await guardedJson<{ sessionId?: unknown; query?: unknown }>(req, res, 8192)
            if (!body) return
            const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
            if (!sessionId) {
              json(res, 400, { ok: false, error: 'sessionId is required' })
              return
            }
            const query = typeof body.query === 'string' ? body.query.trim().slice(0, 200) : ''
            try {
              const { byId } = await sessionFiles()
              const file = sessionIdVariants(sessionId)
                .map((key) => byId.get(key))
                .find((p): p is string => typeof p === 'string')
              if (!file) {
                json(res, 404, { ok: false, error: 'session transcript not found' })
                return
              }
              const preview = await previewSessionContent(file, query)
              json(res, 200, { ok: true, sessionId, query, ...preview })
            } catch (error) {
              json(res, 500, { ok: false, error: String((error as Error).message) })
            }
          },
        }),
      'dsh-overview POST /preview',
    )

    // 批量永久删除：串行、单条失败继续、remaining 只含失败项（BatchResult 契约）
    scope.effect(
      () =>
        scope.webServer.register({
          kind: 'exact',
          path: '/dsh-overview/session/batch',
          handler: async (req, res) => {
            const body = await guardedJson<{ ids?: unknown }>(req, res, 32 * 1024)
            if (!body) return
            const ids = Array.isArray(body.ids)
              ? [...new Set(body.ids.filter((x): x is string => typeof x === 'string' && x.length > 0))].slice(0, 200)
              : []
            if (ids.length === 0) {
              json(res, 400, { ok: false, error: 'ids is required' })
              return
            }
            const warnings: string[] = []
            const result: BatchResult = await runSerialBatch(ids, async (id) => {
              const single = await deleteSessionArtifacts(
                ctx as unknown as Parameters<typeof deleteSessionArtifacts>[0],
                id,
              )
              warnings.push(...single.warnings)
              try {
                await purgeArchiveCache(home, id)
              } catch (error) {
                warnings.push(`archive cache purge failed: ${String(error)}`)
              }
              return 'ok'
            })
            try {
              await rebuild()
            } catch (error) {
              result.refreshError = String((error as Error).message)
            }
            json(res, 200, { ok: result.failures.length === 0, ...result, warnings })
          },
        }),
      'dsh-overview POST /session/batch',
    )

    // 并入工作区：项目目录改名/搬迁后，由用户显式把「这条旧 cwd」记到目标工作区名下。
    // 写的是插件自己的归属表（~/.dsh/storages/dsh-overview-aliases.json），不是宿主
    // workspace.json —— 宿主的成员表在读取时就会过滤 cwd 不匹配的会话，且是内存真相，
    // 文件里追加的 id 会被宿主下一次写入抹掉（v0.1.14 的真机教训，见 src/host/adopt.ts）。
    scope.effect(
      () =>
        scope.webServer.register({
          kind: 'exact',
          path: '/dsh-overview/session/adopt',
          handler: async (req, res) => {
            const body = await guardedJson<{ workspaceId?: unknown; cwd?: unknown; forget?: unknown }>(
              req,
              res,
              32 * 1024,
            )
            if (!body) return
            const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId.trim() : ''
            const cwd = typeof body.cwd === 'string' ? body.cwd.trim() : ''
            const forget = body.forget === true
            if (!cwd || (!forget && !workspaceId)) {
              json(res, 400, { ok: false, error: 'cwd is required (workspaceId is required unless forget)' })
              return
            }
            const result = forget ? forgetCwdAlias(home, cwd) : adoptCwdIntoWorkspace(home, workspaceId, cwd)
            if (!result.ok) {
              json(res, 500, result)
              return
            }
            try {
              await rebuild()
            } catch (error) {
              json(res, 200, { ...result, refreshError: String((error as Error).message) })
              return
            }
            json(res, 200, result)
          },
        }),
      'dsh-overview POST /session/adopt',
    )


    // 迁移（P4）：真正改写转录头 cwd 并搬目录。并入归属表只影响插件聚合视图，宿主侧栏
    // 仍按转录头 cwd 把会话挂到「未分组」；要让宿主认，只能改 cwd。这是本插件第二个会写
    // 宿主数据的入口（另一个是永久删除），所以：串行、逐条备份、失败不清场、全部成功才补成员表。
    scope.effect(
      () =>
        scope.webServer.register({
          kind: 'exact',
          path: '/dsh-overview/session/migrate',
          handler: async (req, res) => {
            const body = await guardedJson<{ workspaceId?: unknown; sessionIds?: unknown }>(req, res, 32 * 1024)
            if (!body) return
            const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId.trim() : ''
            const ids = Array.isArray(body.sessionIds)
              ? [...new Set(body.sessionIds.filter((x): x is string => typeof x === 'string' && x.length > 0))].slice(0, 200)
              : []
            if (!workspaceId || ids.length === 0) {
              json(res, 400, { ok: false, error: 'workspaceId and sessionIds are required' })
              return
            }
            const wsRes = readWorkspaces(workspaceJsonPath(home))
            const workspace = wsRes.data.find((w) => w.id === workspaceId)
            if (!workspace) {
              json(res, 404, { ok: false, error: '工作区不存在' })
              return
            }
            const warnings: string[] = []
            const result: BatchResult = await runSerialBatch(ids, async (id) => {
              const migrated = await migrateSessionCwd(home, id, workspace.path)
              if (!migrated.ok) throw new Error(migrated.error ?? '迁移失败')
              if (migrated.error) warnings.push(`${id}：${migrated.error}`)
            })
            const membership = result.succeeded.length > 0
              ? addSessionIdsToWorkspace(home, workspaceId, result.succeeded)
              : { added: [] as string[] }
            if (membership.error) warnings.push(`成员表未更新：${membership.error}`)
            let refreshError: string | undefined
            try {
              await rebuild()
            } catch (error) {
              refreshError = String((error as Error).message)
            }
            json(res, 200, {
              ok: result.failures.length === 0,
              ...result,
              ...(refreshError ? { refreshError } : {}),
              workspace: { id: workspace.id, path: workspace.path, title: workspace.title },
              addedSessionIds: membership.added,
              warnings,
            })
          },
        }),
      'dsh-overview POST /session/migrate',
    )

    // 启动即预热一次（异步，不阻塞 webServer 注册）；失败等首个 /state 请求再试
    void rebuild()
  }) as unknown as (ctx: Context) => void)
}

// 供测试/CLI 直接构造（与打包无关，纯类型辅助）
export type { WorkbenchState }
