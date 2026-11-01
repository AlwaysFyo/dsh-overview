// 第三轮：会话行的类型分布 / 标题来源 / 归档缓存内容（只读调研）
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';

const dsh = join(homedir(), '.dsh');
const sessRoot = join(dsh, 'sessions');

// 1. 找最近的 3 个会话（按 mtime），解压看行类型分布与字段
const all = [];
for (const ws of readdirSync(sessRoot)) {
  const wp = join(sessRoot, ws);
  for (const s of readdirSync(wp)) {
    const p = join(wp, s, 'session.v4.jsonl.zstd');
    if (statSync(p).isFile()) all.push({ ws, s, p, m: statSync(p).mtimeMs });
  }
}
all.sort((a, b) => b.m - a.m);
console.log('最近会话:', all.slice(0, 3).map(a => `${a.ws}/${a.s}`).join('\n         '));

const py = `
import compression.zstd as zstd, json, collections
for p in [${all.slice(0, 2).map(a => 'r\'' + a.p.replace(/\\\\/g, '\\\\\\\\') + '\'').join(', ')}]:
    data = zstd.ZstdDecompressor().decompress(open(p, 'rb').read()).decode('utf-8', 'replace')
    lines = data.splitlines()
    types = collections.Counter(json.loads(l).get('type') for l in lines if l.strip())
    print('==', p.split(chr(92))[-3], 'lines:', len(lines), 'types:', dict(types))
    # 打印第一行 session 头的全部字段，和一条 message 行的字段名
    head = json.loads(lines[0])
    print('   head keys:', list(head.keys()))
    for l in lines:
        o = json.loads(l)
        if o.get('type') not in ('session',):
            print('   first non-session:', json.dumps(o, ensure_ascii=False)[:400]); break
    # 找 title
    for l in lines:
        if 'title' in l: print('   title hit:', l[:300]); break
`;
console.log(execFileSync('python', ['-X', 'utf8', '-c', py], { encoding: 'utf-8', timeout: 60000, maxBuffer: 1 << 24 }));

// 2. 归档缓存单个 JSON 的结构
const archSess = join(dsh, 'storages', 'session_projcache_archive_manager_v2', 'sessions');
const a0 = join(archSess, readdirSync(archSess)[0]);
const c = readFileSync(a0, 'utf-8');
console.log('\n=== 归档缓存文件大小:', c.length, 'B');
try {
  const o = JSON.parse(c);
  console.log('顶层 keys:', Object.keys(o));
  console.log('内容预览:', JSON.stringify(o, null, 1).slice(0, 800));
} catch { console.log('非明文 JSON，前 120 字节:', Buffer.from(c.slice(0, 120)).toString('hex')); }
