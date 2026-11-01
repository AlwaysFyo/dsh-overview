// 探查 DSH 存储结构（只读，开发期调研用）
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const home = homedir();
const dsh = join(home, '.dsh');

// 1. workspace.json
const wsRaw = JSON.parse(readFileSync(join(dsh, 'storages', 'workspace.json'), 'utf-8'));
console.log('=== workspace.json 顶层 keys:', Object.keys(wsRaw));
console.log('tables keys:', Object.keys(wsRaw.tables ?? {}));
for (const [k, v] of Object.entries(wsRaw.tables ?? {})) {
  console.log(`- table[${k}]:`, Array.isArray(v) ? `array(${v.length})` : typeof v);
  const sample = Array.isArray(v) ? v[0] : (v ? Object.values(v)[0] : null);
  if (sample) console.log('  sample:', JSON.stringify(sample, null, 1).slice(0, 1200));
}

// 2. sessions 目录布局
const sessRoot = join(dsh, 'sessions');
console.log('\n=== sessions/ 工作区目录:', readdirSync(sessRoot).length, '个');
for (const name of readdirSync(sessRoot).slice(0, 2)) {
  const p = join(sessRoot, name);
  console.log('\n--', JSON.stringify(name), statSync(p).isDirectory() ? 'DIR' : 'FILE');
  if (statSync(p).isDirectory()) {
    const entries = readdirSync(p);
    console.log('  子项:', entries.slice(0, 5));
    for (const e of entries.slice(0, 1)) {
      const sp = join(p, e);
      if (statSync(sp).isDirectory()) {
        console.log('  会话目录内:', readdirSync(sp).slice(0, 15));
        // 看看元数据文件内容
        for (const f of readdirSync(sp)) {
          if (f.endsWith('.json') && !f.includes('messages') && !f.includes('events')) {
            try {
              const c = readFileSync(join(sp, f), 'utf-8');
              console.log(`  -- ${f} (${c.length}B):`, c.slice(0, 600));
            } catch {}
          }
        }
      } else {
        const c = readFileSync(sp, 'utf-8');
        console.log(`  -- 文件 ${e} (${c.length}B):`, c.slice(0, 600));
      }
    }
  }
}

// 3. 归档缓存
const arch = join(dsh, 'storages', 'session_projcache_archive_manager_v2');
if (existsSync(arch)) {
  console.log('\n=== session_projcache_archive_manager_v2:', statSync(arch).isDirectory() ? readdirSync(arch).slice(0, 8) : '单文件');
}

// 4. usage 文件
for (const f of ['.dshw-usage.json']) {
  const p = join(dsh, f);
  if (existsSync(p)) {
    const c = readFileSync(p, 'utf-8');
    console.log(`\n=== ${f} (${c.length}B):`, c.slice(0, 500));
  }
}
