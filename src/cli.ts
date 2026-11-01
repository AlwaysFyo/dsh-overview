/**
 * 调试 CLI：node src/cli.ts [snapshot] [--json] [--project <关键词>]
 * 用真实 ~/.dsh 数据产出 L1 视图数据，肉眼验收 adapter 正确性。
 */
import { buildState } from './model/buildState.ts'
import { dshHome } from './model/paths.ts'
import type { ProjectState, WorkbenchState } from './model/types.ts'

const args = process.argv.slice(2)
const asJson = args.includes('--json')
const projectFilterIdx = args.indexOf('--project')
const projectFilter = projectFilterIdx > -1 ? args[projectFilterIdx + 1] : null

const state = buildState({ home: dshHome() })
const filtered: WorkbenchState = projectFilter
  ? {
      ...state,
      projects: state.projects.filter(
        (p) =>
          p.title.toLowerCase().includes(projectFilter.toLowerCase()) ||
          p.path.toLowerCase().includes(projectFilter.toLowerCase()),
      ),
    }
  : state

if (asJson) {
  console.log(JSON.stringify(filtered, null, 2))
} else {
  printPretty(filtered)
}

function fmtTime(ms: number | null): string {
  if (!ms) return '—'
  const d = new Date(ms)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return sameDay ? `今天 ${hhmm}` : `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${hhmm}`
}

function fmtNum(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function printPretty(state: WorkbenchState): void {
  console.log(`\ndsh-overview snapshot @ ${new Date(state.generatedAt).toLocaleString()}`)
  console.log('='.repeat(78))

  for (const project of state.projects) {
    printProject(project)
  }

  if (state.warnings.length) {
    console.log(`\n⚠ warnings (${state.warnings.length}):`)
    for (const w of state.warnings.slice(0, 10)) console.log(`  - ${w}`)
    if (state.warnings.length > 10) console.log(`  ... 还有 ${state.warnings.length - 10} 条`)
  } else {
    console.log('\n✓ 无告警')
  }
}

function printProject(project: ProjectState): void {
  const live = project.sessions.filter((s) => s.source === 'live')
  const archived = project.sessions.filter((s) => s.archived)
  const cacheOnly = project.sessions.filter((s) => s.source === 'cacheOnly')
  const diskFlag = project.workspaceId !== null && !project.existsOnDisk ? ' [路径失效]' : ''
  const orphanFlag = project.workspaceId === null ? ' [未注册]' : ''

  console.log(
    `\n■ ${project.title}${orphanFlag}${diskFlag}  (${live.length} live / ${archived.length} archived` +
      `${cacheOnly.length ? ` / ${cacheOnly.length} cache-only` : ''})`,
  )
  console.log(`  ${project.path}  最近活动: ${fmtTime(project.lastActivityAt)}`)

  for (const s of project.sessions.slice(0, 8)) {
    const srcTag = s.source === 'live' ? '' : s.source === 'archive' ? ' 📦' : ' ⚠cache'
    const token = s.tokenTotals
      ? ` in:${fmtNum(s.tokenTotals.uncachedInputTokens)} out:${fmtNum(s.tokenTotals.outputTokens)}`
      : ''
    console.log(
      `  · [${fmtTime(s.lastActivityAt)}] ${s.title ?? '(无标题)'}${srcTag}` +
        `  轮次:${s.turns ?? '—'}${token}`,
    )
  }
  if (project.sessions.length > 8) console.log(`  ... 还有 ${project.sessions.length - 8} 个会话`)
}
