# dsh-workbench 设计方案

> 以工作区项目为维度的 dsh harness 工作台插件，聚合项目状态、会话历史与任务。

> **2026-11-01 状态**：PRD v0.3 已定稿（`docs/dsh-workbench-prd.html`，UI 原型见 `docs/dsh-workbench-ui.html`），本文档部分内容已被其取代，以 PRD 为准：
> 1. **托管方式**：改为 DSH 桌面端插件宿主内嵌视图（webview）；独立本地 server（REST+SSE）降级为宿主不支持 webview 时的兜底方案。
> 2. **待办看板与手动任务已砍掉**：工作台定位收敛为"项目仪表盘 + 续接入口"，不是 TODO 工具——待办靠会话推导，只勾选不新建。
> 3. **数据源以 PRD §6 为准**：`~/.dsh/storages/workspace.json`（含 sessionIds / archivedSessionIds / pinnedSessionIds）、`~/.dsh/sessions/<工作区路径编码>/`、归档缓存 `session_projcache_archive_manager_v2`、`.dshw-usage.json`。
> 4. **MVP 范围以 PRD §5 P0（R1–R5）为准**；插件不再有自有状态文件（原 `status.json` 方案已撤销），唯一写入是用户在详情页显式触发的会话永久删除，经宿主 `sessionPersistence` / `workspaceRegistry` 服务完成（语义与宿主自身删除一致，见 PRD R2 变更说明）。
>
> 本文件此前的原始架构设计（2026-10-31 首版）在项目目录事故中丢失；现行有效的实现事实以本说明 + 代码注释 + 记忆为准。关键已验证事实：
>
> - **实际存储**（本机探查，2026-11-01 复核）：`workspace.json` 顶层 `global` 含 `archivedSessionIds`（本机 3 条）与 `pinnedSessionIds`，这是**归档真相**；此前「该字段不存在」是漏看 `global` 导致的误判。`session_projcache_archive_manager_v2/sessions/` 只是归档时的投影快照（本机 32 条），用作元数据兜底，已归档会话允许同时是 live 会话。标题/token/待办都在 `session_projcache/sessions/<uuid>.json` 的 `rows.*`；会话体 `session.v4.jsonl.zstd` 用 Node 24 原生 zstd 可解。
> - **关联键**：projcache ↔ 会话文件用 `(归一化cwd, createdAt)`（46/47 命中）；会话 ↔ 工作区用归一化路径。
> - **插件体系**（官方文档 + browser-dock/dsh-better-sidebar 实证）：bundle 包 = package.json `dsh.bundle.patch` + cordis.patch.yml；`dsh.client` 块声明渲染端入口；宿主侧 `ctx.inject(['webServer'])` 注册 REST/SSE；渲染侧 slots 注入 React。
> - **架构**：单 bundle 包，`src/model`（数据层）/ `src/host`（宿主侧）/ `src/client`（渲染侧）。
