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

第 1–4 步已落地，v0.1.9 已安装在本机 `desktop` profile（`~/.dsh/profiles/desktop`），侧栏「全景概览」入口与整页视图可用：

- **数据层** `src/model/` — 四数据源只读聚合（`workspace.json` / `session.v4.jsonl.zstd` / `session_projcache` / 归档缓存）。归档真相取 `workspace.json` 的 `global.archivedSessionIds`；归档缓存只补元数据，已归档会话允许同时是 live 会话；只存在于归档缓存、没有转录文件且宿主未标记归档的孤儿记录会被丢弃（否则会以「无标题」幽灵行出现）。
- **宿主侧** `src/host/` — `GET /dsh-overview/state`、SSE `/dsh-overview/events`、`POST /dsh-overview/session/delete`（同源校验、body ≤ 8 KiB、未知会话幂等 skipped）。删除语义对齐 `dsh-archive-manager`：flush / detach live 会话 → 清投影缓存 → 只级联 `origin === 'subagent'` 子会话 → 清 spill → 删除 jsonl 转录目录（校验路径所有权，拒绝符号链接）→ 成功后清归档缓存与 workspace 记账 → 广播 `api-session/removed`。
- **渲染侧** `src/client/` — 侧栏入口 + 看板整页 + 项目详情（续接 / 归档 / 取消归档 / 永久删除）+ 续接草稿注入。「运行中」取官方客户端会话快照 `ctx.sessions.list` 的 `running` / `runningSubagentCount` / `pendingInteraction`，与官方侧栏同源（宿主 `SessionStore.list()` 在常驻 webServer 里恒为空，不能作为真源）。
- **测试** `tests/` — 19 用例（聚合规则、归档真相、R5 容错、删除安全边界与归档缓存清理、运行中真源），`npm test`。

已知缺口：R4 搜索仅匹配会话标题、不分组、不直达会话；R6 待办未接线（`todoCount` 恒 0）；少量真实 live 会话没有 projcache 标题，显示为「(无标题)」。

安装 / 更新插件：改动后必须升版本 → `npm run build && npm pack` → 用 `plugin_manager install_bundle file:<绝对路径>.tgz` 安装（**不要**用 `link:` / `file:` 直链项目目录，pnpm 回滚会沿目录联接删掉项目本体）→ 校验 `node_modules/dsh-overview/lib` 哈希 → 刷新页面。

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

- R4：搜索按项目分组、支持项目名 / 待办匹配、命中直达会话
- R6：从 `SessionMeta.todosRaw` 解析待办并显示明细
