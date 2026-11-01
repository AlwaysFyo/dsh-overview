/**
 * dsh-overview 宿主侧插件。
 *
 * 职责：读取 ~/.dsh 存储聚合出 WorkbenchState，通过宿主 webServer 暴露
 * REST + SSE，供渲染端工作台 UI 消费。对宿主数据零写入。
 *
 * 服务注入与路由形态参照 browser-dock / dsh-better-sidebar 的成熟用法：
 *   ctx.inject(['webServer'], (scope) => scope.webServer.register({ kind, path, handler }))
 */
import { watch } from 'node:fs'
import type { Context } from '@deepseek-ai/cordis'
import { buildState } from '../model/buildState.ts'
import { dshHome } from '../model/paths.ts'
import type { WorkbenchState } from '../model/types.ts'
import { deleteSessionArtifacts, purgeArchiveCache, type DeleteSessionResult } from './deleteSession.ts'

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
        building = buildState({ home }).finally(() => {
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

    // 启动即预热一次（异步，不阻塞 webServer 注册）；失败等首个 /state 请求再试
    void rebuild()
  }) as unknown as (ctx: Context) => void)
}

// 供测试/CLI 直接构造（与打包无关，纯类型辅助）
export type { WorkbenchState }
