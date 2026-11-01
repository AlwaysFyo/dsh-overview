// 第四轮：projcache 结构 + 插件加载方式（只读调研）
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const dsh = join(homedir(), '.dsh');

// 1. session_projcache（非归档）结构
const pc = join(dsh, 'storages', 'session_projcache');
console.log('=== session_projcache:', readdirSync(pc).slice(0, 10));
for (const name of readdirSync(pc)) {
  const p = join(pc, name);
  if (statSync(p).isDirectory()) {
    const inner = readdirSync(p);
    console.log(`  ${name}/ (${inner.length} 项):`, inner.slice(0, 4));
    const f = inner.find(x => x.endsWith('.json'));
    if (f) {
      try {
        const o = JSON.parse(readFileSync(join(p, f), 'utf-8'));
        console.log('    顶层 keys:', Object.keys(o));
        console.log('    预览:', JSON.stringify(o).slice(0, 500));
      } catch (e) { console.log('    解析失败:', e.message); }
    }
    break; // 只看第一个目录
  }
}

// 2. profiles 里插件如何注册
const profiles = join(dsh, 'profiles');
for (const f of readdirSync(profiles)) {
  const p = join(profiles, f);
  if (statSync(p).isFile() && f.endsWith('.json')) {
    const c = readFileSync(p, 'utf-8');
    if (/plugin|dock|browser/i.test(c)) {
      console.log(`\n=== profiles/${f} (${c.length}B) 中含 plugin/dock 的片段:`);
      const lines = c.split('\n').filter(l => /plugin|dock|browser/i.test(l));
      console.log(lines.slice(0, 12).map(l => l.trim().slice(0, 200)).join('\n'));
    }
  }
}

// 3. dsh-market 目录
const market = join(dsh, 'dsh-market');
if (statSync(market).isDirectory()) {
  console.log('\n=== dsh-market:', readdirSync(market).slice(0, 10));
}
