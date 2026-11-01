// 深挖 projcache 与 session 的映射关系 + rows 里的宝藏字段
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const dsh = join(homedir(), '.dsh');
const pcDir = join(dsh, 'storages', 'session_projcache', 'sessions');
const files = readdirSync(pcDir);

// 1. sessionListMetadata 长什么样
const rec = JSON.parse(readFileSync(join(pcDir, files[0]), 'utf-8'));
console.log('== sessionListMetadata:', JSON.stringify(rec.record.rows.sessionListMetadata, null, 1).slice(0, 600));
console.log('\n== identity:', JSON.stringify(rec.record.identity));

// 2. tokenUsage / sessionStats / todos / turnBoundary 预览
for (const k of ['tokenUsage', 'sessionStats', 'todos', 'turnBoundary']) {
  console.log(`\n== rows.${k}:`, JSON.stringify(rec.record.rows[k]).slice(0, 400));
}

// 3. 对所有 projcache 记录，看 identity.createdAt / sessionListMetadata 是否含 id
let withMetaId = 0, sample = null;
for (const f of files) {
  try {
    const r = JSON.parse(readFileSync(join(pcDir, f), 'utf-8')).record;
    const meta = r.rows?.sessionListMetadata;
    const metaStr = JSON.stringify(meta ?? {});
    if (/session-|id/i.test(metaStr)) {
      withMetaId++;
      if (!sample) sample = { f, meta: metaStr.slice(0, 300) };
    }
  } catch {}
}
console.log(`\n== sessionListMetadata 含 id 的文件: ${withMetaId}/${files.length}`);
if (sample) console.log('样例:', sample.f, sample.meta);

// 4. sessions 目录里的会话头 createdAt + cwd，与 projcache identity 对比能否对上
// （仅统计数量级：多少 projcache 记录的 identity.createdAt 出现在某个会话头里）
const zlib = await import('node:zlib');
const sessRoot = join(dsh, 'sessions');
const headers = [];
for (const wsDir of readdirSync(sessRoot)) {
  const wp = join(sessRoot, wsDir);
  for (const s of readdirSync(wp)) {
    const p = join(wp, s, 'session.v4.jsonl.zstd');
    try {
      const first = zlib.zstdDecompressSync(readFileSync(p)).toString('utf-8').split('\n')[0];
      const h = JSON.parse(first);
      headers.push({ id: h.id, createdAt: h.createdAt, cwd: h.cwd });
    } catch {}
  }
}
console.log('\n== sessions 目录会话数:', headers.length);
const pcKeys = new Set();
for (const f of files) {
  try { pcKeys.add(String(JSON.parse(readFileSync(join(pcDir, f), 'utf-8')).record.identity.createdAt)); } catch {}
}
const hit = headers.filter(h => pcKeys.has(String(h.createdAt))).length;
console.log('会话头 createdAt 命中 projcache identity.createdAt:', hit, '/', headers.length);
