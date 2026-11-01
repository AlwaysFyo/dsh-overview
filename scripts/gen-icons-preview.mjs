// 生成 primitives 全部图标的静态预览页（docs/icons-preview.html）
// 方法：从 lib/index.js 编译产物里按 Artwork 块提取 jsx("tag",{attrs}) 图形数据，
//       静态拼 SVG——不执行任何组件代码（包内 CSS/重依赖不可加载）。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(join(root, 'node_modules/@deepseek-ai/dsh-client-ui-primitives/lib/index.js'), 'utf-8')

// 按 Artwork 常量切块
const blocks = [...src.matchAll(/const (Icon\w+OutlineArtwork) = /g)]
console.log('Artwork 块:', blocks.length)

const attrs = (body) => {
  const o = {}
  for (const m of body.matchAll(/([A-Za-z_][\w-]*)\s*:\s*(?:"([^"]*)"|'([^']*)'|(\d+(?:\.\d+)?))/g)) {
    o[m[1]] = m[2] ?? m[3] ?? m[4]
  }
  return o
}

const numOrStr = (v) => (v === undefined ? undefined : /^-?\d/.test(v) ? Number(v) : v)

const icons = {}
for (let b = 0; b < blocks.length; b++) {
  const name = blocks[b][1].replace(/OutlineArtwork$/, '')
  const start = blocks[b].index
  const end = b + 1 < blocks.length ? blocks[b + 1].index : start + 6000
  const block = src.slice(start, end)
  const shapes = []
  for (const m of block.matchAll(/jsx\("(\w+)",\s*\{([^}]*)\}\)/g)) {
    const tag = m[1]
    if (!['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'].includes(tag)) continue
    const a = attrs(m[2])
    shapes.push({ tag, a })
  }
  if (shapes.length) icons[name] = shapes
}
console.log('可静态化图标:', Object.keys(icons).length)

const svgOf = (shapes) => {
  const inner = shapes
    .map(({ tag, a }) => {
      const keep = {}
      for (const [k, v] of Object.entries(a)) {
        if (['d', 'x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r', 'points', 'x1', 'x2', 'y1', 'y2'].includes(k)) keep[k] = numOrStr(v)
      }
      const s = Object.entries(keep)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')
      // stroke 图形继承 currentColor；fill-only 图形（无 d 坐标系描边）按原 fill
      const isStroke = a.stroke === 'currentColor' || a.d !== undefined
      return `<${tag} ${s} ${isStroke ? 'stroke="currentColor"' : 'fill="currentColor"'} ${isStroke && !('fill' in keep) ? 'fill="none"' : ''}/>`
    })
    .join('')
  return `<svg width="26" height="26" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`
}

const cells = Object.entries(icons)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, shapes]) => {
    let svg = ''
    try { svg = svgOf(shapes) } catch { svg = '<span style="font-size:10px;color:#c00">ERR</span>' }
    return `<div class="cell" title="Icon${name}OutlineRegular">${svg}<span class="n">${name}</span></div>`
  })
  .join('\n')

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>DSH primitives 图标库</title>
<style>
  body { margin: 0; padding: 24px; background: #181815; color: #e9e7df;
         font: 12px/1.5 "Segoe UI", "Microsoft YaHei", sans-serif; }
  h1 { font-size: 15px; margin: 0 0 4px; }
  p.tip { color: #888780; margin: 0 0 18px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; }
  .cell { display: flex; flex-direction: column; align-items: center; gap: 7px;
          padding: 14px 6px 10px; background: #212120; border: 1px solid rgba(233,231,223,.13);
          border-radius: 9px; color: #e9e7df; }
  .cell:hover { border-color: #93a9f0; color: #93a9f0; }
  .cell .n { font-size: 10px; color: #888780; text-align: center; word-break: break-all; }
  .cell:hover .n { color: #93a9f0; }
</style>
</head>
<body>
<h1>@deepseek-ai/dsh-client-ui-primitives · 图标库</h1>
<p class="tip">${Object.keys(icons).length} 枚（Regular 1px 档静态重绘）。用法：import { IconXxxOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'，props 传 size。悬停显示导出名。</p>
<div class="grid">
${cells}
</div>
</body>
</html>`

mkdirSync(join(root, 'docs'), { recursive: true })
writeFileSync(join(root, 'docs', 'icons-preview.html'), html, 'utf-8')
console.log('预览页 → docs/icons-preview.html')
