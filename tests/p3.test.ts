/**
 * P3 新能力测试：工作区成员表归属、诊断、正文检索、批量契约、闲置整理。
 * 运行：npm test（node --test tests/p3.test.ts）
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { zstdCompressSync } from 'node:zlib'
import { buildState } from '../src/model/buildState.ts'
import { probeSessionFile, streamLines } from '../src/model/sources.ts'
import { parseMessageLine, matchRanges, searchAcrossSessions, previewSessionContent } from '../src/model/content.ts'
import { runSerialBatch } from '../src/model/batch.ts'
import { adoptCwdIntoWorkspace, aliasFilePath, forgetCwdAlias, readAliases } from '../src/host/adopt.ts'
import { clampIdleDays, idleCandidates } from '../src/model/organize.ts'
import { normalizePath } from '../src/model/paths.ts'
import type { ProjectState, SessionMeta } from '../src/model/types.ts'

const T0 = 1_760_000_000_000
const DAY = 86_400_000

function makeHome(): string {
  return mkdtempSync(join(tmpdir(), 'dshwb-p3-'))
}

function writeWorkspaceJson(home: string, workspaces: Array<Record<string, unknown>>): void {
  const table: Record<string, unknown> = {}
  for (const [i, w] of workspaces.entries()) {
    table[`ws-${i}`] = { sessionIds: [], createdAt: new Date(T0).toISOString(), updatedAt: new Date(T0).toISOString(), ...w }
  }
  mkdirSync(join(home, 'storages'), { recursive: true })
  writeFileSync(
    join(home, 'storages', 'workspace.json'),
    JSON.stringify({ unit: { name: 'workspace', version: 2 }, global: { archivedSessionIds: [] }, tables: { workspaces: table } }),
  )
}

function writeProjcache(home: string, cwd: string, createdAt: number, title: string | null): void {
  const dir = join(home, 'storages', 'session_projcache', 'sessions')
  mkdirSync(dir, { recursive: true })
  const rows: Record<string, unknown> = title === null ? {} : { title: { ver: 1, seq: 1, val: title } }
  writeFileSync(
    join(dir, `${createdAt}-${Math.random().toString(36).slice(2, 8)}.json`),
    JSON.stringify({ version: 7, record: { identity: { formatVersion: 4, createdAt, cwd, isSeeded: false, inheritedEventCount: 0 }, rows } }),
  )
}

function writeSessionFile(home: string, slug: string, dir: string, head: Record<string, unknown>, extraLines: string[] = []): string {
  const dirPath = join(home, 'sessions', slug, dir)
  mkdirSync(dirPath, { recursive: true })
  const file = join(dirPath, 'session.v4.jsonl.zstd')
  const lines = [JSON.stringify({ type: 'session', version: 4, ...head }), ...extraLines]
  writeFileSync(file, zstdCompressSync(Buffer.from(lines.join('\n') + '\n')))
  return file
}

const userLine = (text: string, seq: number, kind = 'user') =>
  JSON.stringify({ type: 'user/message', seq, time: T0, data: { role: 'user', content: [{ type: 'text', text }], source: { kind } } })

const assistantLine = (parts: Array<Record<string, unknown>>, seq: number) =>
  JSON.stringify({ type: 'assistant/message', seq, time: T0, data: { turn: 1, message: { role: 'assistant', content: parts } } })

// ---------- 归属：项目改名/搬目录后会话不丢 ----------

test('工作区成员表优先归属：项目改名后会话仍在本项目，并记录 staleCwds', async () => {
  const home = makeHome()
  const oldCwd = 'D:\\Projects\\old-dir'
  const newCwd = 'D:\\Projects\\new-dir'
  writeWorkspaceJson(home, [{ path: newCwd, title: 'renamed', sessionIds: ['session-aaa'] }])
  writeSessionFile(home, '--D-Projects-old-dir--', 'session-aaa', { id: 'session-aaa', createdAt: T0, cwd: oldCwd })
  writeProjcache(home, oldCwd, T0, '改名前的会话')

  const state = await buildState({ home, checkDisk: false })
  const project = state.projects.find((p) => p.path === newCwd)
  assert.ok(project, '新路径必须存在项目')
  assert.equal(project.sessions.length, 1, '会话不能被丢进孤儿桶')
  assert.equal(project.sessions[0]?.title, '改名前的会话')
  assert.deepEqual(project.staleCwds, [oldCwd], '旧 cwd 要留痕，不能静默忽略')
  assert.equal(state.projects.filter((p) => p.id.startsWith('orphan:')).length, 0)
})

test('未登记在任何工作区的会话：仍进孤儿桶，同时列入 diagnostics.unclaimed', async () => {
  const home = makeHome()
  const cwd = 'C:\\Users\\someone\\.dsh'
  writeWorkspaceJson(home, [{ path: 'D:\\Projects\\demo', title: 'demo', sessionIds: [] }])
  writeSessionFile(home, '--C-Users-someone-.dsh--', 'edict-1', { id: 'edict-1', createdAt: T0, cwd, origin: 'subagent' })
  writeProjcache(home, cwd, T0, null)

  const state = await buildState({ home, checkDisk: false })
  assert.equal(state.diagnostics.unclaimed.length, 1)
  assert.equal(state.diagnostics.unclaimed[0]?.sessionId, 'edict-1')
  assert.equal(state.diagnostics.unclaimed[0]?.origin, 'subagent')
  assert.equal(state.diagnostics.cacheIssues.length, 1)
  assert.equal(state.diagnostics.cacheIssues[0]?.kind, 'no-title')
  assert.equal(state.diagnostics.unclaimed[0]?.pathRegistered, false, 'cwd 也没有工作区 → 真无主')
})

test('未登记但 cwd 仍是已注册工作区：pathRegistered=true，不算清理对象', async () => {
  const home = makeHome()
  const cwd = 'D:\\Projects\\demo'
  writeWorkspaceJson(home, [{ path: cwd, title: 'demo', sessionIds: [] }])
  writeSessionFile(home, '--D-Projects-demo--', 'session-zzz', { id: 'session-zzz', createdAt: T0, cwd })
  writeProjcache(home, cwd, T0, '只是没登记')

  const state = await buildState({ home, checkDisk: false })
  assert.equal(state.diagnostics.unclaimed.length, 1)
  assert.equal(state.diagnostics.unclaimed[0]?.pathRegistered, true)
})

// ---------- 正文检索 ----------

test('parseMessageLine：只认 role=user 且 source.kind=user，注入消息被排除', () => {
  const real = parseMessageLine(userLine('真实输入', 2))
  const injected = parseMessageLine(userLine('插件注入', 3, 'injected'))
  assert.equal(real?.text, '真实输入')
  assert.equal(real?.role, 'user')
  assert.equal(injected, null)
})

test('parseMessageLine：assistant 只取 text part，tool-call 不算正文', () => {
  const msg = parseMessageLine(
    assistantLine([{ type: 'text', text: '先看层叠上下文' }, { type: 'tool-call', toolName: 'read' }], 4),
  )
  assert.equal(msg?.role, 'assistant')
  assert.equal(msg?.text, '先看层叠上下文')
})

test('matchRanges：大小写折叠命中原文区间，能跨 ASCII 大小写差异', () => {
  const ranges = matchRanges('const ZIndex = 1; zindex 层级', 'zindex')
  assert.equal(ranges.length, 2)
  const [first] = ranges
  assert.ok(first)
  assert.equal('const ZIndex = 1; zindex 层级'.slice(first[0], first[1]).toLowerCase(), 'zindex')
})

test('searchAcrossSessions：命中正文并带片段区间；注入内容不命中；达到 limit 立即截断', async () => {
  const home = makeHome()
  const a = writeSessionFile(home, '--A--', 's-a', { id: 's-a', createdAt: T0, cwd: 'D:\\A' }, [
    userLine('修复登录页的 zIndex 层级', 2),
    userLine('这段是注入内容 XYZ', 3, 'injected'),
    assistantLine([{ type: 'text', text: '先看 header 组件的层叠上下文' }], 4),
  ])
  const b = writeSessionFile(home, '--B--', 's-b', { id: 's-b', createdAt: T0, cwd: 'D:\\B' }, [
    userLine('登录页的按钮挡住了', 2),
  ])

  const refs = [
    { sessionId: 's-a', file: a },
    { sessionId: 's-b', file: b },
  ]

  const hit = await searchAcrossSessions(refs, { query: '登录页' })
  assert.equal(hit.hits.length, 2)
  assert.equal(hit.truncated, false)
  assert.ok(hit.hits.every((h) => h.snippet.length <= 200))
  assert.ok(hit.hits[0]?.ranges.length)

  const injected = await searchAcrossSessions(refs, { query: 'XYZ' })
  assert.equal(injected.hits.length, 0, '注入消息不参与检索')

  const limited = await searchAcrossSessions(refs, { query: '登录页', limit: 1 })
  assert.equal(limited.hits.length, 1)
  assert.equal(limited.truncated, true)
})

test('previewSessionContent：有命中围绕命中展开，无命中取最近 N 条并标 hit', async () => {
  const home = makeHome()
  const file = writeSessionFile(home, '--C--', 's-c', { id: 's-c', createdAt: T0, cwd: 'D:\\C' }, [
    userLine('第一条：初始化项目', 2),
    assistantLine([{ type: 'text', text: '好的，先建目录' }], 3),
    userLine('第二条：加个搜索框', 4),
    assistantLine([{ type: 'text', text: '已加，支持过滤' }], 5),
  ])

  const tail = await previewSessionContent(file, '', 2)
  assert.equal(tail.messages.length, 2)
  assert.equal(tail.messages[0]?.text, '第二条：加个搜索框')
  assert.ok(tail.messages.every((m) => m.hit === false))

  const found = await previewSessionContent(file, '搜索框', 8)
  assert.ok(found.messages.some((m) => m.hit), '命中消息必须带 hit 标记')
  assert.ok(found.messages.some((m) => m.text.includes('初始化项目')), '命中前 2 条要带上下文')
})

// ---------- 批量契约 ----------

test('runSerialBatch：串行、单条失败继续、remaining 只含失败项', async () => {
  const seen: string[] = []
  const result = await runSerialBatch(['a', 'b', 'c', 'd'], async (id) => {
    seen.push(id)
    if (id === 'b') throw new Error('boom')
    if (id === 'c') return 'skip'
    return 'ok'
  })
  assert.deepEqual(seen, ['a', 'b', 'c', 'd'], '必须严格串行且不中断')
  assert.equal(result.requested, 4)
  assert.deepEqual(result.succeeded, ['a', 'd'])
  assert.deepEqual(result.skipped, ['c'])
  assert.deepEqual(result.remaining, ['b'])
  assert.equal(result.failures[0]?.error, 'boom')
})

// ---------- 闲置整理 ----------

function meta(partial: Partial<SessionMeta> & { id: string }): SessionMeta {
  return {
    title: 'x',
    cwd: 'D:\\P',
    createdAt: T0,
    lastPromptAt: null,
    lastActivityAt: T0,
    turns: 1,
    tokenTotals: null,
    todos: [],
    archived: false,
    source: 'live',
    dirName: null,
    origin: null,
    parentSession: null,
    derived: false,
    sizeBytes: null,
    empty: false,
    ...partial,
  } as SessionMeta
}

function proj(sessions: SessionMeta[]): ProjectState {
  return {
    id: 'p',
    path: 'D:\\P',
    title: 'P',
    workspaceId: 'ws',
    existsOnDisk: true,
    sessions,
    lastActivityAt: T0,
    staleCwds: [],
  }
}

test('clampIdleDays：非法输入收敛到默认值，越界被夹住', () => {
  assert.equal(clampIdleDays(Number.NaN), 30)
  assert.equal(clampIdleDays(0), 1)
  assert.equal(clampIdleDays(1e9), 36_500)
  assert.equal(clampIdleDays(7.4), 7)
})

test('idleCandidates：排除运行中/待交互/当前会话/已归档/无活跃时间', () => {
  const now = T0 + 10 * DAY
  const p = proj([
    meta({ id: 'old-1', lastActivityAt: now - 20 * DAY }),
    meta({ id: 'fresh', lastActivityAt: now - 1 * DAY }),
    meta({ id: 'running', lastActivityAt: now - 20 * DAY }),
    meta({ id: 'pending', lastActivityAt: now - 20 * DAY }),
    meta({ id: 'current', lastActivityAt: now - 20 * DAY }),
    meta({ id: 'archived', lastActivityAt: now - 20 * DAY, archived: true }),
    meta({ id: 'never', lastActivityAt: null }),
  ])
  const got = idleCandidates(p, {
    days: 7,
    now,
    liveIds: new Set(['running']),
    currentSessionId: 'current',
    pendingSessionIds: new Set(['pending']),
  })
  assert.deepEqual(got.map((c) => c.sessionId), ['old-1'])
  assert.equal(got[0]?.idleDays, 20)
})

// ---------- 多帧 zstd：宿主每次 append 一帧 ----------

test('streamLines：多帧 zstd 能读到全部行，预览/检索不再只看到首行', async () => {
  const home = makeHome()
  const dirPath = join(home, 'sessions', 'slug', 'dir-multi')
  mkdirSync(dirPath, { recursive: true })
  const file = join(dirPath, 'session.v4.jsonl.zstd')
  const frames = [
    JSON.stringify({ type: 'session', version: 4, id: 's-multi', createdAt: T0, cwd: 'D:/p' }) + '\n' + userLine('第一帧的话', 1) + '\n',
    assistantLine([{ type: 'text', text: '第二帧的回答' }], 2) + '\n',
    userLine('第三帧的追问', 3) + '\n',
  ]
  writeFileSync(file, Buffer.concat(frames.map((f) => zstdCompressSync(Buffer.from(f)))))

  const lines: string[] = []
  await streamLines(file, (line) => {
    lines.push(line)
  })
  assert.equal(lines.length, 4)

  // onLine 返回 false 仍然立即停止
  let seen = 0
  await streamLines(file, () => {
    seen += 1
    return false
  })
  assert.equal(seen, 1)

  const preview = await previewSessionContent(file, '')
  assert.deepEqual(
    preview.messages.map((m) => m.role),
    ['user', 'assistant', 'user'],
  )
  const hit = await searchAcrossSessions([{ sessionId: 's-multi', file }], { query: '第三帧' })
  assert.equal(hit.hits.length, 1)
})

test('归属表：并入/幂等/撤销，且从不碰宿主 workspace.json', async () => {
  const home = makeHome()
  mkdirSync(join(home, 'storages'), { recursive: true })
  const wsFile = join(home, 'storages', 'workspace.json')
  const original = JSON.stringify({
    unit: { name: 'workspace', version: 2 },
    global: { archivedSessionIds: [] },
    tables: { workspaces: { 'ws-1': { id: 'ws-1', path: 'D:\\\\Projects\\\\new-name', sessionIds: [] } } },
  })
  writeFileSync(wsFile, original)

  const first = adoptCwdIntoWorkspace(home, 'ws-1', 'D:\\Projects\\old-name')
  assert.equal(first.ok, true)
  assert.equal(first.changed, true)
  assert.ok(existsSync(aliasFilePath(home)))
  const aliases = readAliases(home)
  assert.equal(Object.keys(aliases).length, 1)
  assert.equal(aliases[Object.keys(aliases)[0]!], 'ws-1')
  // 宿主数据一个字节都不动
  assert.equal(readFileSync(wsFile, 'utf8'), original)

  // 幂等：同一个 cwd 再并一次不算变更
  const again = adoptCwdIntoWorkspace(home, 'ws-1', 'D:\\Projects\\old-name')
  assert.equal(again.ok, true)
  assert.equal(again.changed, false)

  // 空参数直接失败
  assert.equal(adoptCwdIntoWorkspace(home, '', 'D:\\x').ok, false)
  assert.equal(adoptCwdIntoWorkspace(home, 'ws-1', '  ').ok, false)

  // 撤销
  const undo = forgetCwdAlias(home, 'D:\\Projects\\old-name')
  assert.equal(undo.ok, true)
  assert.equal(undo.changed, true)
  assert.deepEqual(readAliases(home), {})
  // 撤销不存在的条目：幂等成功但无变更
  assert.equal(forgetCwdAlias(home, 'D:\\Projects\\old-name').changed, false)

  // 归属表损坏：当作没有，不抛错
  writeFileSync(aliasFilePath(home), '{ this is not json')
  assert.deepEqual(readAliases(home), {})
})

test('buildState：成员表查不到时按插件归属表归组，并记进 staleCwds 且不再算无主', async () => {
  const home = makeHome()
  const createdAt = T0
  writeWorkspaceJson(home, [{ path: 'D:\\Projects\\new-name', title: 'new-name', sessionIds: [] }])
  writeSessionFile(home, '--D-Projects-old-name--', 'session-old', {
    id: 'session-old',
    createdAt,
    cwd: 'D:\\Projects\\old-name',
  })
  writeProjcache(home, 'D:\\Projects\\old-name', createdAt, '旧目录里的会话')

  const before = await buildState({ home })
  const orphanBefore = before.projects.find((p) => p.workspaceId === null)
  assert.ok(orphanBefore, '没有归属表时只能落进孤儿桶')
  assert.equal(orphanBefore?.sessions[0]?.id, 'session-old')
  assert.equal(before.diagnostics.unclaimed.some((u) => u.sessionId === 'session-old'), true)

  const after = await buildState({
    home,
    aliases: { [normalizePath('D:\\Projects\\old-name')]: 'ws-0' },
  })
  assert.equal(after.projects.length, 1)
  assert.equal(after.projects[0]?.workspaceId, 'ws-0')
  assert.equal(after.projects[0]?.sessions[0]?.id, 'session-old')
  assert.deepEqual(after.projects[0]?.staleCwds, ['D:\\Projects\\old-name'])
  assert.equal(after.diagnostics.unclaimed.some((u) => u.sessionId === 'session-old'), false)

  // 归属指向不存在的工作区：退回孤儿桶，不静默丢失
  const dangling = await buildState({
    home,
    aliases: { [normalizePath('D:\\Projects\\old-name')]: 'ws-gone' },
  })
  assert.ok(dangling.projects.some((p) => p.workspaceId === null && p.sessions[0]?.id === 'session-old'))
})

// ---------- 子会话跟随母会话 ----------

test('子会话跟随母会话：父会话在项目里，cwd 是 ~/.dsh 的子会话随父进项目', async () => {
  const home = makeHome()
  const projectCwd = 'D:\\Projects\\demo'
  const subCwd = 'C:\\Users\\someone\\.dsh'
  writeWorkspaceJson(home, [{ path: projectCwd, title: 'demo', sessionIds: ['session-parent'] }])
  writeSessionFile(home, '--D-Projects-demo--', 'd1', { id: 'session-parent', createdAt: T0, cwd: projectCwd })
  writeProjcache(home, projectCwd, T0, '父会话')
  // 子代理转录：cwd 不在项目里，但头里有 parentSession（宿主就写这个字段）
  writeSessionFile(home, '--C-Users-someone-.dsh--', 'd2', {
    id: 'sub-1',
    createdAt: T0 + 1000,
    cwd: subCwd,
    origin: 'subagent',
    delegationDepth: 1,
    parentSession: 'session-parent',
  })
  writeProjcache(home, subCwd, T0 + 1000, '子会话')

  const state = await buildState({ home, checkDisk: false })
  const project = state.projects.find((p) => p.path === projectCwd)
  assert.ok(project, '父会话所在项目必须存在')
  assert.deepEqual(project.sessions.map((x) => x.id).sort(), ['session-parent', 'sub-1'], '子会话要跟着父会话进同一个项目')
  assert.equal(project.sessions.find((x) => x.id === 'sub-1')?.derived, true, '要标记成 derived，界面才能区分')
  assert.deepEqual(project.staleCwds, [], '子会话的 ~/.dsh 不该被记成项目的旧路径')
  assert.equal(state.diagnostics.unclaimed.length, 0, '跟随成功的子会话不再算「无主转录」')
  assert.equal(state.projects.filter((p) => p.id.startsWith('orphan:')).length, 0, '被搬空的孤儿桶要消失')
})

test('子会话的父会话找不到时：仍留在孤儿桶，不静默丢会话', async () => {
  const home = makeHome()
  const subCwd = 'C:\\Users\\someone\\.dsh'
  writeWorkspaceJson(home, [{ path: 'D:\\Projects\\demo', title: 'demo', sessionIds: [] }])
  writeSessionFile(home, '--C-Users-someone-.dsh--', 'd1', {
    id: 'sub-2',
    createdAt: T0,
    cwd: subCwd,
    origin: 'subagent',
    parentSession: 'session-missing',
  })

  const state = await buildState({ home, checkDisk: false })
  assert.ok(state.projects.some((p) => p.sessions.some((x) => x.id === 'sub-2')), '父会话不在时必须保留会话')
  assert.equal(state.diagnostics.unclaimed.length, 1, '父会话缺失 → 仍是无主转录')
})

// ---------- 空壳会话（宿主新建会话后切走，磁盘留壳、宿主不再列出） ----------

test('probeSessionFile：只有头 + 权限事件的转录判为无消息且已读完，正常会话反之', async () => {
  const home = makeHome()
  const shell = writeSessionFile(home, 'slug', 'session-shell', { id: 'session-shell', createdAt: T0, cwd: 'D:\\Projects\\P' }, [
    JSON.stringify({ type: 'permission/preset', seq: 0, time: T0, data: { preset: 'workspace-write' } }),
    JSON.stringify({ type: 'sandbox/mode', seq: 1, time: T0, data: { mode: 'workspace-write' } }),
  ])
  const shellProbe = await probeSessionFile(shell)
  assert.equal(shellProbe.title, null)
  assert.equal(shellProbe.hasMessages, false)
  assert.equal(shellProbe.complete, true, '读到文件末尾才能断言「没有消息」')

  const real = writeSessionFile(home, 'slug', 'session-real', { id: 'session-real', createdAt: T0, cwd: 'D:\\Projects\\P' }, [userLine('你好', 0)])
  const realProbe = await probeSessionFile(real)
  assert.equal(realProbe.title, '你好')
  assert.equal(realProbe.hasMessages, true)
})

test('buildState：空壳会话标 empty；有 assistant 消息但缺标题的会话不算空壳', async () => {
  const home = makeHome()
  const cwd = 'D:\\Projects\\P'
  writeWorkspaceJson(home, [{ path: cwd, title: 'P', sessionIds: ['session-e1', 'session-e2', 'session-e3'] }])
  writeSessionFile(home, '--D-Projects-P--', 'session-e1', { id: 'session-e1', createdAt: T0, cwd }, [
    JSON.stringify({ type: 'sandbox/mode', seq: 0, time: T0, data: { mode: 'workspace-write' } }),
  ])
  writeSessionFile(home, '--D-Projects-P--', 'session-e2', { id: 'session-e2', createdAt: T0 + 1, cwd }, [
    assistantLine([{ type: 'text', text: 'hi' }], 0),
  ])
  writeSessionFile(home, '--D-Projects-P--', 'session-e3', { id: 'session-e3', createdAt: T0 + 2, cwd }, [userLine('真实提问', 0)])

  const state = await buildState({ home, checkDisk: false })
  const byId = new Map(state.projects[0]!.sessions.map((x) => [x.id, x]))
  assert.equal(byId.get('session-e1')!.empty, true, '只有头 + 沙箱事件 = 空壳')
  assert.equal(byId.get('session-e2')!.empty, false, '有 assistant 消息就不算空壳')
  assert.equal(byId.get('session-e3')!.empty, false)
  assert.equal(byId.get('session-e3')!.title, '真实提问')
})
