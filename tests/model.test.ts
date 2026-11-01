/**
 * model 层单元测试：fixture 合成 DSH home 目录，覆盖聚合规则与 R5 容错。
 * 运行：npm test（node --test tests/model.test.ts）
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, utimesSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { zstdCompressSync } from 'node:zlib'
import { buildState } from '../src/model/buildState.ts'

// ---------- fixture 工具 ----------

const T0 = 1_760_000_000_000 // 固定基准时间（epoch ms）

function makeHome(): string {
  return mkdtempSync(join(tmpdir(), 'dshwb-test-'))
}

function writeWorkspaceJson(home: string, workspaces: Array<Record<string, unknown>>, archivedSessionIds: string[] = []): void {
  const table: Record<string, unknown> = {}
  for (const [i, w] of workspaces.entries()) {
    table[`ws-${i}`] = { sessionIds: [], createdAt: new Date(T0).toISOString(), updatedAt: new Date(T0).toISOString(), ...w }
  }
  mkdirSync(join(home, 'storages'), { recursive: true })
  writeFileSync(
    join(home, 'storages', 'workspace.json'),
    JSON.stringify({ unit: { name: 'workspace', version: 2 }, global: { archivedSessionIds }, tables: { workspaces: table } }),
  )
}

function cell(ver: number, val: unknown): { ver: number; seq: number; val: unknown } {
  return { ver, seq: 1, val }
}

function writeProjcache(home: string, cwd: string, createdAt: number, rows: Record<string, unknown>): string {
  const dir = join(home, 'storages', 'session_projcache', 'sessions')
  mkdirSync(dir, { recursive: true })
  const name = `${createdAt}-${Math.random().toString(36).slice(2, 8)}.json`
  writeFileSync(
    join(dir, name),
    JSON.stringify({ version: 7, record: { identity: { formatVersion: 4, createdAt, cwd, isSeeded: false, inheritedEventCount: 0 }, rows } }),
  )
  return name
}

function writeArchive(home: string, sessionId: string, cwd: string, createdAt: number, rows: Record<string, unknown>): void {
  const dir = join(home, 'storages', 'session_projcache_archive_manager_v2', 'sessions')
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, `session_x${Math.random().toString(36).slice(2, 6)}.json`),
    JSON.stringify({ version: 2, record: { sessionId, identity: { formatVersion: 4, createdAt, cwd, isSeeded: false, inheritedEventCount: 0 }, rows } }),
  )
}

function writeSessionFile(home: string, slug: string, dir: string, head: Record<string, unknown>, mtime?: number): void {
  const dirPath = join(home, 'sessions', slug, dir)
  mkdirSync(dirPath, { recursive: true })
  const line = JSON.stringify({ type: 'session', version: 4, ...head })
  const file = join(dirPath, 'session.v4.jsonl.zstd')
  writeFileSync(file, zstdCompressSync(Buffer.from(line + '\n')))
  if (mtime) utimesSync(file, new Date(mtime), new Date(mtime))
}

const titleRow = (title: string) => ({ title: cell(1, title), sessionListMetadata: cell(1, { lastPromptAt: T0 + 1000 }) })

// ---------- 聚合规则 ----------

test('projcache 标题经 (cwd, createdAt) 关联到会话文件', () => {
  const home = makeHome()
  try {
    const cwd = 'D:\\Projects\\demo'
    const createdAt = T0
    writeWorkspaceJson(home, [{ path: cwd, title: 'demo' }])
    writeSessionFile(home, '--D-Projects-demo--', 'session-aaa', { id: 'session-aaa', createdAt, cwd }, T0 + 5000)
    writeProjcache(home, cwd, createdAt, titleRow('修复登录页'))

    const state = buildState({ home, checkDisk: false })
    const project = state.projects.find((p) => p.title === 'demo')
    assert.ok(project, '应有 demo 项目')
    assert.equal(project.sessions.length, 1)
    const s = project.sessions[0]!
    assert.equal(s.title, '修复登录页')
    assert.equal(s.source, 'live')
    assert.equal(s.archived, false)
    assert.equal(s.lastActivityAt, T0 + 5000, 'lastActivityAt 应取文件 mtime 与 lastPromptAt 的较大者')
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('归档记录 + 宿主归档标记 → archived 会话（会话文件不存在也保留）', () => {
  const home = makeHome()
  try {
    const cwd = 'D:\\Projects\\old'
    writeWorkspaceJson(home, [], ['session-old1'])
    writeArchive(home, 'session-old1', cwd, T0, titleRow('已归档任务'))

    const state = buildState({ home, checkDisk: false })
    const project = state.projects[0]!
    assert.equal(project.sessions.length, 1)
    const s = project.sessions[0]!
    assert.equal(s.id, 'session-old1')
    assert.equal(s.archived, true)
    assert.equal(s.source, 'archive')
    assert.equal(s.title, '已归档任务')
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('归档缓存有记录但宿主未标记归档 → 不进入列表（避免无标题幽灵行）', () => {
  const home = makeHome()
  try {
    writeWorkspaceJson(home, [])
    writeArchive(home, 'session-stale', 'D:\\Projects\\old', T0, titleRow('遗留快照'))

    const state = buildState({ home, checkDisk: false })
    const all = state.projects.flatMap((p) => p.sessions)
    assert.equal(all.length, 0)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('live 会话同时被宿主标记归档 → archived=true（归档不删文件）', () => {
  const home = makeHome()
  try {
    const cwd = 'D:\\Projects\\demo'
    const createdAt = T0
    writeWorkspaceJson(home, [{ path: cwd, title: 'demo' }], ['session-live-arch'])
    writeArchive(home, 'session-live-arch', cwd, createdAt, titleRow('归档版'))
    writeSessionFile(home, '--D-Projects-demo--', 'session-live-arch', { id: 'session-live-arch', createdAt, cwd })
    writeProjcache(home, cwd, createdAt, titleRow('最新版'))

    const state = buildState({ home, checkDisk: false })
    const s = state.projects[0]!.sessions[0]!
    assert.equal(s.id, 'session-live-arch')
    assert.equal(s.source, 'live')
    assert.equal(s.archived, true)
    assert.equal(s.title, '最新版')
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('live 会话与同 id 归档记录并存时，live 优先', () => {
  const home = makeHome()
  try {
    const cwd = 'D:\\Projects\\demo'
    const createdAt = T0
    writeWorkspaceJson(home, [])
    writeArchive(home, 'session-x', cwd, createdAt, titleRow('归档版'))
    writeSessionFile(home, '--D-Projects-demo--', 'session-x', { id: 'session-x', createdAt, cwd })
    writeProjcache(home, cwd, createdAt, titleRow('最新版'))

    const state = buildState({ home, checkDisk: false })
    const project = state.projects[0]!
    assert.equal(project.sessions.length, 1, '同 id 不应重复')
    assert.equal(project.sessions[0]!.archived, false)
    assert.equal(project.sessions[0]!.source, 'live')
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('仅 projcache 有记录的会话标记为 cacheOnly', () => {
  const home = makeHome()
  try {
    const cwd = 'D:\\Projects\\ghost'
    writeWorkspaceJson(home, [])
    writeProjcache(home, cwd, T0, titleRow('幽灵会话'))

    const state = buildState({ home, checkDisk: false })
    const project = state.projects[0]!
    assert.equal(project.sessions[0]!.source, 'cacheOnly')
    assert.equal(project.sessions[0]!.title, '幽灵会话')
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('未注册 cwd 的会话进入孤儿桶', () => {
  const home = makeHome()
  try {
    const createdAt = T0
    writeWorkspaceJson(home, [{ path: 'D:\\Projects\\a', title: 'a' }])
    writeSessionFile(home, '--D-Projects-b--', 'session-b1', { id: 'session-b1', createdAt, cwd: 'D:\\Projects\\b' })

    const state = buildState({ home, checkDisk: false })
    const orphan = state.projects.find((p) => p.workspaceId === null)
    assert.ok(orphan, '应有孤儿桶')
    assert.ok(orphan.id.startsWith('orphan:'))
    assert.equal(orphan.sessions.length, 1)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('Windows 路径大小写不敏感归组', () => {
  if (process.platform !== 'win32') return
  const home = makeHome()
  try {
    const createdAt = T0
    writeWorkspaceJson(home, [{ path: 'D:\\Projects\\Demo', title: 'demo' }])
    writeSessionFile(home, '--x--', 'session-c1', { id: 'session-c1', createdAt, cwd: 'd:\\projects\\demo' })

    const state = buildState({ home, checkDisk: false })
    const project = state.projects.find((p) => p.title === 'demo')!
    assert.equal(project.sessions.length, 1, '大小写不同的 cwd 应归入同一项目')
    assert.equal(state.projects.filter((p) => p.workspaceId !== null).length, 1)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

// ---------- R5 容错 ----------

test('workspace.json 缺失时返回空态并告警，不抛异常', () => {
  const home = makeHome()
  try {
    const state = buildState({ home, checkDisk: false })
    assert.deepEqual(state.projects, [])
    assert.ok(state.warnings.some((w) => w.includes('workspace.json')))
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('损坏的 projcache 文件被跳过并告警，其余照常读取', () => {
  const home = makeHome()
  try {
    const cwd = 'D:\\Projects\\demo'
    writeWorkspaceJson(home, [])
    writeProjcache(home, cwd, T0, titleRow('好记录'))
    mkdirSync(join(home, 'storages', 'session_projcache', 'sessions'), { recursive: true })
    writeFileSync(join(home, 'storages', 'session_projcache', 'sessions', 'broken.json'), '{not json')

    const state = buildState({ home, checkDisk: false })
    assert.equal(state.projects[0]!.sessions.length, 1)
    assert.ok(state.warnings.some((w) => w.includes('broken.json')))
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('损坏的会话文件被跳过并告警，其余照常读取', () => {
  const home = makeHome()
  try {
    const cwd = 'D:\\Projects\\demo'
    const createdAt = T0
    writeWorkspaceJson(home, [])
    writeSessionFile(home, '--good--', 'session-good', { id: 'session-good', createdAt, cwd })
    const badDir = join(home, 'sessions', '--bad--', 'session-bad')
    mkdirSync(badDir, { recursive: true })
    writeFileSync(join(badDir, 'session.v4.jsonl.zstd'), Buffer.from('not zstd'))

    const state = buildState({ home, checkDisk: false })
    const project = state.projects[0]!
    assert.equal(project.sessions.length, 1)
    assert.equal(project.sessions[0]!.id, 'session-good')
    assert.ok(state.warnings.some((w) => w.includes('session-bad')))
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})
