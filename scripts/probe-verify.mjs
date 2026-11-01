// 开工前验证：projcache record 完整字段 / Node 24 直跑 TS / zstd 同步 API 可用
import { readFileSync, readdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { zstdCompressSync, zstdDecompressSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';

const dsh = join(homedir(), '.dsh');

// 1. projcache record 顶层字段（有没有 sessionId）
const pcDir = join(dsh, 'storages', 'session_projcache', 'sessions');
const files = readdirSync(pcDir);
console.log('projcache 文件数:', files.length);
const rec = JSON.parse(readFileSync(join(pcDir, files[0]), 'utf-8'));
console.log('record keys:', Object.keys(rec.record));
console.log('sessionId:', rec.record.sessionId ?? '(无)');
console.log('rows keys:', Object.keys(rec.record.rows));

// 2. workspace 的 sessionIds 与 projcache 文件名对得上吗
const ws = JSON.parse(readFileSync(join(dsh, 'storages', 'workspace.json'), 'utf-8'));
const pcIds = new Set(files.map(f => f.replace(/\.json$/, '')));
const wsIds = Object.values(ws.tables.workspaces).flatMap(w => w.sessionIds).map(id => id.replace(/^session-/, ''));
const hit = wsIds.filter(id => pcIds.has(id)).length;
console.log(`workspace sessionIds: ${wsIds.length}, projcache 命中: ${hit}`);

// 3. zstd 同步 + Node 直跑 TS
const dir = mkdtempSync(join(tmpdir(), 'dshwb-'));
const tsFile = join(dir, 'hello.ts');
writeFileSync(tsFile, "const n: number = 42; console.log('TS ok', n, zstdDecompressSync(zstdCompressSync(Buffer.from('x'))).toString());\n");
const out = execFileSync(process.execPath, [tsFile], { encoding: 'utf-8' });
console.log('node 直跑 .ts:', out.trim());
