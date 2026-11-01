// 定位 archive-manager 的归档/删除实现
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

const base = 'D:/Projects/dsh-workbench/.refs/dsh-archive-manager/src'

function walk(dir, depth = 0) {
  if (depth > 5) return
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const f = join(dir, e.name)
    if (e.isDirectory()) walk(f, depth + 1)
    else if (/\.tsx?$/.test(e.name)) {
      const s = readFileSync(f, 'utf-8')
      for (const kw of ['archive_manager_v2', 'archiveSession', 'unarchive', 'deleteSession']) {
        let i = -1
        while ((i = s.indexOf(kw, i + 1)) > -1) {
          console.log(`== ${relative(base, f)} @ ${kw}`)
          console.log('   ' + s.slice(Math.max(0, i - 120), i + 220).replace(/\n/g, ' ').slice(0, 320))
        }
      }
    }
  }
}
walk(base)
