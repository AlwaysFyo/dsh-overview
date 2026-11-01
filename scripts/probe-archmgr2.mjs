// 找 archiveSession 的调用方与所属服务
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
      let i = -1
      while ((i = s.indexOf('.archiveSession(', i + 1)) > -1) {
        console.log(`== ${relative(base, f)}`)
        console.log(s.slice(Math.max(0, i - 450), i + 150).replace(/\n/g, ' ').slice(0, 600))
        console.log()
      }
    }
  }
}
walk(base)
