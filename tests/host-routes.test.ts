/**
 * 宿主路由集成测试：不启动宿主，只把 apply() 挂到假 ctx 上，再按真实 HTTP 形状发请求。
 *
 * 覆盖 P2/P3 的路由契约：/state、/search（含同源与 405）、/preview 的 404、
 * /session/batch 的 BatchResult 契约与物理删除效果。
 * 全部指向临时 DSH_HOME，不触碰真实 ~/.dsh。
 */
import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { zstdCompressSync } from 'node:zlib'
import { apply } from '../src/host/index.ts'

const T0 = 1_760_000_000_000
const SESSION_ID = 'session-abc'
const PROJECT = '--D-Projects-demo--'
const HOST = '127.0.0.1:22856'
/** 每个 bootstrap 的 disposer，测试结束后统一释放，避免 watcher 把进程挂住 */
const LIVE: Array<() => void> = []
after(() => {
  for (const dispose of LIVE) dispose()
  LIVE.length = 0
})

interface Captured {
  status: number
  body: any
}

function makeRes(): { res: unknown; captured: Captured } {
  const captured: Captured = { status: 0, body: null }
  const res = {
    writeHead(status: number) {
      captured.status = status
      return res
    },
    end(payload: string) {
      captured.body = JSON.parse(payload)
      return res
    },
    writableEnded: false,
  }
  return { res, captured }
}

function makeReq(method: string, headers: Record<string, string>, body = ''): unknown {
  return {
    method,
    headers: { host: HOST, ...headers },
    on(ev: string, fn: (chunk?: Buffer) => void) {
      if (ev === 'data' && body) setTimeout(() => fn(Buffer.from(body)), 0)
      if (ev === 'end') setTimeout(() => fn(), 1)
    },
  }
}

function makeHome(): { home: string; file: string } {
  const home = mkdtempSync(join(tmpdir(), 'dshwb-route-'))
  mkdirSync(join(home, 'storages'), { recursive: true })
  writeFileSync(
    join(home, 'storages', 'workspace.json'),
    JSON.stringify({
      unit: { name: 'workspace', version: 2 },
      global: { archivedSessionIds: [] },
      tables: {
        workspaces: {
          ws0: {
            path: 'D:\\Projects\\demo',
            title: 'demo',
            sessionIds: [SESSION_ID],
            createdAt: new Date(T0).toISOString(),
            updatedAt: new Date(T0).toISOString(),
          },
        },
      },
    }),
  )
  const dir = join(home, 'sessions', PROJECT, SESSION_ID)
  mkdirSync(dir, { recursive: true })
  const file = join(dir, 'session.v4.jsonl.zstd')
  const lines = [
    JSON.stringify({ type: 'session', version: 4, id: SESSION_ID, createdAt: T0, cwd: 'D:\\Projects\\demo' }),
    JSON.stringify({
      type: 'user/message',
      seq: 2,
      time: T0,
      data: { role: 'user', content: [{ type: 'text', text: '修复登录页的层叠顺序' }], source: { kind: 'user' } },
    }),
  ]
  writeFileSync(file, zstdCompressSync(Buffer.from(lines.join('\n') + '\n')))
  return { home, file }
}

/** 假 ctx：路由表 + 删除所需的宿主服务最小面 */
function bootstrap(home: string, file?: string) {
  const routes = new Map<string, (req: unknown, res: unknown) => void | Promise<void>>()
  const disposers: Array<() => void> = []
  const scope = {
    webServer: {
      register(route: { path: string; handler: (req: unknown, res: unknown) => void | Promise<void> }) {
        routes.set(route.path, route.handler)
        return () => routes.delete(route.path)
      },
    },
    effect(fn: () => () => void) {
      disposers.push(fn())
    },
  }
  const ctx = {
    inject(_deps: string[], fn: (s: unknown) => void) {
      fn(scope)
    },
    effect(fn: () => () => void) {
      disposers.push(fn())
    },
    get(name: string): unknown {
      if (name === 'sessions') return { get: () => undefined }
      if (name === 'sessionPersistence')
        return {
          name: 'session-persistence-jsonl',
          root: join(home, 'sessions'),
          // 真实后端按 header 找目录；这里直接给文件，便于断言物理删除
          locate: () => (file ? { path: file, kind: 'jsonl' } : undefined),
          stat: async () =>
            file && existsSync(file) ? { header: { id: SESSION_ID, cwd: 'D:\\Projects\\demo' } } : undefined,
          list: async () => [],
        }
      if (name === 'workspaceRegistry')
        return {
          requireState: () => ({ archivedSessionIds: [], workspaceIds: ['ws0'] }),
          requireTable: () => ({ get: () => ({ sessionIds: [SESSION_ID] }), update: async () => ({}) }),
          entities: { get: () => undefined },
          headers: new Map(),
          sessionPaths: new Map(),
          invalidSessionPaths: new Map(),
        }
      return undefined
    },
    emit: () => {},
  }
  process.env.DSH_HOME = home
  apply(ctx as unknown as Parameters<typeof apply>[0])
  return { routes, dispose: () => disposers.forEach((d) => d()) }
}

