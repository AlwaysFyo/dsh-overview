/**
 * 宿主删除逻辑单测：用假 ctx（sessions/persistence/projCache/registry）验证
 * 「物理删除成功才动记账」的顺序与高危路径的所有权校验，不触碰真实 ~/.dsh。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { deleteSessionArtifacts, purgeArchiveCache } from '../src/host/deleteSession.ts'

const SESSION_ID = 'session-abc'

function makeFixture() {
  const root = mkdtempSync(join(tmpdir(), 'dshwb-del-'))
  const project = '--D-Projects-demo--'
  const dir = join(root, project, SESSION_ID)
  mkdirSync(dir, { recursive: true })
  const file = join(dir, 'session.v4.jsonl')
  writeFileSync(file, '{"type":"session"}\n')

  const header = { id: SESSION_ID, cwd: 'D:\\Projects\\demo' }
  const calls = {
    cacheDeleted: false,
    archivedStates: [] as unknown[],
    emitted: [] as string[],
  }

  const ctx = {
    get(name: string): unknown {
      if (name === 'sessions') return { get: () => undefined }
      if (name === 'sessionPersistence')
        return {
          name: 'session-persistence-jsonl',
          root,
          locate: () => ({ path: file, kind: 'jsonl' }),
          // 真实 jsonl 后端在文件消失后 stat 返回 undefined
          stat: async () => (existsSync(file) ? { header } : undefined),
          list: async () => (existsSync(file) ? [header] : []),
        }
      if (name === 'sessionProjectionCache')
        return {
          requireTable: () => ({
            delete: async () => {
              calls.cacheDeleted = true
            },
          }),
        }
      if (name === 'workspaceRegistry')
        return {
          requireState: () => ({ archivedSessionIds: [SESSION_ID], workspaceIds: ['ws1'] }),
          setState: async (next: unknown) => {
            calls.archivedStates.push(next)
          },
          requireTable: () => ({
            get: () => ({ sessionIds: [SESSION_ID] }),
            update: async (_id: string, fn: (current: Record<string, unknown>) => Record<string, unknown>) =>
              fn({ sessionIds: [SESSION_ID] }),
          }),
          entities: { get: () => undefined },
          headers: new Map(),
          sessionPaths: new Map(),
          invalidSessionPaths: new Map(),
        }
      return undefined
    },
    emit: (event: string, id: string) => {
      calls.emitted.push(`${event}:${id}`)
    },
  }

  return { root, dir, file, ctx, calls }
}

test('删除成功：转录目录移除、缓存清理、记账更新并广播事件', async () => {
  const fx = makeFixture()
  try {
    const result = await deleteSessionArtifacts(fx.ctx, SESSION_ID)
    assert.equal(result.deleted, true)
    assert.equal(existsSync(fx.dir), false, '会话目录应被递归删除')
    assert.equal(fx.calls.cacheDeleted, true)
    assert.equal(fx.calls.archivedStates.length, 1, '应从归档集合摘除')
    assert.deepEqual((fx.calls.archivedStates[0] as { archivedSessionIds: string[] }).archivedSessionIds, [])
    assert.deepEqual(fx.calls.emitted, [`api-session/removed:${SESSION_ID}`])
  } finally {
    rmSync(fx.root, { recursive: true, force: true })
  }
})

test('未知会话：幂等返回 skipped，不抛错', async () => {
  const fx = makeFixture()
  try {
    const ctx = {
      ...fx.ctx,
      get(name: string) {
        const value = fx.ctx.get(name)
        if (name === 'sessionPersistence')
          return { ...(value as object), stat: async () => undefined, list: async () => [] }
        return value
      },
    }
    const result = await deleteSessionArtifacts(ctx, 'session-missing')
    assert.equal(result.deleted, true)
    assert.equal(result.skipped, true)
  } finally {
    rmSync(fx.root, { recursive: true, force: true })
  }
})

test('非法 sessionId 直接拒绝，不触碰文件系统', async () => {
  const fx = makeFixture()
  try {
    await assert.rejects(() => deleteSessionArtifacts(fx.ctx, '../escape'), /invalid session id/)
    assert.equal(existsSync(fx.dir), true)
  } finally {
    rmSync(fx.root, { recursive: true, force: true })
  }
})

test('清理归档缓存：只删 record.sessionId 匹配的记录，损坏文件跳过', async () => {
  const home = mkdtempSync(join(tmpdir(), 'dshwb-home-'))
  try {
    const dir = join(home, 'storages', 'session_projcache_archive_manager_v2', 'sessions')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'a.json'), JSON.stringify({ record: { sessionId: 'session-abc', rows: {} } }))
    writeFileSync(join(dir, 'b.json'), JSON.stringify({ record: { sessionId: 'session-other', rows: {} } }))
    writeFileSync(join(dir, 'broken.json'), '{not json')

    const removed = await purgeArchiveCache(home, 'session-abc')
    assert.deepEqual(removed, ['a.json'])
    assert.equal(existsSync(join(dir, 'a.json')), false)
    assert.equal(existsSync(join(dir, 'b.json')), true)
    assert.equal(existsSync(join(dir, 'broken.json')), true)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})
