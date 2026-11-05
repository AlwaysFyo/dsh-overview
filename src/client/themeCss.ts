// 单一来源：client half 与 Vite dev 沙盒共用（由 theme.css 迁移）
export const themeCss = `/* dsh-overview 设计 tokens 与组件样式
   v0.1.22：Base 主页式工作台主题（白底 + 紫 accent，实测自 my.feishu.cn/base）。
   宿主内嵌时，:root 段替换为 --dsw-alias-* 变量映射。 */

:root {
  --wb-bg: #ffffff;
  --wb-surface: #ffffff;
  --wb-surface-2: #f5f6f7;
  --wb-ink: #1f2329;
  --wb-ink-2: #545a64; /* 6.95:1 on #fff */
  --wb-ink-3: #6a7078; /* 5.00:1 on #fff / 4.62:1 on surface-2（原 #8f959e 只有 3.02/2.79） */
  --wb-line: #e5e6eb;
  --wb-line-strong: #c9cdd4;
  --wb-card-line: #dee0e3;
  --wb-accent: #8046f3; /* 5.14:1 on #fff */
  --wb-accent-deep: #6d35e0; /* 5.58:1 on accent-bg —— accent 叠 accent-bg 只有 4.42，淡化场景一律用 deep */
  --wb-accent-ink: #ffffff;
  --wb-accent-bg: #f1ebfe;
  --wb-accent-line: rgba(128, 70, 243, 0.45);
  --wb-blue: #1a67d6; /* 5.31:1 on #fff / 4.67:1 on blue-bg（原 #3586ff 只有 3.50/3.07） */
  --wb-blue-bg: #e8f1ff;
  --wb-amber: #a45600; /* 5.37:1 on #fff / 4.93:1 on amber-bg */
  --wb-amber-bg: #fff4e0;
  --wb-danger: #c62c25; /* 5.54:1 on #fff / 4.85:1 on danger-bg */
  --wb-danger-bg: #fdecec;
  /* 圆角只保留 6 档：xs 标记/chip · sm 小控件 · md 输入/按钮 · radius 卡片 · lg 大容器 · pill 胶囊 */
  --wb-radius-xs: 4px;
  --wb-radius-sm: 6px;
  --wb-radius-md: 8px;
  --wb-radius: 12px;
  --wb-radius-lg: 14px;
  --wb-radius-pill: 999px;
  /* 阴影只保留 4 档，避免每处 rgba 各写一遍 */
  --wb-shadow-1: 0 1px 2px rgba(23, 26, 31, 0.07);
  --wb-shadow-2: 0 3px 12px rgba(23, 26, 31, 0.08);
  --wb-shadow-3: 0 10px 28px rgba(23, 26, 31, 0.16);
  --wb-shadow-accent: 0 1px 6px rgba(128, 70, 243, 0.12);
  --wb-shadow-drawer: -18px 0 40px rgba(23, 26, 31, 0.22);
  --wb-ease: cubic-bezier(0.16, 1, 0.3, 1);
}
/* 深色 token。挂在 .wb-root 自身的 data-wb-theme 上（宿主内不再改写 documentElement），
   同时保留 [data-theme='dark'] .wb-root 兼容 Vite 沙盒与静态预览页 */
.wb-root[data-wb-theme='dark'],
[data-theme='dark'] .wb-root {
  --wb-bg: #1b1c1f;
  --wb-surface: #242528;
  --wb-surface-2: #2a2b30;
  --wb-ink: #e8eaed;
  --wb-ink-2: #b7bcc6;
  --wb-ink-3: #9099a3; /* 5.90:1 on bg / 4.89:1 on surface-2（原 #767c86 只有 4.05/3.36） */
  --wb-line: #333539;
  --wb-line-strong: #42464c;
  --wb-card-line: #3a3c41;
  --wb-accent: #a688ff;
  --wb-accent-deep: #b99cff;
  --wb-accent-ink: #14101f;
  --wb-accent-bg: #2e2a3d;
  --wb-accent-line: rgba(166, 136, 255, 0.4);
  --wb-blue: #5aa9ff;
  --wb-blue-bg: #1e2a3d;
  --wb-amber: #e8a33d;
  --wb-amber-bg: #35290f;
  --wb-danger: #ff7a72;
  --wb-danger-bg: #3a2220;
  --wb-shadow-1: 0 1px 2px rgba(0, 0, 0, 0.4);
  --wb-shadow-2: 0 3px 12px rgba(0, 0, 0, 0.45);
  --wb-shadow-3: 0 10px 28px rgba(0, 0, 0, 0.6);
  --wb-shadow-accent: 0 1px 6px rgba(166, 136, 255, 0.2);
  --wb-shadow-drawer: -18px 0 40px rgba(0, 0, 0, 0.5);
}

.wb-root {
  width: 100%;
  /* 100vh 而不是 100%：dev 沙盒与宿主插槽的父级高度口径不同，
     100% 会在父级高度未约束时塌成内容高——深色主题只盖住上半屏就是这么来的。
     宿主插槽内由下面的 [data-dsh-overview] 覆盖成 100%，避免与插槽自身的滚动容器叠加出双层滚动 */
  min-height: 100vh;
  box-sizing: border-box;
  background: var(--wb-bg);
  color: var(--wb-ink);
  font-family: 'Segoe UI', 'Microsoft YaHei UI', 'PingFang SC', sans-serif;
  font-size: 13px;
  line-height: 1.6;

  -webkit-font-smoothing: antialiased;
}
/* 宿主渲染层外层是 height:100%;overflow:auto（见 plugin.tsx），这里回落成 100% 而不是再叠 100vh */
[data-dsh-overview] > .wb-root { min-height: 100%; }
/* 组件内统一 border-box：原来只有 .wb-root 自己设了，子元素的 padding 会额外撑宽
   （.wb-srow 是 width:100% + 左右各 6px 内边距，把整行撑出容器 12px） */
.wb-root,
.wb-root *,
.wb-root *::before,
.wb-root *::after { box-sizing: border-box; }
.wb-root .mono { font-family: 'Cascadia Code', 'JetBrains Mono', Consolas, monospace; font-size: 11.5px; }
.wb-root .num { font-variant-numeric: tabular-nums; }
.wb-root button { font-family: inherit; font-size: inherit; line-height: inherit; }
.wb-root mark { background: var(--wb-amber-bg); color: var(--wb-amber); border-radius: var(--wb-radius-xs); padding: 0 2px; }
.wb-root .hidden { display: none !important; }

/* ===== 顶栏 ===== */
/* 通栏 sticky：背景与底线铺到屏幕边缘，内容自带 24px 页边距（与内容区对齐） */
/* 通栏 sticky：背景与底线铺到屏幕边缘；内容由 .wb-topbar-inner 收进与 .wb-main 同宽的居中容器，
   这样 1920 / 2560 屏上顶栏品牌与内容左缘仍然对齐（此前顶栏只有固定 24px 内边距，会错开 (vw−1680)/2） */
.wb-topbar {
  position: sticky; top: 0; z-index: 20; background: var(--wb-bg);
  border-bottom: 1px solid var(--wb-line);
}
.wb-topbar-inner {
  max-width: 1680px; margin: 0 auto; width: 100%; box-sizing: border-box;
  display: flex; align-items: center; gap: 12px; padding: 11px 24px 10px;
}
.wb-brand { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; letter-spacing: 0.2px; margin-right: 4px; }
.wb-brand-mark { width: 20px; height: 20px; border-radius: var(--wb-radius-sm); background: linear-gradient(135deg, #8046f3, #a05cf8); display: grid; place-items: center; flex-shrink: 0; }
.wb-brand-mark i { width: 7px; height: 7px; border-radius: 2px; background: #fff; display: block; }

/* 顶栏搜索：定宽 230，聚焦展开到 320（R4 搜索弹层挂在同一容器内）。
   flex-shrink 交给窄屏：原来 flex-shrink:0 + 无 min-width:0，窄视口只能靠顶栏溢出 */
.wb-search { position: relative; width: 230px; min-width: 0; transition: width 160ms var(--wb-ease); }
.wb-search:focus-within { width: 320px; }
.wb-search input {
  width: 100%; height: 31px; padding: 0 34px 0 30px; font-size: 13px; color: var(--wb-ink);
  background: var(--wb-surface-2); border: 1px solid transparent; border-radius: var(--wb-radius-md);
  transition: background 160ms var(--wb-ease), border-color 160ms var(--wb-ease), box-shadow 160ms var(--wb-ease);
}
.wb-search input::placeholder { color: var(--wb-ink-3); }
.wb-search input:focus {
  outline: none; background: var(--wb-surface); border-color: var(--wb-accent);
  box-shadow: var(--wb-shadow-accent);
}
.wb-search > svg { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; stroke: var(--wb-ink-3); fill: none; stroke-width: 1.8; pointer-events: none; }
.wb-search .wb-kbd { position: absolute; right: 7px; top: 50%; transform: translateY(-50%); pointer-events: none; transition: opacity 120ms ease; }
.wb-search:focus-within .wb-kbd { opacity: 0; }
.wb-kbd {
  font-family: 'Cascadia Code', Consolas, ui-monospace, monospace; font-size: 11.5px; line-height: 16px;
  color: var(--wb-ink-3); border: 1px solid var(--wb-line); border-radius: var(--wb-radius-xs); padding: 0 5px; background: var(--wb-surface);
}

.wb-iconbtn {
  width: 30px; height: 30px; display: grid; place-items: center; padding: 0;
  border: none; background: none; border-radius: var(--wb-radius-sm);
  color: var(--wb-ink-2); font-size: 15px; line-height: 1; cursor: pointer;
  transition: all 140ms var(--wb-ease);
}
.wb-iconbtn:hover { background: var(--wb-surface-2); color: var(--wb-ink); }
.wb-iconbtn:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }
.wb-newbtn {
  display: inline-flex; align-items: center; gap: 6px; height: 31px; padding: 0 13px;
  border: 1px solid var(--wb-card-line); border-radius: var(--wb-radius-md); font-size: 13px; font-weight: 500;
  background: var(--wb-surface); color: var(--wb-ink); cursor: pointer; flex-shrink: 0;
  transition: all 140ms var(--wb-ease);
}
.wb-newbtn:hover { border-color: var(--wb-line-strong); background: var(--wb-surface-2); }
.wb-newbtn:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }
.wb-newbtn svg { width: 14px; height: 14px; color: var(--wb-ink-2); }
.wb-top-actions { margin-left: auto; display: flex; align-items: center; gap: 10px; }
/* 数据新鲜度：只回答「停了多久」，精确时刻留给总览卡片 */
.wb-fresh { font-size: 12px; color: var(--wb-ink-3); white-space: nowrap; }
.wb-fresh b { font-weight: 500; color: var(--wb-ink-2); }

/* 提示条（琥珀软底）：新建入口限制、hero 降级说明等一次性反馈。
   统一由 .wb-notewrap 提供 24px 沟槽 + 1680 上限，App 顶层与 hero 内的提示条宽度因此一致 */
.wb-notewrap { max-width: 1680px; margin: 0 auto; padding: 10px 24px 0; width: 100%; box-sizing: border-box; }
.wb-notebar {
  display: flex; align-items: center; gap: 9px; margin: 0; padding: 9px 13px;
  border-radius: var(--wb-radius); background: var(--wb-amber-bg); color: var(--wb-ink); font-size: 12.5px;
}
.wb-notebar svg { flex-shrink: 0; color: var(--wb-amber); }
.wb-notebar[hidden] { display: none; }

.wb-ghost-btn {
  padding: 6px 13px; font-size: 12.5px; color: var(--wb-ink-2); background: transparent;
  border: 1px solid var(--wb-line); border-radius: var(--wb-radius-sm); cursor: pointer;
  transition: all 160ms var(--wb-ease); text-decoration: none;
}
.wb-ghost-btn:hover { color: var(--wb-ink); border-color: var(--wb-line-strong); }
.wb-ghost-btn:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }

/* 会话行操作：固定占位 24px，hover/聚焦只切换 opacity。
   原来是 display:none → inline-flex 突然插入 5 个 24px 按钮（128px），标题重新省略、meta 左跳，鼠标一走一回就抖；
   操作本身收进一个「⋯」菜单，行内只剩 1 个 Tab 站。右端 meta 用 margin-left:auto 顶到边上，这里不再抢 auto。 */
.wb-sact { position: relative; display: flex; align-items: center; justify-content: flex-end; width: 24px; flex-shrink: 0; }
.wb-sact-btn {
  display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 0;
  border: 0; background: none; border-radius: var(--wb-radius-sm); cursor: pointer; color: var(--wb-ink-2);
  opacity: 0; transition: opacity 120ms var(--wb-ease), background 120ms var(--wb-ease);
}
.wb-srow:hover .wb-sact-btn,
.wb-srow:focus-within .wb-sact-btn,
.wb-sact.is-open .wb-sact-btn,
.wb-sact-btn:focus-visible { opacity: 1; }
.wb-sact-btn:hover { background: var(--wb-surface-2); color: var(--wb-ink); }
.wb-sact-btn:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 1px; }
/* 点空白关闭菜单：整屏透明层压在菜单下面（39 < 40），既挡住误点行，又不用全局 mousedown 监听 */
.wb-sact-scrim { position: fixed; inset: 0; z-index: 39; }
/* 行内菜单：右下展开、右缘对齐（右端就是视口边） */
.wb-sact-menu {
  position: absolute; top: calc(100% + 4px); right: 0; z-index: 40; min-width: 150px; padding: 4px;
  background: var(--wb-surface); border: 1px solid var(--wb-line); border-radius: var(--wb-radius-md);
  box-shadow: var(--wb-shadow-3);
}
.wb-sact-menu button {
  display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; border: 0; background: none;
  border-radius: var(--wb-radius-sm); font: inherit; font-size: 12.5px; color: var(--wb-ink); text-align: left; cursor: pointer;
}
.wb-sact-menu button:hover { background: var(--wb-surface-2); }
.wb-sact-menu button svg { flex-shrink: 0; color: var(--wb-ink-2); }
.wb-sact-menu button.wb-danger { color: var(--wb-danger); }
.wb-sact-menu button.wb-danger svg { color: var(--wb-danger); }
/* 靠近视口底部时改成向上展开，免得菜单落到视口外还要滚动才看见 */
.wb-sact-menu.is-up { top: auto; bottom: calc(100% + 4px); }

/* 搜索下拉（R4：项目 / 会话 / 待办，按项目分组）。宽度不再跟随 230–320px 的输入框，
   否则长标题只能压成两行；右缘仍不超出视口 */
.wb-search-pop {
  position: absolute; top: 38px; left: 0; z-index: 30; width: min(420px, calc(100vw - 48px));
  background: var(--wb-surface); border: 1px solid var(--wb-line); border-radius: var(--wb-radius);
  box-shadow: var(--wb-shadow-3); overflow: hidden; max-height: 420px; overflow-y: auto;
}
.wb-search-group + .wb-search-group { border-top: 1px solid var(--wb-line); }
.wb-search-group .grp {
  padding: 6px 12px 4px; font-size: 11.5px; font-weight: 600; letter-spacing: 0.02em;
  color: var(--wb-ink-3); background: var(--wb-surface-2); position: sticky; top: 0;
}
.wb-search-pop .sr {
  display: block; width: 100%; text-align: left; padding: 8px 12px; border: 0; background: none;
  font: inherit; font-size: 12.5px; color: var(--wb-ink); cursor: pointer; overflow: hidden;
}
.wb-search-pop .sr:hover { background: var(--wb-surface-2); }
/* 标题与副行都在块级 div 里：单行省略要靠 nowrap + overflow，否则长标题会撑成两行把下拉顶长 */
.wb-search-pop .sr > div { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wb-search-pop .sr .p { font-size: 11.5px; color: var(--wb-ink-3); }
.wb-search-pop .sr mark { background: var(--wb-accent-bg); color: var(--wb-accent-deep); border-radius: var(--wb-radius-xs); padding: 0 1px; }
.wb-search-pop .none { padding: 14px; text-align: center; color: var(--wb-ink-3); font-size: 12px; }

/* ===== L1 · 主屏 ===== */
/* 内容区：满宽 + 24px 页边距（对齐飞书主页的页面留白），超宽屏给 1680px 上限防卡片拉太长 */
.wb-main {
  max-width: 1680px;
  margin: 0 auto;
  padding: 0 24px 44px;
  width: 100%;
  box-sizing: border-box;
}
/* hero：对话式输入框——选项目/模式 + 输任务 + 回车在所选项目开新会话（草稿注入） */
.wb-hero { padding: 30px 0 0; text-align: center; }
.wb-herobox {
  width: min(660px, 100%); margin: 0 auto; text-align: left;
  background: var(--wb-surface); border: 1px solid var(--wb-card-line); border-radius: var(--wb-radius-lg);
  padding: 9px 10px 8px; box-shadow: var(--wb-shadow-1);
  transition: border-color 140ms var(--wb-ease), box-shadow 140ms var(--wb-ease);
}
.wb-herobox:focus-within { border-color: var(--wb-accent); box-shadow: var(--wb-shadow-accent); }
/* 高度由 Home.tsx 的 autosize 跟随内容（1 行 38px → 最多 5 行 132px），超出才内部滚动 */
.wb-herobox textarea {
  display: block; width: 100%; min-height: 38px; max-height: 132px; resize: none; overflow-y: auto;
  border: 0; outline: none; background: none; font: inherit; font-size: 14px; line-height: 1.5; color: var(--wb-ink);
}
.wb-herobox textarea::placeholder { color: var(--wb-ink-3); }
.wb-herorow { display: flex; align-items: center; gap: 8px; margin-top: 8px; flex-wrap: wrap; }

/* hero 底部的选择器 chips：项目 / 模式 / 模型，样式对齐 DSH composer 的选择行 */
.wb-sel {
  display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 8px 0 4px;
  border: 1px solid var(--wb-card-line); border-radius: var(--wb-radius-md); background: var(--wb-bg);
  font-size: 12.5px; color: var(--wb-ink-2); flex-shrink: 0;
}
.wb-sel:hover { border-color: var(--wb-line-strong); background: var(--wb-surface-2); }
.wb-sel > b { font-weight: 500; color: var(--wb-ink-3); margin-right: 1px; }
.wb-sel select {
  appearance: none; border: 0; outline: none; background: none;
  font: inherit; font-size: 12.5px; color: var(--wb-ink); cursor: pointer;
  max-width: 130px; padding-right: 2px;
}
.wb-sel select:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; border-radius: var(--wb-radius-xs); }
.wb-sel > svg { color: var(--wb-ink-3); }
.wb-sel .wb-mini { width: 18px; height: 18px; font-size: 10.5px; border-radius: var(--wb-radius-xs); }
.wb-pick { position: relative; flex-shrink: 0; }
.wb-pickbtn {
  display: inline-flex; align-items: center; gap: 7px; height: 28px; padding: 0 8px 0 5px;
  border: 1px solid var(--wb-card-line); border-radius: var(--wb-radius-md); font-size: 12.5px; font-weight: 500;
  background: var(--wb-bg); color: var(--wb-ink); cursor: pointer;
  transition: all 140ms var(--wb-ease);
}
.wb-pickbtn:hover { border-color: var(--wb-line-strong); background: var(--wb-surface-2); }
.wb-pickbtn:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }
.wb-pickbtn svg { color: var(--wb-ink-3); }
/* 向下展开：hero 紧贴 sticky 顶栏，向上弹在 900px 高窗口里会把菜单顶出视口（6 个项目就需要 228px） */
.wb-pickmenu {
  position: absolute; top: calc(100% + 8px); left: 0; z-index: 40;
  width: 290px; max-width: calc(100vw - 48px); max-height: min(296px, 42vh); overflow-y: auto; padding: 5px;
  background: var(--wb-surface); border: 1px solid var(--wb-line); border-radius: var(--wb-radius);
  box-shadow: var(--wb-shadow-3);
}
.wb-pickcap { font-size: 11.5px; color: var(--wb-ink-3); padding: 6px 9px 4px; }
.wb-pickitem {
  display: flex; align-items: center; gap: 9px; width: 100%; text-align: left; height: 33px; padding: 0 9px;
  border: 0; background: none; border-radius: var(--wb-radius-md); font: inherit; font-size: 13px; color: var(--wb-ink); cursor: pointer;
}
.wb-pickitem:hover { background: var(--wb-surface-2); }
.wb-pickitem[aria-selected='true'] { background: var(--wb-accent-bg); }
.wb-pickitem .n { margin-left: auto; font-size: 11.5px; color: var(--wb-ink-3); }
.wb-pickitem .ck { margin-left: 4px; color: var(--wb-accent-deep); visibility: hidden; }
.wb-pickitem[aria-selected='true'] .ck { visibility: visible; }
/* min-width:0 缺了就是「不省略」：flex 子项默认 min-width:auto，等于内容宽 */
.wb-hint { margin-left: auto; min-width: 0; font-size: 12px; color: var(--wb-ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wb-hint b { color: var(--wb-ink-2); font-weight: 500; }
.wb-send {
  width: 28px; height: 28px; border-radius: 50%; border: 0; padding: 0; flex-shrink: 0;
  display: grid; place-items: center; background: var(--wb-accent); color: var(--wb-accent-ink); cursor: pointer;
  transition: background 140ms var(--wb-ease);
}
.wb-send:hover { background: var(--wb-accent-deep); }
.wb-send:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }

/* 项目色块（按 id 哈希取色的身份 tile） */
.wb-mini { width: 20px; height: 20px; border-radius: var(--wb-radius-sm); display: inline-grid; place-items: center; color: #fff; font-size: 11px; font-weight: 600; flex-shrink: 0; }
.wb-mini.sm { width: 14px; height: 14px; border-radius: var(--wb-radius-xs); font-size: 10px; }

/* 状态点：紫=运行（呼吸） · 灰=空闲 · 空心=沉寂 */
.wb-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
@keyframes wb-breathe { 0%, 100% { box-shadow: 0 0 0 0 rgba(128, 70, 243, 0.35); } 50% { box-shadow: 0 0 0 5px rgba(128, 70, 243, 0); } }
.wb-dot-run { background: var(--wb-accent); box-shadow: 0 0 0 3px var(--wb-accent-bg); animation: wb-breathe 2.2s ease-in-out infinite; }
.wb-dot-idle { background: var(--wb-ink-3); }
.wb-dot-off { background: transparent; border: 1.5px solid var(--wb-ink-3); }

/* 统计卡：数据前置（图标 | 标签+大数字+说明 | hover 箭头），点击进子屏。
   参照飞书主页的快捷卡：均分整行铺满（页边距由 .wb-main 提供），四张等宽。 */
.wb-quick { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 26px 0 0; }
@media (max-width: 1000px) { .wb-quick { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.wb-qcard {
  display: flex; align-items: center; gap: 11px; text-align: left; min-width: 0;
  background: var(--wb-surface); border: 1px solid var(--wb-card-line); border-radius: var(--wb-radius); padding: 11px 14px;
  font: inherit; color: inherit; cursor: pointer;
  transition: border-color 120ms var(--wb-ease), box-shadow 120ms var(--wb-ease);
}
.wb-qcard:hover { border-color: var(--wb-line-strong); box-shadow: var(--wb-shadow-2); }
.wb-qcard:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }
.wb-qcard.is-run { border-color: var(--wb-accent-line); }
.wb-qicon { width: 34px; height: 34px; border-radius: var(--wb-radius-md); display: grid; place-items: center; flex-shrink: 0; }
/* 四种色调由类决定，不再各自写内联 style */
.wb-qicon.is-accent { background: var(--wb-accent-bg); color: var(--wb-accent-deep); }
.wb-qicon.is-blue { background: var(--wb-blue-bg); color: var(--wb-blue); }
.wb-qicon.is-amber { background: var(--wb-amber-bg); color: var(--wb-amber); }
.wb-qicon.is-danger { background: var(--wb-danger-bg); color: var(--wb-danger); }
.wb-qbody { min-width: 0; flex: 1; }
.wb-qlabel { font-size: 12px; color: var(--wb-ink-2); }
.wb-qvalue { display: flex; align-items: baseline; gap: 6px; }
.wb-qvalue b { font-size: 17px; font-weight: 600; letter-spacing: -0.2px; font-variant-numeric: tabular-nums; }
.wb-qvalue .delta { font-size: 11.5px; font-weight: 500; color: var(--wb-ink-3); }
.wb-qvalue .delta.hot { color: var(--wb-accent-deep); }
/* display:block 是省略号生效的前提：原本是 inline span，overflow/text-overflow 全被忽略，
   长说明（「最近 7 天没有活动」之类的长句）会直接把卡片撑宽 */
.wb-qdesc { display: block; font-size: 11.5px; color: var(--wb-ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wb-qgo {
  width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0;
  color: var(--wb-ink-3); opacity: 0; transform: translateX(-3px);
  transition: opacity 130ms var(--wb-ease), transform 130ms var(--wb-ease);
}
.wb-qcard:hover .wb-qgo, .wb-qcard:focus-within .wb-qgo { opacity: 1; transform: none; }

/* 项目总览段头：标题 + 状态 tab + 视图切换（数据口径在顶栏「最近活动」，这里不再重复） */
.wb-ovhead { display: flex; align-items: center; gap: 10px; margin: 34px 0 12px; flex-wrap: wrap; }
.wb-ovhead h2 { margin: 0; font-size: 15px; font-weight: 600; }
.wb-ovhead .hint { font-size: 12px; color: var(--wb-ink-3); }
.wb-ovhead .tools { margin-left: auto; display: flex; align-items: center; gap: 8px; }
/* 两个分段控件并排在同一行：容器统一 34px 高、内层控件 28px 高，
   原来 .wb-seg（3+4px padding 撑到 33px）与 .wb-viewseg（2px padding + 23px 按钮 → 27px）底边对不齐 */
.wb-seg { display: inline-flex; align-items: center; gap: 2px; background: var(--wb-surface-2); border-radius: var(--wb-radius-md); padding: 3px; height: 34px; box-sizing: border-box; }
.wb-seg button {
  display: inline-flex; align-items: center; height: 28px;
  border: none; background: transparent; color: var(--wb-ink-2); font-size: 12.5px;
  padding: 0 12px; border-radius: var(--wb-radius-sm); cursor: pointer; transition: all 160ms var(--wb-ease);
}
.wb-seg button:hover { color: var(--wb-ink); }
.wb-seg button[aria-selected='true'] { background: var(--wb-surface); color: var(--wb-ink); font-weight: 600; box-shadow: var(--wb-shadow-1); }
.wb-seg button:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 1px; }
.wb-seg .cnt { opacity: 0.6; margin-left: 4px; }
.wb-viewseg { display: inline-flex; align-items: center; gap: 2px; background: var(--wb-surface-2); border-radius: var(--wb-radius-md); padding: 3px; height: 34px; box-sizing: border-box; }
.wb-viewseg button {
  width: 26px; height: 28px; display: grid; place-items: center; padding: 0;
  border: none; background: transparent; border-radius: var(--wb-radius-sm); color: var(--wb-ink-2); cursor: pointer;
}
.wb-viewseg button[aria-pressed='true'] { background: var(--wb-surface); color: var(--wb-ink); box-shadow: var(--wb-shadow-1); }
.wb-viewseg button:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 1px; }

/* 密度项目卡：状态点+名称+最近 / mono 路径 / 三格数字块 / 最近会话页脚 */
.wb-pgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 12px; }
.wb-pcard {
  text-align: left; width: 100%; font: inherit; color: inherit; cursor: pointer;
  background: var(--wb-surface); border: 1px solid var(--wb-card-line); border-radius: var(--wb-radius);
  padding: 12px 14px 10px; position: relative; min-width: 0;
  transition: border-color 140ms var(--wb-ease), box-shadow 140ms var(--wb-ease);
}
.wb-pcard:hover { border-color: var(--wb-line-strong); box-shadow: var(--wb-shadow-2); }
.wb-pcard:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }
.wb-pcard.is-run { border-color: var(--wb-accent-line); }
.wb-pcard.is-arch .wb-pname, .wb-pcard.is-arch .wb-ppath, .wb-pcard.is-arch .wb-pfoot .t { color: var(--wb-ink-3); }
.wb-ptop { display: flex; align-items: center; gap: 8px; min-width: 0; }
.wb-pname { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.wb-plast { margin-left: auto; font-size: 11.5px; color: var(--wb-ink-3); flex-shrink: 0; }
/* display:block 必填：inline 元素上的 nowrap/overflow/ellipsis 和 margin-top 都不生效，
   长路径会横向冲出卡片（105 字符的 Windows 路径实测越过卡片右缘 200px+） */
.wb-ppath { display: block; margin-top: 2px; color: var(--wb-ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wb-ptiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 9px; }
.wb-ptile { background: var(--wb-surface-2); border-radius: var(--wb-radius-md); padding: 5px 4px 4px; text-align: center; min-width: 0; }
.wb-ptile b { display: block; font-size: 14px; font-weight: 600; line-height: 1.3; font-variant-numeric: tabular-nums; }
.wb-ptile b.hot { color: var(--wb-amber); }
.wb-ptile span { display: block; font-size: 11.5px; color: var(--wb-ink-3); line-height: 1.35; }
.wb-pfoot {
  display: flex; align-items: center; gap: 10px; margin-top: 9px; padding-top: 8px;
  border-top: 1px solid var(--wb-line); font-size: 12px; color: var(--wb-ink-2);
}
.wb-pfoot .t { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wb-pfoot .tm { margin-left: auto; font-size: 11.5px; color: var(--wb-ink-3); white-space: nowrap; flex-shrink: 0; }

/* 徽章 / 总览列表视图 */
.wb-badge { font-size: 11.5px; border-radius: var(--wb-radius-xs); padding: 1px 6px; font-weight: 500; white-space: nowrap; flex-shrink: 0; }
.wb-badge.run { color: var(--wb-accent-deep); background: var(--wb-accent-bg); }
.wb-badge.warn { color: var(--wb-amber); background: var(--wb-amber-bg); }
.wb-badge.dim { color: var(--wb-ink-3); background: var(--wb-surface-2); }
.wb-lhead, .wb-lrow {
  display: grid; grid-template-columns: 1.2fr 1.3fr 56px 56px 56px 92px 26px;
  align-items: center; gap: 12px; padding: 0 10px;
}
@media (max-width: 900px) {
  .wb-lhead, .wb-lrow { grid-template-columns: 1.3fr 56px 56px 56px 92px 26px; }
  .wb-lhead .pth, .wb-lrow .pth { display: none; }
}
.wb-lhead { height: 34px; margin-top: 2px; font-size: 11.5px; color: var(--wb-ink-3); border-bottom: 1px solid var(--wb-line); }
.wb-lrow {
  height: 42px; width: 100%; text-align: left; font: inherit; color: inherit; cursor: pointer;
  border: none; border-bottom: 1px solid var(--wb-line); background: none;
  transition: background 140ms var(--wb-ease);
}
.wb-lrow:hover { background: var(--wb-surface-2); }
.wb-lrow:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: -2px; }
.wb-lrow .nm { display: flex; align-items: center; gap: 8px; min-width: 0; font-weight: 500; }
.wb-lrow .nm > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wb-lrow.is-arch .nm > span, .wb-lrow.is-arch .pth { color: var(--wb-ink-3); }
.wb-lrow .pth { color: var(--wb-ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wb-lrow .n { font-size: 12.5px; color: var(--wb-ink-2); text-align: right; font-variant-numeric: tabular-nums; }
.wb-lrow .n.hot { color: var(--wb-amber); font-weight: 600; }
.wb-lrow .tm { font-size: 12px; color: var(--wb-ink-3); text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }

/* ===== 子屏（运行中 / 继续工作 / 待办） ===== */
.wb-sub { animation: wb-enter 170ms var(--wb-ease); }
@keyframes wb-enter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .wb-sub { animation: none; }
  .wb-dot-run { animation: none; }
}
.wb-subhead { display: flex; align-items: center; gap: 11px; padding: 16px 0 14px; flex-wrap: wrap; }
.wb-subhead h2 { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: -0.2px; }
.wb-subhead .hint { font-size: 12px; color: var(--wb-ink-3); }
.wb-subhead .sub-actions { margin-left: auto; display: flex; gap: 8px; }
.wb-runcard {
  display: flex; align-items: center; gap: 13px; text-align: left; width: 100%; font: inherit; color: inherit; cursor: pointer;
  background: linear-gradient(180deg, color-mix(in oklab, var(--wb-accent) 7%, transparent), transparent), var(--wb-surface);
  border: 1px solid var(--wb-accent-line); border-radius: var(--wb-radius); padding: 14px 16px;
  transition: box-shadow 120ms var(--wb-ease);
}
.wb-runcard:hover { box-shadow: var(--wb-shadow-2); }
.wb-runcard:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }
.wb-runcard + .wb-runcard { margin-top: 11px; }
.wb-runcard .breathe { width: 8px; height: 8px; border-radius: 50%; background: var(--wb-accent); flex-shrink: 0; animation: wb-breathe 2.2s ease-in-out infinite; }
.wb-runcard-main { min-width: 0; }
.wb-runcard-main b { display: block; font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wb-runcard-main span { font-size: 12px; color: var(--wb-ink-3); }
.wb-openbtn {
  margin-left: auto; height: 27px; padding: 0 11px; flex-shrink: 0;
  border: 1px solid var(--wb-line); border-radius: var(--wb-radius-md); font-size: 12px;
  color: var(--wb-ink-2); background: var(--wb-surface); cursor: pointer;
  transition: all 140ms var(--wb-ease);
}
.wb-openbtn:hover { color: var(--wb-accent); border-color: var(--wb-accent); }

.wb-empty-state { padding: 64px 0; text-align: center; color: var(--wb-ink-3); }
.wb-empty-state h2 { font-size: 16px; color: var(--wb-ink-2); margin: 0 0 8px; }
.wb-empty-state p { margin: 0 0 16px; font-size: 12.5px; }

/* ===== L2 ===== */
/* 详情页头：一行放完（返回 / 工作区名 / 路径 / 新建会话）。项目切换回 L1 卡片墙，
   详情页不再挂第二个切换器——两个入口只让「我在哪个工作区」多一次解释。 */
.wb-dhead { display: flex; align-items: center; gap: 12px; margin: 18px 0 14px; min-height: 30px; flex-wrap: wrap; }
/* 返回按钮：两个层级共用一个规格（28×28 + 同一个 Icon），原来 Detail 用文本「←」26×26、
   子屏用 SVG 30×30，同一产品里两种返回观感 */
.wb-back-btn {
  flex-shrink: 0; width: 28px; height: 28px; display: grid; place-items: center; padding: 0;
  border: 1px solid var(--wb-line); border-radius: var(--wb-radius-sm); background: var(--wb-surface);
  color: var(--wb-ink-2); line-height: 1; cursor: pointer;
  transition: all 160ms var(--wb-ease);
}
.wb-back-btn:hover { color: var(--wb-ink); border-color: var(--wb-line-strong); }
.wb-dhead-main { display: flex; align-items: baseline; gap: 10px; min-width: 0; flex: 1; }
.wb-dhead h1 { font-size: 17px; margin: 0; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 46vw; }
/* 路径与 h1 同一个 flex 行：都要 min-width:0，否则 min-width:auto 会按内容宽撑开、省略号永远不触发 */
.wb-dhead .wb-proj-path { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wb-proj-path { color: var(--wb-ink-3); }
.wb-new-session { flex-shrink: 0; }
.wb-dead-banner {
  border-left: 3px solid var(--wb-danger); background: var(--wb-surface);
  border-radius: 0 var(--wb-radius-md) var(--wb-radius-md) 0; padding: 8px 12px; margin: 10px 0; font-size: 12.5px; color: var(--wb-ink-2);
}
/* 四格等宽 KPI：标签在上、数值在下（不再把标签和数字挤成一行）。
   统计范围写在这条的 title 里——页头已经写明是哪个工作区，条内再写一遍就是噪音。
   0 值弱化、非 0 加重；变化量跟数值同一行，不另起脚注。 */
.wb-kpi {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); overflow: hidden;
  margin: 0 0 18px; background: var(--wb-surface); border: 1px solid var(--wb-card-line);
  border-radius: var(--wb-radius);
}
.wb-kpi .kv { display: flex; flex-direction: column; gap: 1px; padding: 9px 14px 8px; min-width: 0; border-left: 1px solid var(--wb-line); }
.wb-kpi .kv:first-child { border-left: 0; }
.wb-kpi .k { font-size: 11.5px; color: var(--wb-ink-3); letter-spacing: 0.2px; }
.wb-kpi .vv { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
.wb-kpi .v { font-size: 16px; font-weight: 600; line-height: 1.35; color: var(--wb-ink); font-variant-numeric: tabular-nums; }
.wb-kpi .kv.is-zero .v { color: var(--wb-ink-3); font-weight: 500; }
.wb-kpi .d {
  font-size: 11.5px; color: var(--wb-accent-deep); min-width: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
@media (max-width: 720px) {
  .wb-kpi { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .wb-kpi .kv:nth-child(2n + 1) { border-left: 0; }
  .wb-kpi .kv:nth-child(n + 3) { border-top: 1px solid var(--wb-line); }
}
/* 侧栏宽度 = 内容区的 1/4（3fr : 1fr）。本机 25 条待办实测：中位数 31 字、p90 65 字，
   1/4 在 1440 窗口上约 360px（~24 字/行），够中位数两行读完；再宽只会让主列变挤——
   1/3 在 1920 上是 640px，单列待办撑不住那种行长。260px 是下限（窄窗口别把待办压死），
   1024px 以下直接单列堆叠。 */
.wb-cols { display: grid; grid-template-columns: minmax(0, 3fr) minmax(260px, 1fr); gap: 22px; align-items: start; }
@media (max-width: 1024px) { .wb-cols { grid-template-columns: 1fr; } }
/* 列表头：tab 在左、筛选/排序贴右端，共用同一条底线（省掉原来那一整行工具条） */
.wb-listbar {
  display: flex; align-items: flex-end; gap: 12px;
  border-bottom: 1px solid var(--wb-line); margin-bottom: 4px;
}
.wb-listbar .wb-tabs { flex: 1; min-width: 0; border-bottom: 0; margin-bottom: 0; }
.wb-listctl { display: flex; align-items: center; gap: 2px; margin-left: auto; padding-bottom: 5px; position: relative; }
.wb-ctl {
  display: inline-flex; align-items: center; gap: 4px; padding: 3px 7px; font-size: 12px;
  color: var(--wb-ink-2); background: none; border: 0; border-radius: var(--wb-radius-sm); cursor: pointer;
  transition: all 160ms var(--wb-ease);
}
.wb-ctl:hover { color: var(--wb-ink); background: var(--wb-surface-2); }
.wb-ctl.is-on { color: var(--wb-accent-deep); background: var(--wb-accent-bg); }
.wb-ctl .cnt { font-size: 11px; }
.wb-ctl .caret { font-size: 10.5px; opacity: 0.7; }
.wb-pop-scrim { position: fixed; inset: 0; z-index: 35; }
.wb-pop {
  position: absolute; right: 0; top: calc(100% + 2px); z-index: 40; min-width: 180px; padding: 6px;
  background: var(--wb-surface); border: 1px solid var(--wb-line); border-radius: var(--wb-radius);
  box-shadow: var(--wb-shadow-3);
}
.wb-pop .pop-hd { padding: 3px 8px 5px; font-size: 11.5px; color: var(--wb-ink-3); }
.wb-pop .pop-row {
  display: flex; align-items: center; gap: 8px; width: 100%; padding: 5px 8px;
  border: 0; background: none; border-radius: var(--wb-radius-sm); cursor: pointer;
  font: inherit; font-size: 12.5px; color: var(--wb-ink); text-align: left;
}
.wb-pop .pop-row:hover { background: var(--wb-surface-2); }
.wb-pop .pop-row:disabled { opacity: 0.5; cursor: not-allowed; }
.wb-pop .pop-row .tick { margin-left: auto; color: var(--wb-accent); font-size: 11px; }
.wb-pop .pop-sep { height: 1px; background: var(--wb-line); margin: 5px 4px; }
.wb-listnote { font-size: 11.5px; color: var(--wb-ink-3); padding: 6px 6px 0; }

.wb-tabs { display: flex; gap: 20px; border-bottom: 1px solid var(--wb-line); margin-bottom: 4px; }
.wb-tab {
  background: none; border: none; font-size: 13px; color: var(--wb-ink-2);
  padding: 8px 2px 9px; cursor: pointer; position: relative; transition: color 160ms var(--wb-ease);
}
.wb-tab .cnt { font-size: 11.5px; color: var(--wb-ink-3); margin-left: 3px; }
.wb-tab:hover { color: var(--wb-ink); }
.wb-tab[aria-selected='true'] { color: var(--wb-accent); font-weight: 600; }
.wb-tab[aria-selected='true']::after {
  content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--wb-accent);
}
.wb-srow {
  display: flex; align-items: center; gap: 10px; padding: 9px 6px; width: 100%; min-height: 40px;
  border: none; border-bottom: 1px solid var(--wb-line); background: none; text-align: left;
  font: inherit; color: inherit; cursor: pointer; transition: background 160ms var(--wb-ease);
}
.wb-srow:hover { background: var(--wb-surface-2); }
.wb-srow:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: -2px; }
/* 行高统一：没有副标题的行也占同样的高度，列表看起来才是一条条，而不是忽高忽低 */
.wb-srow .wb-dot { align-self: flex-start; margin-top: 8px; }
.wb-srow-main { display: block; min-width: 0; flex: 1; }
/* 标题行 = 标题（可省略）+ 徽章（不换行）。原来 .t 是 block、徽章跟在其后，
   带「子会话 / 空壳」的行会被挤成三行，同一列表忽高忽低 */
.wb-srow-t { display: flex; align-items: center; gap: 6px; min-width: 0; }
.wb-srow .t {
  display: block; min-width: 0; flex: 0 1 auto; font-weight: 500; font-size: 13px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
/* 第二行：会话自己身上的事实（待办摘要 / 数据来源），没有就不占行高 */
.wb-srow .sub {
  display: block; margin-top: 1px; font-size: 11.5px; color: var(--wb-ink-3);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.wb-srow .m { color: var(--wb-ink-3); font-size: 11.5px; margin-left: auto; white-space: nowrap; flex-shrink: 0; }
.wb-side-card { background: var(--wb-surface); border: 1px solid var(--wb-card-line); border-radius: var(--wb-radius); padding: 13px 15px; margin-bottom: 14px; }
.wb-side-card h3 { margin: 0 0 9px; font-size: 12px; font-weight: 600; color: var(--wb-ink-2); letter-spacing: 0.3px; }
.wb-feed { font-size: 12.5px; }
.wb-feed .f { display: flex; gap: 9px; padding: 4px 0; color: var(--wb-ink-2); }
.wb-feed .f::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: var(--wb-line-strong); margin-top: 7px; flex-shrink: 0; }
.wb-feed .f:first-child::before { background: var(--wb-accent); }
.wb-feed .f .w { margin-left: auto; color: var(--wb-ink-3); font-size: 11.5px; white-space: nowrap; }
.wb-side-empty { color: var(--wb-ink-3); font-size: 12px; padding: 4px 0; }

/* ===== 待办 / 批量 / 整理（P3） ===== */

/* 旧路径提示：项目改名或搬目录后，会话的 cwd 还停在旧址 */
.wb-stale-banner {
  border-left: 3px solid var(--wb-amber); background: var(--wb-surface);
  border-radius: 0 var(--wb-radius-md) var(--wb-radius-md) 0; padding: 8px 12px; margin: 10px 0; font-size: 12.5px; color: var(--wb-ink-2);
}
.wb-stale-banner .mono { color: var(--wb-ink); }

/* 右栏「诊断与变更」时间线：点 + 一句话 + 右侧相对时间。拿不到时间就不写，不编日期。
   内容只收左栏列表里没有的：异常计数、今日变化、正在执行的会话数。 */
.wb-timeline { display: flex; flex-direction: column; gap: 1px; }
.wb-tl { display: flex; align-items: baseline; gap: 8px; padding: 4px 0; font-size: 12.5px; color: var(--wb-ink-2); }
.wb-tl .tl-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--wb-line-strong); flex-shrink: 0; position: relative; top: -2px; }
.wb-tl.is-warn .tl-dot { background: var(--wb-amber); }
.wb-tl.is-ok .tl-dot { background: var(--wb-accent); }
.wb-tl .tl-txt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wb-tl .tl-when { margin-left: auto; color: var(--wb-ink-3); font-size: 11.5px; white-space: nowrap; }
.wb-side-foot {
  display: flex; align-items: baseline; gap: 8px; margin-top: 7px; padding-top: 7px;
  border-top: 1px solid var(--wb-line); font-size: 11.5px; color: var(--wb-ink-3);
}
.wb-ghost-btn.is-on { color: var(--wb-accent); border-color: var(--wb-accent-line); background: var(--wb-accent-bg); }
.wb-ghost-btn.is-primary { color: var(--wb-accent-ink); background: var(--wb-accent); border-color: var(--wb-accent); }
.wb-ghost-btn.is-primary:hover { background: var(--wb-accent-deep); border-color: var(--wb-accent-deep); color: var(--wb-accent-ink); }
.wb-ghost-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.wb-ghost-btn.wb-danger:hover { color: var(--wb-danger); border-color: var(--wb-danger); }

.wb-batchbar {
  display: flex; align-items: center; gap: 8px; padding: 8px 10px; margin-bottom: 10px;
  background: var(--wb-surface); border: 1px solid var(--wb-line); border-radius: var(--wb-radius-sm);
}
.wb-batchbar .n { font-size: 12px; color: var(--wb-ink-2); margin-right: 4px; }

.wb-idle-panel {
  border: 1px solid var(--wb-line); background: var(--wb-surface);
  border-radius: var(--wb-radius); padding: 12px 14px; margin-bottom: 14px;
}
.wb-idle-panel .hd { font-size: 12.5px; color: var(--wb-ink-2); margin-bottom: 8px; }
.wb-idle-panel .hd select {
  margin: 0 4px; font: inherit; font-size: 12px; padding: 2px 4px;
  background: var(--wb-surface-2); color: var(--wb-ink); border: 1px solid var(--wb-line); border-radius: var(--wb-radius-sm);
}
.wb-idle-actions { display: flex; gap: 8px; margin-top: 10px; }
.wb-pick-list { list-style: none; margin: 0; padding: 0; max-height: 260px; overflow-y: auto; }
.wb-pick-list li {
  display: flex; align-items: center; gap: 10px; padding: 4px 0;
  border-bottom: 1px solid var(--wb-line); font-size: 12.5px;
}
.wb-pick-list li:last-child { border-bottom: none; }
.wb-pick-list label { display: flex; align-items: center; gap: 8px; min-width: 0; cursor: pointer; }
.wb-pick-list input { width: 14px; height: 14px; accent-color: var(--wb-accent); flex-shrink: 0; }
.wb-pick-list .t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wb-pick-list .m { margin-left: auto; color: var(--wb-ink-3); font-size: 11.5px; white-space: nowrap; }

/* 待办行：正文独占整行，来源会话另起一行——两者不再抢同一行的宽度 */
.wb-todo-feed .f { display: block; padding: 6px 0 6px 13px; position: relative; }
.wb-todo-feed .f::before {
  content: ''; position: absolute; left: 0; top: 11px; width: 5px; height: 5px;
  border-radius: 50%; background: var(--wb-line-strong); margin: 0;
}
.wb-todo-feed .f.is-run::before { background: var(--wb-accent); }
.wb-todo-feed .f-txt { display: block; color: var(--wb-ink); }
.wb-todo-feed .f-w {
  display: block; margin-top: 1px; color: var(--wb-ink-3); font-size: 11.5px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.wb-srow.is-picked { background: var(--wb-accent-bg); }
.wb-srow-check { width: 14px; height: 14px; accent-color: var(--wb-accent); flex-shrink: 0; cursor: pointer; }

/* ===== 抽屉：只读预览 / 数据诊断 ===== */
.wb-overlay { position: fixed; inset: 0; z-index: 60; background: rgba(0, 0, 0, 0.42); display: flex; justify-content: flex-end; }
.wb-drawer {
  width: min(680px, 92vw); height: 100%; background: var(--wb-bg); border-left: 1px solid var(--wb-line);
  display: flex; flex-direction: column; box-shadow: var(--wb-shadow-drawer);
}
.wb-drawer-head { display: flex; align-items: flex-start; gap: 14px; padding: 16px 20px; border-bottom: 1px solid var(--wb-line); }
.wb-drawer-title { font-size: 14px; font-weight: 600; }
.wb-drawer-sub { font-size: 11.5px; color: var(--wb-ink-3); margin-top: 3px; }
.wb-drawer-head .wb-ghost-btn { margin-left: auto; flex-shrink: 0; }
.wb-drawer-body { padding: 16px 20px 40px; overflow-y: auto; flex: 1; }
.wb-note {
  font-size: 12px; color: var(--wb-ink-2); background: var(--wb-surface-2);
  border-radius: var(--wb-radius-sm); padding: 7px 10px; margin-bottom: 12px;
}

.wb-msg { margin-bottom: 14px; padding-left: 10px; border-left: 2px solid transparent; }
.wb-msg.is-hit {
  border-left-color: var(--wb-accent); background: var(--wb-accent-bg);
  border-radius: 0 var(--wb-radius-sm) var(--wb-radius-sm) 0; padding: 6px 10px;
}
.wb-msg-head { display: flex; gap: 8px; align-items: baseline; font-size: 11.5px; color: var(--wb-ink-3); margin-bottom: 3px; }
.wb-msg-head .who { font-weight: 600; color: var(--wb-ink-2); }
.wb-msg-body { font-size: 12.5px; color: var(--wb-ink); white-space: pre-wrap; word-break: break-word; }

.wb-diag { margin-bottom: 22px; }
.wb-diag h4 { display: flex; align-items: baseline; gap: 8px; font-size: 13px; margin: 0 0 6px; }
.wb-diag h4 .cnt { font-size: 11.5px; color: var(--wb-ink-3); font-weight: 400; }
.wb-diag-hint { font-size: 12px; color: var(--wb-ink-3); margin: 0 0 8px; }
.wb-diag-actions { display: flex; gap: 8px; margin-bottom: 8px; }
.wb-diag-list { list-style: none; margin: 0; padding: 0; }
.wb-diag-list li {
  display: flex; align-items: center; gap: 9px; padding: 6px 0;
  border-bottom: 1px solid var(--wb-line); font-size: 12.5px;
}
.wb-diag-list li .t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wb-diag-list li .p {
  color: var(--wb-ink-3); font-size: 11.5px; white-space: nowrap;
  max-width: 180px; overflow: hidden; text-overflow: ellipsis;
}
.wb-diag-list li .when { color: var(--wb-ink-3); font-size: 11.5px; white-space: nowrap; }
.wb-diag-list li .wb-ghost-btn { margin-left: auto; padding: 2px 9px; font-size: 11.5px; }
.wb-diag-list li .wb-ghost-btn + .wb-ghost-btn { margin-left: 0; }
/* 徽章：base 带 1px 透明边框，变体才有地方改 border-color（此前 .wb-tag 没有 border，
   is-empty 设的 border-color 是空写）。也不用未定义的 --wb-warn，直接用琥珀 token */
.wb-tag {
  font-size: 11.5px; line-height: 1.5; padding: 0 6px; border-radius: var(--wb-radius-pill);
  background: var(--wb-surface-2); color: var(--wb-ink-3); white-space: nowrap; flex-shrink: 0;
  border: 1px solid transparent;
}
.wb-tag.is-warn { color: var(--wb-amber); background: var(--wb-amber-bg); }
.wb-tag.is-empty {
  color: var(--wb-amber); background: var(--wb-amber-bg);
  border-color: color-mix(in oklab, var(--wb-amber) 38%, transparent);
}
.wb-tag.is-sub { color: var(--wb-accent-deep); background: var(--wb-accent-bg); }

.wb-search-sect {
  padding: 7px 12px 5px; font-size: 11.5px; font-weight: 600; color: var(--wb-ink-3);
  border-top: 1px solid var(--wb-line); background: var(--wb-surface-2);
}

/* ===== 插件详情卡（设置 → 插件 → 全景概览） ===== */
.dsho-cfg { display: flex; flex-direction: column; gap: 2px; padding: 2px 0 4px; }
.dsho-cfg-row {
  display: flex; align-items: center; gap: 14px; padding: 10px 0;
  border-bottom: 1px solid var(--wb-line);
}
.dsho-cfg-row:last-of-type { border-bottom: none; }
.dsho-cfg-txt { min-width: 0; }
.dsho-cfg-label { font-size: 13px; font-weight: 500; color: var(--wb-ink); }
.dsho-cfg-desc { font-size: 12px; line-height: 1.5; color: var(--wb-ink-3); margin-top: 2px; }
.dsho-cfg-hint { font-size: 11.5px; color: var(--wb-ink-3); padding-top: 6px; }

.dsho-switch {
  margin-left: auto; flex-shrink: 0; position: relative; width: 34px; height: 20px;
  border-radius: var(--wb-radius-pill); border: 1px solid var(--wb-line-strong); background: var(--wb-surface-2);
  cursor: pointer; padding: 0; transition: background 120ms ease, border-color 120ms ease;
}
.dsho-switch.is-on { background: var(--wb-accent); border-color: var(--wb-accent); }
.dsho-knob {
  position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%;
  background: #fff; transition: transform 120ms ease; box-shadow: var(--wb-shadow-1);
}
.dsho-switch.is-on .dsho-knob { transform: translateX(14px); }
.dsho-switch:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }

/* ---------- 并入工作区（项目改名/搬迁后的补救） ---------- */
.wb-adopt {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  margin: 10px 0 4px; padding: 10px 12px;
  border: 1px dashed var(--wb-line-strong); border-radius: var(--wb-radius-md);
  background: var(--wb-surface-2); font-size: 12.5px; color: var(--wb-ink-2);
}
.wb-adopt .txt { flex: 1; min-width: 240px; line-height: 1.6; }
.wb-adopt select {
  height: 28px; padding: 0 8px; border-radius: var(--wb-radius-sm); font-size: 12.5px;
  border: 1px solid var(--wb-line-strong); background: var(--wb-surface); color: inherit;
}

/* ---------- 待办卡：人工待办 + 会话待办 ---------- */
.wb-side-card h3 .cnt { margin-left: 6px; font-weight: 500; color: var(--wb-ink-3); font-size: 11.5px; }
.wb-side-card h3 .cnt.hot { color: var(--wb-amber); font-weight: 600; }
.wb-side-card h3 { display: flex; align-items: center; gap: 8px; }
.wb-todo-add { display: flex; gap: 6px; margin: 8px 0 6px; }
.wb-todo-add input {
  flex: 1; min-width: 0; height: 28px; padding: 0 8px; font-size: 12.5px;
  border-radius: var(--wb-radius-sm); border: 1px solid var(--wb-line-strong);
  background: var(--wb-surface); color: inherit;
}
.wb-todo-add input:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 1px; }
.wb-todo-add button { flex-shrink: 0; height: 28px; }
.wb-todo-feed .f.f-manual { align-items: flex-start; }
.wb-todo-feed .f.f-manual::before { display: none; }
.wb-todo-feed .f input[type='checkbox'] { margin: 3px 0 0; accent-color: var(--wb-accent); flex-shrink: 0; cursor: pointer; }
.wb-todo-feed .f.is-done .f-txt { color: var(--wb-ink-3); text-decoration: line-through; }
.wb-todo-feed .f-tag {
  flex-shrink: 0; font-size: 11px; line-height: 16px; padding: 0 5px; border-radius: var(--wb-radius-xs);
  color: var(--wb-ink-3); border: 1px solid var(--wb-line-strong);
}
.wb-todo-feed .f-del {
  flex-shrink: 0; width: 18px; height: 18px; line-height: 16px; padding: 0;
  border: 0; background: none; color: var(--wb-ink-3); font-size: 15px; cursor: pointer; border-radius: var(--wb-radius-xs);
}
.wb-todo-feed .f-del:hover { color: var(--wb-danger); background: var(--wb-surface-2); }

/* 行内文字按钮（例如 stale 提示里的「取消并入」）：不抢视觉，但可点 */
.wb-link-btn {
  margin-left: 8px; padding: 0; border: 0; background: none; cursor: pointer;
  color: var(--wb-accent); font-size: inherit; text-decoration: underline; text-underline-offset: 2px;
}
.wb-link-btn:disabled { opacity: 0.5; cursor: default; }

/* ===== 通用小工具 =====
   这些原本散在 JSX 里的内联 style（Icon 的 flex-shrink、紧凑卡内边距、可点行手势、
   右对齐表头、空态内边距），收成类后主题与密度调整只改一处。 */
.wb-ic { flex-shrink: 0; }
.wb-side-card.is-tight { padding: 4px 10px; }
.wb-feed .f.is-click { cursor: pointer; }
.wb-sel-v { color: var(--wb-ink); }
.wb-lhead .r { text-align: right; }
.wb-side-empty.is-pad { padding: 26px 4px; }

/* ===== 窄宽适配 =====
   原来只有 5 个断点（quick 2 列 / 列表隐藏路径 / kpi 2×2 / cols 单列 / 减动效），
   顶栏、详情页头、hero 选择行完全没有窄宽策略，窗口一窄就只剩横向溢出。
   这里所有内边距变化都和 .wb-topbar-inner / .wb-notewrap 保持同一套沟槽。 */
@media (max-width: 900px) {
  .wb-fresh { display: none; } /* 数据新鲜度让位给搜索框 */
}
@media (max-width: 720px) {
  .wb-topbar-inner { padding: 9px 16px 8px; gap: 8px; }
  .wb-main { padding: 0 16px 36px; }
  .wb-notewrap { padding: 10px 16px 0; }
  .wb-search { width: 100%; max-width: 200px; }
  .wb-search:focus-within { width: 100%; max-width: 320px; }
  /* 窄屏下拉改成贴视口：仍按 left:0 锚在输入框上会从品牌名之后开始铺，
     640px 下 582px 宽直接溢出右侧 81px */
  .wb-search-pop {
    position: fixed; left: 16px; right: 16px; width: auto; top: 54px; max-height: 60vh;
  }
  .wb-newbtn { display: none; } /* 宿主未提供新建入口，窄屏不值得为它让出 100px */
  .wb-dhead { gap: 9px; }
  .wb-dhead h1 { max-width: 56vw; }
  .wb-hero { padding: 20px 0 0; }
  .wb-pgrid { grid-template-columns: 1fr; }
  .wb-drawer { width: 100%; }
  .wb-drawer-body { padding: 14px 16px 32px; }
  .wb-tabs { gap: 14px; }
}
@media (max-width: 520px) {
  .wb-kbd { display: none; }  /* 触屏没有快捷键提示可言 */
  .wb-hint { display: none; } /* 选择行换行后把宽度让给按钮 */
  .wb-qdesc { white-space: normal; }
  .wb-pcard { padding: 11px 12px 9px; }
}
`
