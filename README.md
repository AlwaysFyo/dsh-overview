# dsh-workbench

DSH（DeepSeekRuntime）工作台插件：以工作区项目为维度的会话 / 任务仪表盘。

- 设计与决策：[docs/design.md](docs/design.md)
- 需求基线：[docs/dsh-workbench-prd.html](docs/dsh-workbench-prd.html)（PRD v0.3，含 R2 实现变更说明）
- UI 原型：[docs/dsh-workbench-ui.html](docs/dsh-workbench-ui.html)

## 当前状态

第 1–4 步已落地，v0.1.1 已安装在本机 `desktop` profile（`~/.dsh/profiles/desktop`），侧栏「全景看板」入口与整页视图可用：

- **数据层** `src/model/` — 四数据源只读聚合（`workspace.json` / `session.v4.jsonl.zstd` / `session_projcache` / 归档缓存）。归档真相取 `workspace.json` 的 `global.archivedSessionIds`；归档缓存只补元数据，已归档会话允许同时是 live 会话；只存在于归档缓存、没有转录文件且宿主未标记归档的孤儿记录会被丢弃（否则会以「无标题」幽灵行出现）。
- **宿主侧** `src/host/` — `GET /dsh-workbench/state`、SSE `/dsh-workbench/events`、`POST /dsh-workbench/session/delete`（同源校验、body ≤ 8 KiB、未知会话幂等 skipped）。删除语义对齐 `dsh-archive-manager`：flush / detach live 会话 → 清投影缓存 → 只级联 `origin === 'subagent'` 子会话 → 清 spill → 删除 jsonl 转录目录（校验路径所有权，拒绝符号链接）→ 成功后清归档缓存与 workspace 记账 → 广播 `api-session/removed`。
- **渲染侧** `src/client/` — 侧栏入口 + 看板整页 + 项目详情（续接 / 归档 / 取消归档 / 永久删除）+ 续接草稿注入。
- **测试** `tests/` — 14 用例（聚合规则、R5 容错、删除安全边界），`npm test`。

已知缺口：R4 搜索仅匹配会话标题、不分组、不直达会话；R6 待办未接线（`todoCount` 恒 0）；`liveSessionIds` 恒为空（宿主 `SessionStore.list()` 返回空，运行中状态点退化为时间窗）；client 仍有 TEMP-DEBUG 探针待清理。

## 常用命令

```sh
npm run snapshot                # 对真实 ~/.dsh 数据打印项目快照（--json / --project <词>）
npm test                        # 单元测试（node:test，无需额外依赖）
npm run check                   # TypeScript 类型检查
npm run build                   # 构建 lib/（tsdown + client bundle）
npm pack                        # 产出 tarball 供插件管理器安装
node scripts/probe-*.mjs        # 存储结构探查脚本（调研用）
```

## 安装 / 更新

1. `npm run build && npm pack` → `dsh-workbench-<version>.tgz`
2. 在 DSH 插件管理器安装该 tarball（本机用 profile `desktop`），并以新版本号发布，否则会报 `already-installed`。
3. **不要**用 `link:` / `file:` 直链本目录：pnpm 回滚会穿过目录联接删掉项目本体（2026-11-01 已实际发生一次）。

## 后续步骤

- R4：搜索按项目分组、支持项目名 / 待办匹配、命中直达会话
- R6：从 `SessionMeta.todosRaw` 解析待办并显示明细
- Q2：查清宿主 `sessions.list()` 为空的原因，让运行中状态点真实可用
- 发布收尾：清 TEMP-DEBUG、初始化 git、补 README / PRD 状态
