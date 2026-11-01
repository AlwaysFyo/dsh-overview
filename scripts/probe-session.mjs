// 深挖会话文件内部结构 + workspace.json 完整字段（只读调研）
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';

const dsh = join(homedir(), '.dsh');

// 1. 所有工作区是否带 archivedSessionIds / pinnedSessionIds
const ws = JSON.parse(readFileSync(join(dsh, 'storages', 'workspace.json'), 'utf-8'));
const allKeys = new Set();
for (const w of Object.values(ws.tables.workspaces)) {
  Object.keys(w).forEach(k => allKeys.add(k));
  console.log('workspace:', w.title, '| sessions:', w.sessionIds?.length ?? 0,
    '| archived:', w.archivedSessionIds?.length ?? '-', '| pinned:', w.pinnedSessionIds?.length ?? '-');
}
console.log('workspace 条目全部字段:', [...allKeys].join(', '));

// 2. 解压一个会话文件看头部结构（python 3.14 自带 zstd）
const wsDir = join(dsh, 'sessions', '--D-agents-deepseek-harness-default-workspace--');
const sessId = readdirSync(wsDir).find(n => n.startsWith('session-'));
const zstPath = join(wsDir, sessId, 'session.v4.jsonl.zstd');
const py = `
import compression.zstd as zstd
with open(r'${zstPath.replace(/\\/g, '\\\\')}', 'rb') as f:
    data = zstd.ZstdDecompressor().decompress(f.read()).decode('utf-8', 'replace')
lines = data.splitlines()
print('total lines:', len(lines))
import json
for l in lines[:4]:
    try:
        o = json.loads(l)
        print('--', json.dumps(o, ensure_ascii=False)[:500])
    except Exception as e:
        print('-- unparsed:', l[:200])
# 最后 2 行看会话结束态
for l in lines[-2:]:
    print('tail--', l[:300])
`;
try {
  console.log('\n=== 会话文件内容（前 4 行 + 尾 2 行）===');
  console.log(execFileSync('python', ['-X', 'utf8', '-c', py], { encoding: 'utf-8', timeout: 30000 }).slice(0, 3000));
} catch (e) { console.log('zstd 解压失败:', String(e.stderr || e).slice(0, 300)); }

// 3. 归档缓存结构
const archSess = join(dsh, 'storages', 'session_projcache_archive_manager_v2', 'sessions');
const archList = readdirSync(archSess);
console.log('\n=== 归档缓存 sessions/:', archList.length, '项, 示例:', archList.slice(0, 3));
const a0 = join(archSess, archList[0]);
console.log('归档项内部:', readdirSync(a0).slice(0, 10));
