# dsh-overview

[![CI](https://github.com/AlwaysFyo/dsh-overview/actions/workflows/ci.yml/badge.svg)](https://github.com/AlwaysFyo/dsh-overview/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CNB](https://img.shields.io/badge/mirror-CNB-1a7f37.svg)](https://cnb.cool/one-mugen/dsh-overview)

DSH（DeepSeekRuntime）全景概览插件：以工作区项目为维度的会话 / 任务仪表盘，中文界面名为「全景概览」。

- 仓库（双远端同步）：[CNB](https://cnb.cool/one-mugen/dsh-overview) · [GitHub](https://github.com/AlwaysFyo/dsh-overview)
- 设计与决策：[docs/design.md](docs/design.md)
- 需求基线：[docs/dsh-overview-prd.html](docs/dsh-overview-prd.html)（PRD v0.3，含 R2 实现变更说明）
- UI 原型：[docs/dsh-overview-ui.html](docs/dsh-overview-ui.html)

`origin` 的 push URL 同时指向 CNB 与 GitHub，`git push` 即双写；`origin` fetch 仍走 CNB，GitHub 另设只读远端 `github`。

## 当前状态

第 1–5 步已落地，v0.1.21 已安装在本机 `desktop` profile（`~/.dsh/profiles/desktop`），侧栏「全景概览」入口与整页视图可用（宿主侧重启应用后生效）：

- **数据层** `src/model/` — 四数据源只读聚合（`workspace.json` / `session.v4.jsonl.zstd` / `session_projcache` / 归档缓存）。归档真相取 `workspace.json` 的 `global.archivedSessionIds`；归档缓存只补元数据，已归档会话允许同时是 live 会话；只存在于归档缓存、没有转录文件且宿主未标记归档的孤儿记录会被丢弃（否则会以「无标题」幽灵行出现）。会话头按文件指纹缓存，并且只**流式**解压到首个换行就不再读——冷启动从整文件解压的 ~490 ms 降到 ~30 ms，热读 ~10 ms（本机 47 会话 / 58 MB）。宿主写转录用的是**每批一帧**的追加方式（本机最大一份 14 MB 文件里有 10770 个 zstd 帧），而 `createZstdDecompress()` 的流在某些 Node 版本上解完第一帧就 end —— 所以 `streamLines` 自己解析帧边界（magic `0xFD2FB528` + FHD + 可选 window/dict/fcs + 逐块 block header，skippable 帧 `0x184D2A5x` 直接跳过）后逐帧解压再拼接，不依赖宿主的「一次解多帧」语义。
- **会话归属以工作区成员表为准** — `workspace.json` 的 `workspaces[*].sessionIds` 是权威成员表，cwd 只是旧路径线索。项目改名或搬目录后，会话仍归属原工作区，详情页用 `staleCwds` 提示「这些会话的 cwd 还指向旧路径」。两个 id 写法（`xxx` 与 `session-xxx`）双向匹配，会话同时登记在多个工作区时按首次出现归属并记一条 warning。成员表里查不到的会话才会退回 cwd 归桶并落进「孤儿项目」。项目目录改名/搬迁后，宿主会新建工作区而把旧会话留在原地，插件侧给一个显式动作 **并入工作区**（`POST /dsh-overview/session/adopt`）：把「这条旧 cwd」记进插件自己的归属表 `~/.dsh/storages/dsh-overview-aliases.json`，聚合时当成员表查不到就用它归组，并把这些 cwd 记进 `staleCwds` 提示、提供「取消并入」。**不写宿主 `workspace.json`**——宿主的成员表是内存真相且读取时就过滤 cwd 不匹配的会话（`@deepseek-ai/dsh-workspace` 的 `sessionIds` 文档），往文件里追加 id 会被宿主下一次写入抹掉，v0.1.14 已在真机上验证过这条路不通。代价：宿主侧栏与 CLI 仍按宿主成员表，看不到这批会话。
- **宿主侧** `src/host/` — `GET /dsh-overview/state`（首次请求触发构建，单飞避免并发重复扫描）、SSE `/dsh-overview/events`（25 s 心跳注释、订阅者断开即清理）、`POST /dsh-overview/session/delete`、`POST /dsh-overview/session/batch`（批量删除，`BatchResult` 契约）、`POST /dsh-overview/search`（正文检索）、`POST /dsh-overview/preview`（只读预览）。POST 路由统一同源校验 + body 上限（8 KiB / 32 KiB）。删除语义对齐 `dsh-archive-manager`：flush / detach live 会话 → 清投影缓存 → 只级联 `origin === 'subagent'` 子会话 → 清 spill → 删除 jsonl 转录目录（校验路径所有权，拒绝符号链接）→ 成功后清归档缓存与 workspace 记账 → 广播 `api-session/removed`。
- **渲染侧** `src/client/` — 侧栏入口 + 看板整页 + 项目详情（续接 / 归档 / 取消归档 / 永久删除 / 只读预览）+ 续接草稿注入 + 插件详情卡（侧栏入口、正文检索两个开关）。「运行中」取官方客户端会话快照 `ctx.sessions.list` 的 `running` / `runningSubagentCount` / `pendingInteraction`，与官方侧栏同源（宿主 `SessionStore.list()` 在常驻 webServer 里恒为空，不能作为真源）。
- **待办** — 会话内的 `todo/write` 由宿主写进投影缓存 `rows.todos`，插件的 `fs.watch`（400 ms 防抖）触发重建 → SSE 广播 → 前端刷新，本机实测 4 s 内可见（含宿主把缓存落盘的时间）；侧栏待办卡另有**人工待办**：输入即存 `localStorage`（`dsho-manual-todos`，按项目分组，最多 200 条），行内打勾删除，标「手动」与宿主待办区分——插件不伪造宿主 `todo/write` 事件，代价是换浏览器/清缓存会丢且不同步回会话。
- **搜索与待办** — 顶栏搜索先匹配项目名 / 会话标题 / 待办内容（本地、即时），再防抖 320 ms 走宿主**正文检索**：只认 `user/message`（且 `source.kind === 'user'`，排除插件注入）与 `assistant/message` 的 text part，每批 20 条串行流式扫描、不建索引不落盘，命中处给出码元级高亮区间；点命中项打开只读预览抽屉（无命中取最近 8 条，有命中取命中±2 起 8 条，单条 ≤ 2000 码元），**不激活会话、不调模型**。
- **批量与整理** — 详情页可多选会话批量归档 / 取消归档 / 永久删除，结果按「成功 / 跳过 / 失败」回报，失败项留在 `remaining` 里可重试；「整理闲置」按 7 / 30 / 90 天筛出搁置会话（排除运行中、等待交互、当前会话、已归档、没有可信活跃时间的），归档后当页可撤销。侧栏宽度为内容区的 1/4（`minmax(0, 3fr) minmax(260px, 1fr)`，1024 px 以下堆叠），待办正文独占整行、来源会话另起一行——原来 264 px 固定宽度只够 ~9 个汉字，等于每行都在断句。
- **诊断** — 顶栏琥珀色胶囊（有问题才出现）打开「数据诊断」抽屉，三段只读证据：投影缓存缺失 / 无标题（唯一动作是「打开会话」，让宿主自己重建——插件不写宿主缓存）、无主转录（cwd 也没有工作区，可归档或批量永久删除）、未登记但目录仍在（只给「打开会话」，不许删）、归档缓存残留计数。
- **测试** `tests/` — 53 用例（聚合规则、归档真相、R5 容错、成员表归属与 staleCwds、诊断分类、正文检索口径与高亮区间、预览窗口、批量契约、闲置整理、删除安全边界与归档缓存清理、运行中真源、待办解析、标题兜底、多帧 zstd、归属表并入与撤销、宿主路由集成），`npm test`。

已知缺口：真正没有任何 `user/message` 事件的空 live 会话只能显示「(无标题)」；`/state.liveSessionIds` 已移除，运行中状态完全依赖客户端快照，脱离 Web 客户端（如 CLI 场景）时退化为 2 小时时间窗；跨工作区移动会话（archive-manager 的 `moveSessionToWorkspace`，要动 zstd 帧与转录目录）尚未做。

安装 / 更新插件：改动后必须升版本 → `npm run build && npm pack` → 用 `plugin_manager install_bundle file:<绝对路径>.tgz` 安装（**不要**用 `link:` / `file:` 直链项目目录，pnpm 回滚会沿目录联接删掉项目本体）→ 校验 `node_modules/dsh-overview/lib` 哈希 → 刷新页面。

- **迁移（P4，v0.1.20）** — 「并入」只改插件归属表，宿主侧栏仍按转录头 cwd 把会话显示成「未分组」。要让宿主也认，只有一个办法：真正改写转录头里的 `cwd` 并搬到对应目录（`sessions/--<路径>--/<会话 id>/session.v4.jsonl.zstd`）。入口有两处：详情页旧路径提示条上的「迁移到本项目（N）」，以及孤儿项目里的「迁移过来」。约束都是硬的：**只重写首帧首行**（宿主每 append 写一帧，12 MB 的转录实测上万帧，整文件重压会改变体积与 mtime），其余帧逐字节保留；迁移前把原件复制到 `~/.dsh/storages/dsh-overview-migration-backup/<ts>-<会话 id>/`（含 `meta.json` 记 from/to/sourceFile）；新目录先写 `.stage-<pid>` 再原子 rename，回读校验 id 与 cwd 一致才删旧目录；目标目录已有同名会话则拒绝且不动原件；运行中的会话一律跳过（宿主可能正在追加写）；成功后把 id 补进宿主成员表（迁移后 cwd 已匹配，这次追加不会被过滤）。实测：12.4 MB / 上万帧的转录迁移耗时 24 ms，文件体积只差 3 字节。失败时半成品会被清掉，错误信息里带备份路径。
- **迁移与并入的分工** — 并入：只影响本插件的聚合与诊断，零宿主写入，可随时「取消并入」。迁移：影响宿主（侧栏、CLI、续接），会写宿主转录文件，一次性、需要重启应用才对宿主生效。两个动作在界面上分开摆放，确认框里都写明各自改什么。

- **空壳会话（v0.1.21）** — 在宿主里新建会话、一个字没输入就切走，宿主会把它从会话列表里摘掉，但**磁盘上的转录目录不删**：实测留下 318 B / 4 行（头 + `permission/preset` + `sandbox/mode` + `approval/*`），一条消息都没有。全景概览读的是磁盘，所以这类会话会一直在列表里出现，而宿主侧已经看不见它——两边「对不上」的根源在此。现在这类会话会带「空壳」标签，筛选菜单里有「清理空壳会话（N）」一键删（走同一条物理删除路由，运行中的自动排除），右栏变更卡也会报数量。判定方式：扫前 2 MB（`TITLE_SCAN_LIMIT`），读完整个文件且没出现任何 `user/message` / `assistant/message` 才算空壳；命中 2 MB 上限的一律不算（`complete: false`），宁可漏判也不误删有内容的会话。
- **子会话跟随母会话（v0.1.19）** — 子代理转录头里有 `parentSession`（宿主只在子代理头里写这个字段），而子会话的 cwd 常是 `~/.dsh` 或父项目的旧路径，按 cwd 归桶会让它们留在孤儿桶里当「无主转录」。现在归属顺序是：成员表 → 插件归属表 → cwd；落进孤儿桶的会话，只要能通过 `parentSession` 解析到「已经属于某个工作区」的父会话，就改挂到父会话所在项目（行上标 `子会话`，不往 `staleCwds` 塞 `~/.dsh` 这类噪声，也不再计入 `diagnostics.unclaimed`），父会话本身也可能是子会话，所以迭代到不动为止（上限 8 轮）。**父会话不在磁盘（或头里根本没有 `parentSession`）的子会话仍留在孤儿桶、仍算无主转录**——本机 9 个 `edict-*`/`npc-exec-*` 子代理就是这样：它们的头里没有 `parentSession`，数据上无从关联，不能靠猜。

- **界面口径（v0.1.22「Base 主页式工作台」）** — L1 首屏参照飞书多维表格主页（`my.feishu.cn/base`，实测还原设计语言）重做，配色从暖灰 + 靛蓝换成白底 + 冷灰 + 紫主色 `#8046F3`，深色走「底→卡→内嵌」三级明度（`#1B1C1F / #242528 / #2A2B30`）。**顶栏**：品牌 + 定宽搜索框（`⌘K / Ctrl+K` 聚焦，Esc 清空收起）+「新建项目」按钮 + 主题切换；原三枚状态胶囊删除——数字移入首屏统计卡，不再同屏两处口径。**首屏单屏**放下三块：① hero 对话框——选项目（下拉带运行中呼吸点）+ 输任务描述，回车走 `openWorkspace + queueResumeDraft` 在所选项目开新会话并把文字注入草稿（孤儿项目/无宿主服务时显示诚实提示条，不假装成功）；② 4 张数据前置统计卡（运行中 / 继续工作 / 待办 / 诊断），点击进入对应子屏（运行中会话卡、最近 7 天会话行、按项目分组的待办聚合——宿主 todo + 手动待办混合，可勾选/删除）；诊断卡点击仍开既有抽屉；③ 项目总览——密度卡（状态点 + 名称 + 最近 / mono 路径 / 近期活跃·待办·归档三格数字 / 最近会话页脚）与列表双视图 + 进行中/已归档/全部筛选，项目色 tile 按 id 哈希固定取色。**项目详情页结构不变**（KPI 带 + 下划线 tab + 3:1 双栏），随 token 自动换肤；「新建会话」主按钮、路径失效提示、待办添加等机制原样保留。旧 `Wall.tsx` 三格卡删除，新首屏在 `views/Home.tsx`（含内联 SVG 图标组件，插件仍零图标库依赖）。
- **界面细化与可访问性返工（v0.1.24）** — 一轮 22 条的版式/样式审计后落地：**横向栅格**顶栏拆成 `.wb-topbar` + `.wb-topbar-inner`（1680 居中 + 24px 沟槽，窄屏 16px），提示条补 `.wb-notewrap`，**详情页根节点补 `.wb-main`**（此前 L2 没有横向内边距，KPI 和会话列表贴到窗口边，和顶栏不在一条竖线）。**长文案溢出**：`.wb-ppath` / `.wb-qdesc` / `.wb-qlabel` 从 `<span>`（inline，`overflow` 不生效）改块级，`.wb-hint` / `.wb-kpi .d` / `.wb-proj-path` / 搜索结果副行补 `min-width:0`；全局 `.wb-root *{box-sizing:border-box}`——`.wb-srow` 的 `width:100%` 叠 6px 内边距曾把整行撑出容器 12px，就是之前探针里那 6px 横向滚动。**浮层**：项目下拉从向上弹改向下（900px 高窗口里原顶边被裁到 −71px），搜索下拉 `min(420px, 100vw − 48px)`、窄屏改 fixed 贴输入框。**交互密度**：会话行 5 个操作收进一个 `⋯` 菜单（24px 常驻槽位、点空白关闭、下方空间不够向上展开），hover 不再插入 128px 导致标题与时间戳跳动，行内 Tab 站点从 6 个降到 3 个。**设计 token**：辅助色压深到达标（`--wb-ink-3 #6A7078` 5.00:1、`--wb-surface-2` 上 4.62:1，`--wb-blue #1A67D6`、`--wb-amber #A45600`、`--wb-danger #C62C25`），圆角收成 6 档、阴影收成 5 档 token，字号阶梯从 12 档收敛到 7 档（10.5px 的中文小字统一升到 11.5px），补 `.wb-root button{font:inherit}`（此前 18 个按钮在用浏览器默认的 13.33px）。**主题**：宿主内改为挂在 `.wb-root[data-wb-theme]`，不再写 `document.documentElement`，`⌘K` 提示在 Windows 显示 `Ctrl K`，主题按钮改用 `sun`/`moon` 图标。实测 21 个 case（640/768/1024/1280/1440/1920 × 明暗 × 卡片/列表/下拉/搜索/菜单/历史态）无横向溢出、顶栏与内容同竖线、文字对比度最低 4.62:1。

## 常用命令

```sh
npm run snapshot                # 对真实 ~/.dsh 数据打印项目快照（--json / --project <词>）
npm test                        # 单元测试（node:test，无需额外依赖）
npm run check                   # TypeScript 类型检查
npm run build                   # 构建 lib/（tsdown + client bundle）
npm pack                        # 产出 tarball 供插件管理器安装
```

## 安装 / 更新

1. `npm run build && npm pack` → `dsh-overview-<version>.tgz`
2. 在 DSH 插件管理器安装该 tarball（本机用 profile `desktop`），并以新版本号发布，否则会报 `already-installed`。
3. **不要**用 `link:` / `file:` 直链本目录：pnpm 回滚会穿过目录联接删掉项目本体（2026-11-01 已实际发生一次）。

## 后续步骤

- P2 收尾：CI 里跑 `npm run build`（`npm test` 已在 CI），`npm run check` 纳入 CI
- P4：跨工作区移动会话（要重写 zstd 首帧 cwd 并原子搬迁转录目录，参考 `dsh-archive-manager` 的 `session-move.ts`）；会话收藏（需自持独立存储域，不能塞进宿主 workspace 结构）
- 参考项目里明确**不抄**的：Typert overlay 挂载（抢 `workspaceRegistry` 服务身份）、侧栏星标 DOM 织入（与三方皮肤冲突）、双入口同步、轮次统计类后台批量解压

