// 彻底枚举 primitives 包内全部图标导出
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const d = 'D:/Projects/dsh-workbench/node_modules/@deepseek-ai/dsh-client-ui-primitives'

// 1. icons/index.d.ts 全量 Icon 常量（不限命名模式）
const idx = readFileSync(join(d, 'lib/types/icons/index.d.ts'), 'utf-8')
const all = [...new Set([...idx.matchAll(/export declare const (Icon\w+)/g)].map((m) => m[1]))]
console.log(`icons/index.d.ts: ${all.length} 个 Icon 常量`)
// 按基础名分组（去掉 Regular/Medium 后缀）
const bases = new Map()
for (const n of all) {
  const base = n.replace(/(Regular|Medium)$/, '')
  if (!bases.has(base)) bases.set(base, [])
  bases.get(base).push(n)
}
console.log(`共 ${bases.size} 个基础图形：`)
console.log([...bases.keys()].join(', '))

// 2. icons 目录下还有没有别的类型文件
try {
  console.log('\nicons 类型文件:', readdirSync(join(d, 'lib/types/icons')).join(', '))
} catch (e) { console.log('icons 目录读取失败', e.message) }

// 3. 整包 index.d.ts 的其他 Icon 类导出
const top = readFileSync(join(d, 'lib/types/index.d.ts'), 'utf-8')
const others = [...new Set([...top.matchAll(/export[^;]*\b(\w*Icon\w*|PluginArtwork\w+|GuideArtwork\w+)\b/g)].map((m) => m[1]))]
console.log('\n顶层其他 Icon/Artwork 导出:', others.join(', '))
