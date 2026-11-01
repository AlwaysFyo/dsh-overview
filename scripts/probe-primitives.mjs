// 探查 primitives 包的 Icon 组件与可用图标名
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const d = 'D:/Projects/dsh-workbench/node_modules/@deepseek-ai/dsh-client-ui-primitives'
const typesDir = join(d, 'lib', 'types')
console.log('lib 内容:', readdirSync(join(d, 'lib')).slice(0, 20))

// 从类型声明里找 Icon 相关导出
const index = readFileSync(join(typesDir, 'index.d.ts'), 'utf-8')
const iconExports = [...index.matchAll(/export[^;]*\b(\w*[Ii]con\w*)\b/g)].map((m) => m[1])
console.log('Icon 导出:', [...new Set(iconExports)])

// 找图标名清单：常见形式 iconNames / IconName 类型 / 单独的 icons 模块
function walk(dir, depth = 0) {
  if (depth > 3) return
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, depth + 1)
    else if (/icon/i.test(e.name)) console.log('icon 文件:', p.replace(d, ''))
  }
}
walk(typesDir)

// 在 index.d.ts 里找 IconName 类型定义
const m = index.match(/IconName[^;]{0,600}/)
if (m) console.log('IconName 类型:', m[0].slice(0, 500))
const m2 = index.match(/export declare (const|function) Icon[^;]{0,300}/)
if (m2) console.log('Icon 组件声明:', m2[0].slice(0, 300))
