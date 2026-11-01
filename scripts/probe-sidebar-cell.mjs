// 扫描 profile 里所有 client.js 的 sidebar.panellist 用法，对齐官方样式
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const base = join(homedir(), '.dsh', 'profiles', 'desktop', 'node_modules')
const hits = []
for (const dir of readdirSync(base)) {
  const f = join(base, dir, 'lib', 'client.js')
  try {
    const s = readFileSync(f, 'utf-8')
    const i = s.indexOf('sidebar.panellist')
    if (i > -1) hits.push({ pkg: dir, file: f, at: i })
  } catch {}
}
console.log('含 sidebar.panellist 的包:', hits.map((h) => h.pkg).join(', '))
for (const h of hits) {
  const s = readFileSync(h.file, 'utf-8')
  // 找 panellist 注册的组件名
  const m = s.slice(h.at - 50, h.at + 400)
  console.log(`\n======== ${h.pkg} ========`)
  console.log(m)
}
