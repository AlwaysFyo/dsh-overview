// 查 uiWorkspace 类型定义与 workspaceId 来源
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

const base = 'D:/Projects/dsh-workbench/.refs/dsh-kanban'

function walk(dir, depth = 0) {
  if (depth > 5) return
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    if (['node_modules', '.git'].includes(e.name)) continue
    const f = join(dir, e.name)
    if (e.isDirectory()) walk(f, depth + 1)
    else if (/\.(ts|tsx)$/.test(e.name)) {
      const s = readFileSync(f, 'utf-8')
      const i = s.indexOf('openWorkspace')
      if (i > -1) {
        console.log('==', relative(base, f))
        console.log(s.slice(Math.max(0, i - 400), i + 400))
        console.log()
      }
    }
  }
}
walk(join(base, 'src'))

// KanbanView 里 workspaceId 的来源
const kv = readFileSync(join(base, 'src/client/KanbanView.tsx'), 'utf-8')
for (const m of kv.matchAll(/workspaceId[:=][^,;)]{0,80}/g)) console.log('KV:', m[0].slice(0, 100))
// props 接口定义
const pi = kv.indexOf('interface KanbanViewProps')
if (pi > -1) console.log(kv.slice(pi, pi + 800))