async function call(routes: Map<string, any>, path: string, req: unknown): Promise<Captured> {
  const handler = routes.get(path)
  assert.ok(handler, `路由未注册：${path}`)
  const { res, captured } = makeRes()
  await handler(req, res)
  return captured
}

test('GET /state：返回快照骨架（projects + diagnostics）', async () => {
  const { home } = makeHome()
  const { routes, dispose } = bootstrap(home)
  try {
    const out = await call(routes, '/dsh-overview/state', makeReq('GET', {}))
    assert.equal(out.status, 200)
    assert.ok(Array.isArray(out.body.projects))
    assert.ok(out.body.diagnostics, 'diagnostics 必须常驻')
    assert.equal(typeof out.body.revision, 'number')
  } finally {
    dispose()
  }
})

test('POST /search：命中正文并带片段区间；GET 被 405 拒绝', async () => {
  const { home } = makeHome()
  const { routes, dispose } = bootstrap(home)
  try {
    const ok = await call(routes, '/dsh-overview/search', makeReq('POST', {}, JSON.stringify({ query: '登录页' })))
    assert.equal(ok.status, 200)
    assert.equal(ok.body.ok, true)
    assert.equal(ok.body.hits.length, 1)
    assert.equal(ok.body.hits[0].role, 'user')
    assert.ok(ok.body.hits[0].ranges.length > 0)

    const wrongMethod = await call(routes, '/dsh-overview/search', makeReq('GET', {}))
    assert.equal(wrongMethod.status, 405)
  } finally {
    dispose()
  }
})

test('POST /search：跨源 Origin 被 403 拒绝，空 query 被 400 拒绝', async () => {
  const { home } = makeHome()
  const { routes, dispose } = bootstrap(home)
  try {
    const crossOrigin = await call(
      routes,
      '/dsh-overview/search',
      makeReq('POST', { origin: 'https://evil.example' }, JSON.stringify({ query: '登录页' })),
    )
    assert.equal(crossOrigin.status, 403)

    const empty = await call(routes, '/dsh-overview/search', makeReq('POST', {}, JSON.stringify({ query: '   ' })))
    assert.equal(empty.status, 400)
  } finally {
    dispose()
  }
})

test('POST /preview：未知会话 404，已知会话返回消息与 hit 标记', async () => {
  const { home } = makeHome()
  const { routes, dispose } = bootstrap(home)
  try {
    const missing = await call(
      routes,
      '/dsh-overview/preview',
      makeReq('POST', {}, JSON.stringify({ sessionId: 'session-nope' })),
    )
    assert.equal(missing.status, 404)

    const found = await call(
      routes,
      '/dsh-overview/preview',
      makeReq('POST', {}, JSON.stringify({ sessionId: SESSION_ID, query: '登录页' })),
    )
    assert.equal(found.status, 200)
    assert.equal(found.body.messages.length, 1)
    assert.equal(found.body.messages[0].hit, true)
  } finally {
    dispose()
  }
})

test('POST /session/batch：返回 BatchResult 并真的删掉转录文件', async () => {
  const { home, file } = makeHome()
  const { routes, dispose } = bootstrap(home, file)
  try {
    const out = await call(
      routes,
      '/dsh-overview/session/batch',
      makeReq('POST', {}, JSON.stringify({ ids: [SESSION_ID] })),
    )
    assert.equal(out.status, 200)
    assert.equal(out.body.requested, 1)
    assert.deepEqual(out.body.failures, [])
    assert.deepEqual(out.body.remaining, [])
    assert.equal(existsSync(file), false, '转录文件必须被物理删除')
  } finally {
    dispose()
  }
})

