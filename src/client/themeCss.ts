// 单一来源：client half 与 Vite dev 沙盒共用（由 theme.css 迁移）
export const themeCss = `/* dsh-workbench 设计 tokens 与组件样式
   移植自 docs/dsh-workbench-ui.html 原型（克制工业实用风）。
   宿主内嵌时，:root 段替换为 --dsw-alias-* 变量映射。 */

:root {
  --wb-bg: #f4f3ef;
  --wb-surface: #fbfaf8;
  --wb-surface-2: #eceae3;
  --wb-ink: #2b2a26;
  --wb-ink-2: #6d6a60;
  --wb-ink-3: #98948a;
  --wb-line: rgba(43, 42, 38, 0.13);
  --wb-line-strong: rgba(43, 42, 38, 0.3);
  --wb-accent: #3a56c5;
  --wb-accent-ink: #ffffff;
  --wb-accent-bg: #e9edfb;
  --wb-accent-line: rgba(58, 86, 197, 0.45);
  --wb-amber: #96690f;
  --wb-amber-bg: #f6ecd5;
  --wb-ok: #4a7c2e;
  --wb-danger: #a83832;
  --wb-radius: 10px;
  --wb-radius-sm: 7px;
  --wb-ease: cubic-bezier(0.16, 1, 0.3, 1);
}
[data-theme='dark'] {
  --wb-bg: #181815;
  --wb-surface: #212120;
  --wb-surface-2: #2b2b28;
  --wb-ink: #e9e7df;
  --wb-ink-2: #a5a299;
  --wb-ink-3: #75726a;
  --wb-line: rgba(233, 231, 223, 0.13);
  --wb-line-strong: rgba(233, 231, 223, 0.32);
  --wb-accent: #93a9f0;
  --wb-accent-ink: #16204a;
  --wb-accent-bg: #20294a;
  --wb-accent-line: rgba(147, 169, 240, 0.5);
  --wb-amber: #e0a83f;
  --wb-amber-bg: #382e12;
  --wb-ok: #97c459;
  --wb-danger: #ef9a94;
}

.wb-root {
  width: 100%;
  min-height: 100%;
  padding: 0 22px 44px;
  box-sizing: border-box;
  background: var(--wb-bg);
  color: var(--wb-ink);
  font-family: 'Segoe UI', 'Microsoft YaHei UI', 'PingFang SC', sans-serif;
  font-size: 13px;
  line-height: 1.6;
  
  -webkit-font-smoothing: antialiased;
}
.wb-root .mono { font-family: 'Cascadia Code', 'JetBrains Mono', Consolas, monospace; font-size: 11.5px; }
.wb-root .num { font-variant-numeric: tabular-nums; }
.wb-root button { font-family: inherit; }
.wb-root mark { background: var(--wb-amber-bg); color: var(--wb-amber); border-radius: 3px; padding: 0 2px; }
.wb-root .hidden { display: none !important; }

/* ===== 顶栏 ===== */
.wb-topbar {
  position: sticky; top: 0; z-index: 20; background: var(--wb-bg);
  display: flex; align-items: center; gap: 14px; padding: 14px 0 12px;
  border-bottom: 1px solid var(--wb-line);
}
.wb-brand { display: flex; align-items: center; gap: 9px; font-weight: 600; font-size: 14px; letter-spacing: 0.2px; }
.wb-brand-mark { width: 18px; height: 18px; border-radius: 5px; background: var(--wb-accent); display: grid; place-items: center; flex-shrink: 0; }
.wb-brand-mark i { width: 7px; height: 7px; border-radius: 2px; background: var(--wb-accent-ink); display: block; }
.wb-search { flex: 1; max-width: 380px; position: relative; }
.wb-search input {
  width: 100%; padding: 7px 12px 7px 32px; font-size: 13px; color: var(--wb-ink);
  background: var(--wb-surface); border: 1px solid var(--wb-line); border-radius: var(--wb-radius-sm);
  transition: border-color 160ms var(--wb-ease), box-shadow 160ms var(--wb-ease);
}
.wb-search input::placeholder { color: var(--wb-ink-3); }
.wb-search input:focus { outline: none; border-color: var(--wb-accent); box-shadow: 0 0 0 3px var(--wb-accent-bg); }
.wb-search > svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; stroke: var(--wb-ink-3); fill: none; stroke-width: 1.8; }
.wb-pill { font-size: 12px; border-radius: 999px; padding: 3px 11px; white-space: nowrap; }
.wb-pill-run { color: var(--wb-accent); background: var(--wb-accent-bg); }
.wb-pill-todo { color: var(--wb-amber); background: var(--wb-amber-bg); }
.wb-ghost-btn {
  padding: 6px 13px; font-size: 12.5px; color: var(--wb-ink-2); background: transparent;
  border: 1px solid var(--wb-line); border-radius: var(--wb-radius-sm); cursor: pointer;
  transition: all 160ms var(--wb-ease); text-decoration: none;
}
.wb-ghost-btn:hover { color: var(--wb-ink); border-color: var(--wb-line-strong); }
.wb-ghost-btn:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }

/* 会话行图标操作（hover 显示） */
.wb-sact { display: none; align-items: center; gap: 2px; margin-left: auto; }
.wb-srow:hover .wb-sact, .wb-srow:focus-within .wb-sact { display: inline-flex; }
.wb-srow:hover .go { display: none; }
.wb-srow:hover .m { margin-left: 0; }
.wb-sact-btn { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; cursor: pointer; color: var(--wb-ink-2); }
.wb-sact-btn:hover { background: var(--wb-surface-2); color: var(--wb-ink); }
.wb-sact-btn.wb-danger:hover { color: var(--wb-danger); }

/* 搜索下拉（R4-lite） */
.wb-search-pop {
  position: absolute; top: 36px; left: 0; right: 0; z-index: 30;
  background: var(--wb-surface); border: 1px solid var(--wb-line); border-radius: var(--wb-radius);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.16); overflow: hidden;
}
.wb-search-pop .sr {
  display: block; width: 100%; text-align: left; padding: 8px 12px; border: 0; background: none;
  font: inherit; font-size: 12.5px; color: var(--wb-ink); cursor: pointer;
}
.wb-search-pop .sr:hover { background: var(--wb-surface-2); }
.wb-search-pop .sr .p { font-size: 11px; color: var(--wb-ink-3); }
.wb-search-pop .none { padding: 14px; text-align: center; color: var(--wb-ink-3); font-size: 12px; }

/* ===== L1 ===== */
.wb-segbar { display: flex; align-items: center; gap: 12px; margin: 22px 0 18px; }
.wb-seg { display: inline-flex; gap: 2px; background: var(--wb-surface-2); border-radius: 9px; padding: 3px; }
.wb-seg button {
  border: none; background: transparent; color: var(--wb-ink-2); font-size: 12.5px;
  padding: 5px 15px; border-radius: 6px; cursor: pointer; transition: all 160ms var(--wb-ease);
}
.wb-seg button:hover { color: var(--wb-ink); }
.wb-seg button[aria-selected='true'] { background: var(--wb-surface); color: var(--wb-ink); font-weight: 600; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.07); }
.wb-seg button:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 1px; }
.wb-seg .cnt { opacity: 0.6; margin-left: 4px; }
.wb-sort-hint { margin-left: auto; font-size: 12px; color: var(--wb-ink-3); }

.wb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 14px; }
.wb-card {
  background: var(--wb-surface); border: 1px solid var(--wb-line); border-radius: var(--wb-radius);
  padding: 14px 16px 13px; cursor: pointer; position: relative; text-align: left; width: 100%;
  font: inherit; color: inherit;
  transition: border-color 160ms var(--wb-ease), transform 160ms var(--wb-ease), background 160ms var(--wb-ease);
}
.wb-card:hover { border-color: var(--wb-line-strong); transform: translateY(-1px); }
.wb-card:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }
.wb-card.is-running { border-color: var(--wb-accent-line); }
.wb-card.is-running::before {
  content: ''; position: absolute; left: -1px; top: 12px; bottom: 12px;
  width: 3px; border-radius: 0 3px 3px 0; background: var(--wb-accent);
}
.wb-card.is-archived { border-style: dashed; background: transparent; }
.wb-card.is-dead { opacity: 0.55; }
.wb-card-top { display: flex; align-items: center; gap: 8px; }
.wb-card-name { font-weight: 600; font-size: 13.5px; }
.wb-card-state { margin-left: auto; font-size: 11.5px; color: var(--wb-ink-3); }
.wb-card.is-running .wb-card-state { color: var(--wb-accent); font-weight: 600; }
.wb-card-path { margin: 3px 0 11px; color: var(--wb-ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wb-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 11px; }
.wb-stat { background: var(--wb-surface-2); border-radius: var(--wb-radius-sm); padding: 7px 4px 6px; text-align: center; }
.wb-stat b { display: block; font-size: 16px; font-weight: 600; line-height: 1.2; }
.wb-stat b.hot { color: var(--wb-amber); }
.wb-stat span { font-size: 11px; color: var(--wb-ink-3); }
.wb-card-foot { display: flex; align-items: baseline; gap: 8px; font-size: 12px; color: var(--wb-ink-2); border-top: 1px solid var(--wb-line); padding-top: 9px; }
.wb-card-foot .t { margin-left: auto; color: var(--wb-ink-3); white-space: nowrap; }
.wb-card-foot em { font-style: normal; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wb-mini-btn {
  font-size: 11.5px; padding: 3px 10px; border-radius: 6px; cursor: pointer;
  color: var(--wb-ink-2); background: var(--wb-surface-2); border: 1px solid var(--wb-line);
  transition: all 160ms var(--wb-ease);
}
.wb-mini-btn:hover { color: var(--wb-ink); border-color: var(--wb-line-strong); }
.wb-card-actions { margin-top: 10px; display: flex; gap: 8px; }

/* 状态点：蓝=运行 · 灰=空闲 · 空心=归档 */
.wb-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
.wb-dot-run { background: var(--wb-accent); box-shadow: 0 0 0 3px var(--wb-accent-bg); }
.wb-dot-idle { background: var(--wb-ink-3); }
.wb-dot-off { background: transparent; border: 1.5px solid var(--wb-ink-3); }

.wb-empty-state { padding: 64px 0; text-align: center; color: var(--wb-ink-3); }
.wb-empty-state h2 { font-size: 16px; color: var(--wb-ink-2); margin: 0 0 8px; }
.wb-empty-state p { margin: 0 0 16px; font-size: 12.5px; }

/* ===== L2 ===== */
.wb-crumbs { display: flex; align-items: center; gap: 10px; margin: 22px 0 6px; font-size: 12.5px; }
.wb-back { color: var(--wb-ink-2); cursor: pointer; background: none; border: none; font-size: 12.5px; padding: 2px 0; transition: color 160ms var(--wb-ease); }
.wb-back:hover { color: var(--wb-accent); }
.wb-crumbs .sep { color: var(--wb-ink-3); }
.wb-proj-switch {
  font-size: 12.5px; color: var(--wb-ink); background: var(--wb-surface);
  border: 1px solid var(--wb-line); border-radius: var(--wb-radius-sm); padding: 4px 8px; cursor: pointer;
}
.wb-proj-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 4px; }
.wb-proj-head h1 { font-size: 20px; margin: 0; font-weight: 600; }
.wb-proj-path { color: var(--wb-ink-3); }
.wb-dead-banner {
  border-left: 3px solid var(--wb-danger); background: var(--wb-surface);
  border-radius: 0 8px 8px 0; padding: 8px 12px; margin: 10px 0; font-size: 12.5px; color: var(--wb-ink-2);
}
.wb-mstrip {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; margin: 16px 0 20px;
  background: var(--wb-surface); border: 1px solid var(--wb-line); border-radius: var(--wb-radius); overflow: hidden;
}
.wb-mcell { padding: 13px 18px; border-right: 1px solid var(--wb-line); }
.wb-mcell:last-child { border-right: none; }
.wb-mcell .lbl { font-size: 11.5px; color: var(--wb-ink-3); margin-bottom: 1px; }
.wb-mcell .val { font-size: 23px; font-weight: 600; line-height: 1.25; }
.wb-mcell .sub { font-size: 11.5px; color: var(--wb-ink-3); }
.wb-mcell .val.hot { color: var(--wb-amber); }
.wb-cols { display: grid; grid-template-columns: minmax(0, 1fr) 264px; gap: 22px; align-items: start; }
@media (max-width: 860px) { .wb-cols { grid-template-columns: 1fr; } .wb-mstrip { grid-template-columns: repeat(2, 1fr); } }
.wb-tabs { display: flex; gap: 20px; border-bottom: 1px solid var(--wb-line); margin-bottom: 4px; }
.wb-tab {
  background: none; border: none; font-size: 13px; color: var(--wb-ink-2);
  padding: 8px 2px 9px; cursor: pointer; position: relative; transition: color 160ms var(--wb-ease);
}
.wb-tab .cnt { font-size: 11.5px; color: var(--wb-ink-3); margin-left: 3px; }
.wb-tab:hover { color: var(--wb-ink); }
.wb-tab[aria-selected='true'] { color: var(--wb-ink); font-weight: 600; }
.wb-tab[aria-selected='true']::after {
  content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--wb-accent);
}
.wb-srow {
  display: flex; align-items: center; gap: 10px; padding: 11px 6px; width: 100%;
  border: none; border-bottom: 1px solid var(--wb-line); background: none; text-align: left;
  font: inherit; color: inherit; cursor: pointer; transition: background 160ms var(--wb-ease);
}
.wb-srow:hover { background: var(--wb-surface); }
.wb-srow .t { font-weight: 500; }
.wb-srow .m { color: var(--wb-ink-3); font-size: 11.5px; margin-left: auto; white-space: nowrap; }
.wb-srow .go { opacity: 0; font-size: 11.5px; color: var(--wb-accent); white-space: nowrap; transition: opacity 160ms var(--wb-ease); }
.wb-srow:hover .go { opacity: 1; }
.wb-side-card { background: var(--wb-surface); border: 1px solid var(--wb-line); border-radius: var(--wb-radius); padding: 13px 15px; margin-bottom: 14px; }
.wb-side-card h3 { margin: 0 0 9px; font-size: 12px; font-weight: 600; color: var(--wb-ink-2); letter-spacing: 0.3px; }
.wb-feed { font-size: 12.5px; }
.wb-feed .f { display: flex; gap: 9px; padding: 4px 0; color: var(--wb-ink-2); }
.wb-feed .f::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: var(--wb-line-strong); margin-top: 7px; flex-shrink: 0; }
.wb-feed .f:first-child::before { background: var(--wb-accent); }
.wb-feed .f .w { margin-left: auto; color: var(--wb-ink-3); font-size: 11px; white-space: nowrap; }
.wb-side-empty { color: var(--wb-ink-3); font-size: 12px; padding: 4px 0; }
`
