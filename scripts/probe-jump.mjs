// 在 workspace/session 类型声明里找"打开指定会话"的能力
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

function scan(base, label) {
  console.log(`\n======== ${label} ========`)
  const typesDir = join(base, 'lib', 'types')
  let files = []
  try {
    files = readdirSync(typesDir, { recursive: true }).map((f) => join(typesDir, f)).filter((f) => f.endsWith('.d.ts'))
  } catch (e) { console.log('无 types:', e.message); return }
  for (const f of files) {
    const s = readFileSync(f, 'utf-8')
    for (const kw of ['openSession', 'selectSession', 'jumpToSession', 'switchSession', 'openSessionInWorkspace', 'setActiveSession', 'currentSession', 'activeSession']) {
      let i = -1
      while ((i = s.indexOf(kw, i + 1)) > -1) {
        console.log(`-- ${f.replace(base, '')} @ ${kw}`)
        console.log('   ' + s.slice(Math.max(0, i - 150), i + 250).replace(/\n/g, ' ').slice(0, 350))
      }
    }
  }
}

scan('D:/Projects/dsh-workbench/node_modules/@deepseek-ai/dsh-client-ui-workspace', 'dsh-client-ui-workspace')
scan('D:/Projects/dsh-workbench/node_modules/@deepseek-ai/dsh-session', 'dsh-session')