test('POST /session/adopt：只写插件归属表，参数校验严格，且不碰 workspace.json', async () => {
  const { home } = makeHome()
  const { routes } = bootstrap(home)
  const wsFile = join(home, 'storages', 'workspace.json')
  const wsBefore = readFileSync(wsFile, 'utf8')

  const noCwd = await call(routes, '/dsh-overview/session/adopt', makeReq('POST', {}, JSON.stringify({ workspaceId: 'ws0' })))
  assert.equal(noCwd.status, 400)
  assert.match(String(noCwd.body.error), /cwd is required/)

  const noWs = await call(
    routes,
    '/dsh-overview/session/adopt',
    makeReq('POST', {}, JSON.stringify({ cwd: 'D:\\\\Projects\\\\old' })),
  )
  assert.equal(noWs.status, 400)

  const ok = await call(
    routes,
    '/dsh-overview/session/adopt',
    makeReq('POST', {}, JSON.stringify({ workspaceId: 'ws0', cwd: 'D:\\Projects\\old' })),
  )
  assert.equal(ok.status, 200)
  assert.equal(ok.body.ok, true)
  const aliasFile = join(home, 'storages', 'dsh-overview-aliases.json')
  const saved = JSON.parse(readFileSync(aliasFile, 'utf8')) as { cwds: Record<string, string> }
  assert.equal(Object.values(saved.cwds)[0], 'ws0')
  // 宿主数据一个字节都不动
  assert.equal(readFileSync(wsFile, 'utf8'), wsBefore)

  const forget = await call(
    routes,
    '/dsh-overview/session/adopt',
    makeReq('POST', {}, JSON.stringify({ cwd: 'D:\\Projects\\old', forget: true })),
  )
  assert.equal(forget.status, 200)
  const cleared = JSON.parse(readFileSync(aliasFile, 'utf8')) as { cwds: Record<string, string> }
  assert.deepEqual(cleared.cwds, {})
})

test('POST /session/migrate：改 cwd + 搬目录 + 补成员表；参数与未知工作区分别 400/404', async () => {
  const { home, file } = makeHome()
  const wsFile = join(home, 'storages', 'workspace.json')
  const raw = JSON.parse(readFileSync(wsFile, 'utf8')) as any
  raw.tables.workspaces.ws1 = { path: 'D:\\Projects\\other', title: 'other', sessionIds: [] }
  writeFileSync(wsFile, JSON.stringify(raw))

  const { routes, dispose } = bootstrap(home)
  try {
    const empty = await call(routes, '/dsh-overview/session/migrate', makeReq('POST', {}, JSON.stringify({})))
    assert.equal(empty.status, 400, '缺参必须 400')

    const unknown = await call(
      routes,
      '/dsh-overview/session/migrate',
      makeReq('POST', {}, JSON.stringify({ workspaceId: 'ws-nope', sessionIds: [SESSION_ID] })),
    )
    assert.equal(unknown.status, 404, '未知工作区必须 404，且不能动任何文件')
    assert.equal(existsSync(file), true)

    const ok = await call(
      routes,
      '/dsh-overview/session/migrate',
      makeReq('POST', {}, JSON.stringify({ workspaceId: 'ws1', sessionIds: [SESSION_ID] })),
    )
    assert.equal(ok.status, 200)
    assert.deepEqual(ok.body.succeeded, [SESSION_ID])
    assert.equal(ok.body.ok, true)
    assert.equal(existsSync(file), false, '旧位置的转录要消失')
    assert.ok(
      existsSync(join(home, 'sessions', '--D-Projects-other--', SESSION_ID, 'session.v4.jsonl.zstd')),
      '新目录要出现转录',
    )
    const ws = JSON.parse(readFileSync(wsFile, 'utf8')) as any
    assert.deepEqual(ws.tables.workspaces.ws1.sessionIds, [SESSION_ID], '成员表要补上这个会话')
  } finally {
    dispose()
  }
})
