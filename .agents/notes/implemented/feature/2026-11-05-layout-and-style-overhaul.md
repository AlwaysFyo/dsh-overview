# Agent Note: layout-and-style-overhaul

Status: implemented

## Problem

用户反馈「布局和样式哪里还需要优化」。对 `src/client/themeCss.ts`（732 行）、`App.tsx`、`views/Home.tsx`、`views/Detail.tsx` 做了一轮逐条审计，按「真会坏 / 一致性 / 系统性」三档记出 22 条问题，其中 P0 五条是长文案或窄窗口下必然出错、且靠读代码看不到的：

1. `.wb-ppath` / `.wb-qdesc` / `.wb-qlabel` 写了 `overflow:hidden; text-overflow:ellipsis`，但元素是 `<span>`（inline），overflow 对 inline 不生效 → 长项目路径（`c:\Users\…\AppData\Roaming\dsh\…`）直接横向溢出卡片，`margin-top` 也一起失效。`.wb-pcard` 是 `<button>`，overflow 默认 `visible`，兜不住。
2. 顶栏按 `.wb-main` 的沟槽排版，但 L2 详情页根节点原来是裸 `<section>`，既没有 24px 内边距也没有 1680 宽度上限 → 详情页的 KPI 卡与会话列表贴到窗口边，和顶栏不在同一条竖线。
3. hero 里的项目下拉菜单是 `bottom: calc(100% + 8px)` 向上弹，而 hero 距顶栏只有 30px → 900px 高的窗口里菜单顶边被裁到 −71px（满高 296px 时 −131px），选不到第一项。
4. 会话行 hover 才显示操作区，5 个 24px 按钮 = 128px，`display:none → inline-flex` 让同一行的标题与时间戳整体左移 128px（hover 抖动），且这一行有 6 个 Tab 站点。
5. `.wb-srow .t` 是 `display:block`，「子会话 / 空壳」徽章跟在标题后另起一行，行高不齐（与 `themeCss.ts` 里「行高统一」的注释矛盾）。

其余为一致性（超宽屏 1920 顶栏与内容错位 120px、提示条两种宽度、两套返回按钮、分段控件 33px vs 27px 底边不齐、搜索下拉被 230px 输入框锁死、`⌘K` 文案在 Windows 上不符、主题按钮用 `☀/☾` 文本字形）与系统性（字号 12 档且 42 条 <11.5px、圆角 13 种、20 处阴影字面量、`--wb-ink-3` 只有 3.02:1、死 token、`.wb-tag.is-empty` 用了不存在的 `--wb-warn`、只有 5 个断点、`min-height:100vh` 与宿主插槽的滚动容器叠加、textarea 不自增高、主题写在 `documentElement` 上可能撞宿主同名属性、17 处内联样式、`.wb-srow` 在 content-box 下撑出 12px 导致横向滚动）。

## Decision

不做逐点打补丁，而是先立一套能收敛同类问题的底座，再逐条落地：

