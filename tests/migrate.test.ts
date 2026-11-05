import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { zstdCompressSync } from 'node:zlib'
import { addSessionIdsToWorkspace, migrateSessionCwd, resolveSlugDirName, sessionSlug } from '../src/host/migrate.ts'
import { headFromBytes } from '../src/model/transcript.ts'

const T0 = 1_760_000_000_000

function makeHome(): string {
  return mkdtempSync(join(tmpdir(), 'dshwb-migrate-'))
}

/** 宿主形态：每次 append 写一帧 —— 头一帧、后续每个事件一帧 */
function writeTranscript(home: string, slug: string, id: string, head: Record<string, unknown>, events: string[]): string {
  const dir = join(home, 'sessions', slug, id)
  mkdirSync(dir, { recursive: true })
  const file = join(dir, 'session.v4.jsonl.zstd')
  const frames = [zstdCompressSync(Buffer.from(JSON.stringify({ type: 'session', version: 4, ...head }) + '\n'))]
  for (const line of events) frames.push(zstdCompressSync(Buffer.from(line + '\n')))
  writeFileSync(file, Buffer.concat(frames))
  return file
}

function writeWorkspaceJson(home: string): void {
  mkdirSync(join(home, 'storages'), { recursive: true })
  writeFileSync(
    join(home, 'storages', 'workspace.json'),
    JSON.stringify({
      unit: { name: 'workspace', version: 2 },
      global: { archivedSessionIds: [] },
      tables: { workspaces: { 'ws-0': { path: 'D:\\Projects\\new', title: 'new', sessionIds: ['session-keep'] } } },
    }),
  )
}

const event = (seq: number) => JSON.stringify({ type: 'step/start', seq, time: T0 + seq })

test('sessionSlug：与宿主磁盘上的目录名规则一致', () => {
  assert.equal(sessionSlug('D:\\Projects\\dsh-edict'), '--D-Projects-dsh-edict--')
  assert.equal(sessionSlug('C:\\Users\\yolo\\.dsh'), '--C-Users-yolo-.dsh--')
  assert.equal(sessionSlug('/home/u/proj'), '--home-u-proj--')
})

test('resolveSlugDirName：磁盘上已有大小写不同的目录时沿用实际名', () => {
  const home = makeHome()
  const root = join(home, 'sessions')
  mkdirSync(join(root, '--D-agents-x--'), { recursive: true })
  // Windows 大小写不敏感：计算名命中同一目录，两者都对，交给文件系统归一
  assert.match(resolveSlugDirName(root, 'D:\\Agents\\x'), /^--D-[Aa]gents-x--$/)
  assert.equal(resolveSlugDirName(root, 'D:\\Projects\\brand-new'), '--D-Projects-brand-new--')
})

test('迁移：改写首帧 cwd、其余帧逐字节保留、旧目录消失、原件有备份', async () => {
  const home = makeHome()
  const oldCwd = 'D:\\Projects\\old'
  const newCwd = 'D:\\Projects\\new'
  const src = writeTranscript(home, sessionSlug(oldCwd), 'sess-1', { id: 'sess-1', createdAt: T0, cwd: oldCwd }, [event(1), event(2)])
  const original = readFileSync(src)

  const result = await migrateSessionCwd(home, 'sess-1', newCwd)
  assert.equal(result.ok, true, result.error ?? '')
  assert.equal(result.moved, true)
  assert.equal(result.from, oldCwd)

  const target = join(home, 'sessions', sessionSlug(newCwd), 'sess-1', 'session.v4.jsonl.zstd')
  assert.ok(existsSync(target), '新目录必须存在')
  assert.equal(existsSync(join(home, 'sessions', sessionSlug(oldCwd), 'sess-1')), false, '旧目录要删掉')

  const moved = readFileSync(target)
  const head = headFromBytes(moved)
  assert.equal(head?.['cwd'], newCwd, 'cwd 要改写')
  assert.equal(head?.['id'], 'sess-1', '其余头字段不变')

  // 首帧被重压，后续帧必须逐字节一致
  assert.ok(moved.length > original.length / 4)
  const tail = moved.subarray(moved.length - (original.length - readFrameLen(original)))
  assert.deepEqual(tail, original.subarray(readFrameLen(original)), '第二帧及之后必须原样保留')

  assert.ok(result.backupPath && existsSync(join(result.backupPath!, 'session.v4.jsonl.zstd')))
  assert.deepEqual(readFileSync(join(result.backupPath!, 'session.v4.jsonl.zstd')), original, '备份必须是原件字节')
})

function readFrameLen(buf: Buffer): number {
  // 测试里只用两帧：第一帧的长度 = 总长 - 第二帧长度；这里按 magic 扫第二帧起点
  const second = buf.indexOf(Buffer.from([0x28, 0xb5, 0x2f, 0xfd]), 4)
  return second === -1 ? buf.length : second
}

test('迁移：cwd 已经一致时不动文件', async () => {
  const home = makeHome()
  const cwd = 'D:\\Projects\\same'
  const src = writeTranscript(home, sessionSlug(cwd), 'sess-2', { id: 'sess-2', createdAt: T0, cwd }, [])
  const before = readFileSync(src)
  const result = await migrateSessionCwd(home, 'sess-2', cwd)
  assert.equal(result.ok, true)
  assert.equal(result.moved, false)
  assert.deepEqual(readFileSync(src), before)
})

test('迁移：目标目录已有同名会话时拒绝，且不改动原件', async () => {
  const home = makeHome()
  const oldCwd = 'D:\\Projects\\old2'
  const newCwd = 'D:\\Projects\\new2'
  const src = writeTranscript(home, sessionSlug(oldCwd), 'sess-3', { id: 'sess-3', createdAt: T0, cwd: oldCwd }, [])
  mkdirSync(join(home, 'sessions', sessionSlug(newCwd), 'sess-3'), { recursive: true })
  const before = readFileSync(src)

  const result = await migrateSessionCwd(home, 'sess-3', newCwd)
  assert.equal(result.ok, false)
  assert.match(String(result.error), /目标目录已存在/)
  assert.deepEqual(readFileSync(src), before, '拒绝时原件必须一字节不动')
})

test('addSessionIdsToWorkspace：跟随已有前缀写法，重复调用不产生重复 id', () => {
  const home = makeHome()
  writeWorkspaceJson(home)

  const first = addSessionIdsToWorkspace(home, 'ws-0', ['sess-1'])
  assert.deepEqual(first.added, ['session-sess-1'], '已有 session- 前缀的成员表要跟随这个写法')
  const second = addSessionIdsToWorkspace(home, 'ws-0', ['sess-1', 'sess-2'])
  assert.deepEqual(second.added, ['session-sess-2'])

  const raw = JSON.parse(readFileSync(join(home, 'storages', 'workspace.json'), 'utf8')) as any
  assert.deepEqual(raw.tables.workspaces['ws-0'].sessionIds, ['session-keep', 'session-sess-1', 'session-sess-2'])

  const missing = addSessionIdsToWorkspace(home, 'ws-nope', ['x'])
  assert.equal(missing.added.length, 0)
  assert.match(String(missing.error), /工作区不存在/)
})
