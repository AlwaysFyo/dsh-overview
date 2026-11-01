// SSE 端到端验证：先建立监听，再触发文件变更，收集 change 事件
import { spawn } from 'node:child_process'
import { copyFileSync, readdirSync, unlinkSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir, tmpdir } from 'node:os'

const BASE = 'http://127.0.0.1:3099'
let buf = ''
const curl = spawn('curl', ['-s', '-N', '--max-time', '6', `${BASE}/dsh-overview/events`])
curl.stdout.on('data', (d) => (buf += d))
curl.stderr.on('data', (d) => (buf += d))

setTimeout(() => {
  const src = join(homedir(), '.dsh/storages/session_projcache/sessions')
  const t = join(src, '__wb_sse_e2e.json')
  copyFileSync(join(src, readdirSync(src)[0]), t)
  setTimeout(() => {
    try { unlinkSync(t) } catch {}
  }, 600)
}, 1500)

setTimeout(() => {
  curl.kill()
  console.log('--- SSE 收到的内容 ---')
  console.log(buf || '(空)')
  console.log('change 事件:', buf.includes('event: change') ? '✓ 收到' : '✗ 未收到')
  process.exit(0)
}, 6500)