- **token 收敛**：文字色压深到达标的四个值（`--wb-ink-2 #545a64` 6.95:1、`--wb-ink-3 #6a7078` 5.00:1 / surface-2 上 4.62:1、`--wb-blue #1a67d6`、`--wb-amber #a45600`、`--wb-danger #c62c25`），删死 token（`--wb-teal/-bg`、`--wb-ok`），补圆角 6 档（4/6/8/12/14/pill）与阴影 5 档（含 `--wb-shadow-accent`、`--wb-shadow-drawer`），CSS 里不再出现阴影/圆角字面量。
- **全局 border-box**：`.wb-root, .wb-root *` 一律 `box-sizing: border-box`。原来的 6px 横向溢出不是某条规则写错，而是 `width:100%` + `padding:0 6px` 在 content-box 下的必然结果——这一条同时消掉一类隐藏溢出。
- **横向栅格统一**：顶栏拆成 `.wb-topbar`（只负责 sticky + 底色 + 底线）+ `.wb-topbar-inner`（1680 + 居中 + `padding:11px 24px 10px`），提示条外加 `.wb-notewrap`（同宽同沟槽），L2 根节点补 `className="wb-main"`。三处现在与内容区同一条竖线（1440 → 24/24，1920 → 131/131）。
- **交互密度**：会话行 5 个操作收成一个 `⋯` 菜单（`.wb-sact` 常驻 24px 槽位，按钮 `opacity` 切换；菜单复用 `.wb-pop` 的语汇，加 `.wb-sact-scrim` 点空白关闭，按 `getBoundingClientRect().bottom > innerHeight - 200` 决定向上/向下）。一次同时消掉 hover 抖动与 6 个 Tab 站点；行内 `onKeyDown` 里 `closest('.wb-sact')` 直接 return，避免菜单内的回车又触发整行的「打开会话」。
- **主题作用域**：宿主内不再写 `document.documentElement`，改成 `.wb-root[data-wb-theme]`，选择器同时保留 `[data-theme='dark'] .wb-root`（Vite 沙盒与静态预览页仍按 documentElement 走）。`!IS_HOSTED` 时才回退到写 documentElement。
- **文案与字形**：`IS_MAC ? '⌘K' : 'Ctrl K'`；主题按钮换成 `Icon` 组件里的 `sun` / `moon`（与其余图标同一套 16px 线性 SVG）。
- **身份色的字色**：调色盘 7 色里 4 色配白字不到 4.5:1，`textOn(hex)` 按相对亮度在 `#ffffff` / `#181a1d` 之间选，`.wb-mini` 方块的内联样式带上 `color`。

## Alternatives considered

**只修 P0 五条、其余记为 known issue**：用户要的是「修复所有问题」，且字号/圆角/阴影这类散点不改，下一轮改动仍会以字面量形式重新散开。**保留 5 个按钮但预留 128px**：能消抖动，但 Tab 站点仍是 6 个，且窄窗口下 128px 是无意义留白。**把 5 个按钮收进抽屉**：会话行最常见的操作是「续接」，进抽屉多点一次，且抽屉会遮住列表。**给 `.wb-pcard` 只加 `overflow:hidden`**：长路径会被硬切（没有省略号），用户仍不知道路径被截断，所以改的是让 `<span>` 变块级元素。**主题继续写 documentElement 但加命名空间前缀**：宿主若也用 `data-theme`，两边语义会打架，作用域留在根节点最省事。

## Consequences

- 兼容面：`.wb-root[data-wb-theme]` 是新增属性，宿主注入的 `[data-theme]` 仍可用（保留兼容选择器）；`--wb-*` token 名未改，只有取值变化。
- 验证：`.preview/` 回路扩到 21 个 case（home/detail × 640/768/1024/1280/1440/1920 + 列表/pick/search/type/menu/history 交互态 + 深色），全部 `scrollWidth === clientWidth`、`OVER=0`；pick 菜单 top=175 在视口内；640px 下搜索下拉 `x=16 w=582 clip=0`；会话行 `w=1008 h=59` 等高、菜单 `w=150 h=138 items=4` 贴右且不出界。字号直方图从 12 档收敛到 11.5/12/12.5/13/14/15/17（11px 只剩 `.wb-mini` 方块字），圆角只剩 4/6/8/12/14 与 `50%`。对比度 13 组 × 2 主题最低 4.62（浅色 ink-3 on surface-2），深色最低 4.89。`tsc -p` 干净，`node --test tests/*.test.ts` 53/53。
- 代价：`themeCss.ts` 从 732 行涨到约 830 行（换来的是 6 档圆角/5 档阴影 token 化）；`.wb-sact` 从 5 个按钮变 1 个触发 + 菜单，多一份 `openMenu` / `menuUp` 状态，两处 `useState` 必须放在 `SessionList` 的早退 `return` 之前（否则 hook 顺序不一致）。
- 未做：暗色主题的「跟随系统」三态仍是 `light|dark`（`redesign-ui-proposal.md` §5.3 里的 `auto` 未实现）；`docs/redesign-ui-proposal.md` 的配色表是改版前的提案，实际取值以 `themeCss.ts` 为准。
