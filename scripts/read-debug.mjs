import { readFileSync } from 'node:fs'
const d = JSON.parse(readFileSync(process.argv[2] ?? process.env.TEMP + '/wb-svc2.json', 'utf-8'))
console.log('条数:', d.length)
for (const e of d) {
  if (e.dbg) console.log('--', e.dbg.slice(0, 800))
  else if (e.probe) console.log('probe:', e.probe, '=>', JSON.stringify(e.result ?? e.error)?.slice(0, 120))
  else if (e.sample) console.log('sample:', e.sample, '=>', String(e.value ?? e.error)?.slice(0, 120))
}
