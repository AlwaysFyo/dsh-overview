import assert from 'node:assert/strict'
import test from 'node:test'
import {
  bindSessionLiveness,
  getLivenessSnapshot,
  runningIdsFromList,
} from '../src/client/liveness.ts'

/**
 * 「运行中」真源测试：官方客户端会话快照 → 运行中 id。
 * 与宿主 SessionStore.list() 无关（那条路在常驻 webServer 里恒为空）。
 */

const session = (id: string, extra: Record<string, unknown> = {}) => ({ id, ...extra })

test('runningIdsFromList：running / 子代理 / 等待交互都算运行中', () => {
  const ids = runningIdsFromList({
    byId: {
      a: session('s-running', { running: true }),
      b: session('s-subagent', { running: false, runningSubagentCount: 2 }),
      c: session('s-waiting', { running: false, pendingInteraction: 'approval' }),
      d: session('s-idle', { running: false, runningSubagentCount: 0 }),
      e: session('s-failed', { running: false, failed: true }),
    },
  })
  assert.deepEqual(ids, ['s-running', 's-subagent', 's-waiting'])
})

test('runningIdsFromList：快照缺失/畸形返回空数组而不抛', () => {
  assert.deepEqual(runningIdsFromList(undefined), [])
  assert.deepEqual(runningIdsFromList({}), [])
  assert.deepEqual(runningIdsFromList({ byId: { x: null, y: { id: 42 } } }), [])
})

test('bindSessionLiveness：绑定后立即出快照，订阅变化后更新，dispose 后不再更新', () => {
  let value: { byId: Record<string, { id: string; running?: boolean }> } = {
    byId: { a: session('s1', { running: true }) },
  }
  const listeners = new Set<() => void>()
  const source = {
    getSnapshot: () => value,
    subscribe: (fn: () => void) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
  }

  const off = bindSessionLiveness(source)
  const first = getLivenessSnapshot()
  assert.equal(first.ready, true)
  assert.deepEqual([...first.ids], ['s1'])

  value = { byId: { a: session('s1', { running: false }), b: session('s2', { running: true }) } }
  for (const fn of listeners) fn()
  assert.deepEqual([...getLivenessSnapshot().ids], ['s2'])

  off()
  assert.equal(listeners.size, 0)
})

test('bindSessionLiveness：服务不可用时返回空 disposer 且 ready 保持 false', () => {
  const before = getLivenessSnapshot().ready
  const off = bindSessionLiveness(null)
  assert.equal(typeof off, 'function')
  off()
  assert.equal(getLivenessSnapshot().ready, before)
})
