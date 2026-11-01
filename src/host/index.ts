/**
 * dsh-workbench 宿主侧插件。
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

export const name = 'dsh-workbench'

interface WorkbenchWebServer {
  register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: unknown, res: unknown) => void | Promise<void> }): () => void
}

interface Scope {
  webServer: WorkbenchWebServer
  effect(fn: () => () => void, label?: string): void
}

const SSE_DEBOUNCE_MS = 400

function describeService(svc: unknown): unknown {
  if (svc === null || typeof svc !== 'object') return { type: typeof svc }
  const proto = Object.getPrototypeOf(svc) as object | null
  const fns = new Set<string>()
  for (const obj of [svc, proto ?? {}]) {
    for (const k of Object.getOwnPropertyNames(obj)) {
      try {
        if (typeof (obj as Record<string, unknown>)[k] === 'function' && k !== 'constructor') fns.add(k)
      } catch {
        /* getter 可能抛错 */
      }
    }
  }
  return { type: svc.constructor?.name ?? 'object', methods: [...fns] }
}

export function apply(ctx: Context): void {
  const debugLog: unknown[] = []

  // 宿主服务面探测（Q2 会话状态 / Q5 打开会话 的候选来源），结果经 GET /_debug 查看。
  // 必须在 dsh-base 服务挂载后执行——放进 webServer 就绪回调（此刻基础服务必然就绪）。
  const probeServices = () => {
    const getSvc = (ctx as unknown as { get(name: string): unknown }).get.bind(ctx)
    for (const name of ['sessions', 'session', 'workspace', 'workspaces', 'settings', 'connection', 'agents']) {
      try {
        const svc = getSvc(name)
        debugLog.push({ probe: name, result: svc === undefined ? 'undefined' : describeService(svc) })
      } catch (e) {
        debugLog.push({ probe: name, error: String(e).slice(0, 200) })
      }
    }
  }

  /** 采样 sessions/agents 服务返回形态（Q2/Q5 落地前调研），经 GET /_debug 查看 */
  const sampleSessionService = () => {
    try {
      const svc = (ctx as unknown as { get(name: string): unknown }).get('sessions') as
        | { list?: () => unknown; get?: (id: string) => unknown; liveEntryFor?: (id: string) => unknown }
        | undefined
      if (!svc) return
      const push = (label: string, value: unknown) => {
        try {
          debugLog.push({ sample: label, value: JSON.stringify(value)?.slice(0, 600) ?? String(value) })
        } catch (e) {
          debugLog.push({ sample: label, error: String(e).slice(0, 200) })
        }
      }
      const list = svc.list?.()
      push('sessions.list()', list)
      // list 结果里取一个 id 采样 get/liveEntryFor
      const firstId = extractFirstId(list)
      if (firstId) {
        push(`sessions.get(${firstId})`, svc.get?.(firstId))
        push(`sessions.liveEntryFor(${firstId})`, svc.liveEntryFor?.(firstId))
      }
    } catch (e) {
      debugLog.push({ sample: 'sessions', error: String(e).slice(0, 300) })
    }
  }

  /** 从 list 返回值里尽力提取第一个会话 id */
  function extractFirstId(list: unknown): string | null {
    const seen = new Set<unknown>()
    const walk = (v: unknown, depth: number): string | null => {
      if (v === null || typeof v !== 'object' || depth > 4 || seen.has(v)) return null
      seen.add(v)
      if (Array.isArray(v)) {
        for (const item of v) {
          const hit = walk(item, depth + 1)
          if (hit) return hit
        }
        return null
      }
      const obj = v as Record<string, unknown>
      for (const key of ['sessionId', 'id', 'sessionKey']) {
        if (typeof obj[key] === 'string') return obj[key]
      }
      for (const value of Object.values(obj)) {
        const hit = walk(value, depth + 1)
        if (hit) return hit
      }
      return null
    }
    return walk(list, 0)
  }

  /** 从 sessions.list() 返回值收集全部会话 id（Q2：liveSessionIds 数据源） */
  function collectSessionIds(list: unknown): string[] {
    const ids = new Set<string>()
    const seen = new Set<unknown>()
    const walk = (v: unknown, depth: number): void => {
      if (v === null || typeof v !== 'object' || depth > 5 || seen.has(v)) return
      seen.add(v)
      if (Array.isArray(v)) {
        for (const item of v) walk(item, depth + 1)
        return
      }
      const obj = v as Record<string, unknown>
      for (const key of ['sessionId', 'sessionKey']) {
        if (typeof obj[key] === 'string') ids.add(obj[key])
      }
      for (const value of Object.values(obj)) walk(value, depth + 1)
    }
    walk(list, 0)
    return [...ids]
  }

  ctx.inject(['webServer'], ((scope: Scope) => {
    probeServices()
    sampleSessionService()
    const home = dshHome()
    let state: WorkbenchState = buildState({ home })
    let revision = 1
    const sseClients = new Set<NodeJS.WritableStream>()

    // Q2：当前实例运行中的会话 id（sessions 服务为 profile 范围；不可用时回退空集）
    const sessionsSvc = (ctx as unknown as { get(name: string): unknown }).get('sessions') as
      | { list?: () => unknown }
      | undefined
    const liveSessionIds = (): string[] => {
      if (!sessionsSvc?.list) return []
      try {
        return collectSessionIds(sessionsSvc.list())
      } catch {
        return []
      }
    }

    // 内容签名：宿主会周期性重写投影缓存，若聚合结果没变就不升 revision、不推 SSE
    const signature = (s: WorkbenchState): string => JSON.stringify({ ...s, generatedAt: '' })
    let lastSignature = signature(state)

    const rebuild = () => {
      try {
        const next = buildState({ home })
        const sig = signature(next)
        if (sig === lastSignature) return
        state = next
        lastSignature = sig
        revision += 1
        for (const res of sseClients) {
          ;(res as { writableEnded?: boolean; write(s: string): boolean }).write('event: change\ndata: changed\n\n')
        }
      } catch {
        // R5：重建失败保留旧快照，不崩宿主
      }
    }

    // 数据目录变更 → 防抖重建 + SSE 推送（watcher 失效时客户端仍可轮询 /state）
    let timer: ReturnType<typeof setTimeout> | null = null
    const scheduleRebuild = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(rebuild, SSE_DEBOUNCE_MS)
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
    }, 'dsh-workbench watchers')

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
          path: '/dsh-workbench/state',
          handler: (_req, res) => json(res, 200, { revision, liveSessionIds: liveSessionIds(), ...state }),
        }),
      'dsh-workbench /state',
    )

    scope.effect(
      () =>
        scope.webServer.register({
          kind: 'exact',
          path: '/dsh-workbench/events',
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
            sseClients.add(r as unknown as NodeJS.WritableStream)
            const release = () => sseClients.delete(r as unknown as NodeJS.WritableStream)
            ;(r as unknown as { on: (ev: string, fn: () => void) => void }).on('close', release)
          },
        }),
      'dsh-workbench /events',
    )

    // 会话永久删除：宿主侧物理清理（转录目录 + 投影缓存 + 工作区记账），
    // 语义见 src/host/deleteSession.ts。客户端不再依赖 archive-manager 的远程方法。
    scope.effect(
      () =>
        scope.webServer.register({
          kind: 'exact',
          path: '/dsh-workbench/session/delete',
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
              rebuild()
              json(res, 200, { ok: true, ...result })
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error)
              json(res, 500, { ok: false, error: message })
            }
          },
        }),
      'dsh-workbench POST /session/delete',
    )

    // 插桩通道：client 上报运行时服务面（POST），宿主服务面探测结果共享本日志（GET）
    scope.effect(
      () =>
        scope.webServer.register({
          kind: 'exact',
          path: '/dsh-workbench/_debug',
          handler: (req, res) => {
            const q = req as { method?: string; on(ev: string, fn: (c?: Buffer) => void): void }
            if (q.method === 'POST') {
              const chunks: Buffer[] = []
              q.on('data', (c?: Buffer) => c && chunks.push(c))
              q.on('end', () => {
                try {
                  debugLog.push(JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}'))
                } catch {
                  debugLog.push({ unparsed: Buffer.concat(chunks).toString('utf-8').slice(0, 2000) })
                }
                json(res, 204, null)
              })
            } else {
              json(res, 200, debugLog)
            }
          },
        }),
      'dsh-workbench /_debug',
    )
  }) as unknown as (ctx: Context) => void)
}

// 供测试/CLI 直接构造（与打包无关，纯类型辅助）
export type { WorkbenchState }
