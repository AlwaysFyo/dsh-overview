import { readFileSync } from 'node:fs'
const s = readFileSync('D:/Projects/dsh-workbench/node_modules/@deepseek-ai/dsh-client-ui-primitives/lib/index.js', 'utf-8')
const blocks = [...s.matchAll(/const (Icon\w+OutlineArtwork) = /g)]
console.log('blocks:', blocks.length, '|', blocks.slice(0, 3).map((b) => b[1]).join(','))
const b0 = blocks.find((b) => b[1] === 'IconGaugeOutlineArtwork')
const block = s.slice(b0.index, b0.index + 3000)
const m = [...block.matchAll(/jsx\("(\w+)",\s*\{([^}]*)\}\)/g)]
console.log('jsx matches:', m.length)
const body = m[0][2]
console.log('body head:', JSON.stringify(body.slice(0, 100)))
const a = {}
for (const [k, v] of body.matchAll(/([A-Za-z_][\w-]*)\s*:\s*(?:"([^"]*)"|'([^']*)'|(\d+(?:\.\d+)?))/g)) a[k] = v
console.log('attrs keys:', Object.keys(a).join(','), '| d?', typeof a.d)
