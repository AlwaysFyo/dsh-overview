> **已部分取代**：「并入工作区」的写入目标已由本 note 的 `workspace.json` 改为插件归属表，原因见 [2026-11-01-adopt-via-plugin-alias.md](./2026-11-01-adopt-via-plugin-alias.md)（真机否证：写宿主的 sessionIds 会被下一次宿主写入抹掉，且读取时按 cwd 过滤）。人工待办部分仍然有效。

# Agent Note: adopt-workspace-and-manual-todos

Status: implemented

## Problem

用户把 `D:\\Projects\\dsh-edict` 改名为 `D:\\Projects\\dsh-onenpc` 后，旧项目下的 9 个会话在「全景概览」里消失——它们既不在任何工作区的 `sessionIds` 里（宿主新建了工作区，旧条目连同成员关系一起没了），cwd 又指向已经不存在的旧路径。前一版只做了「成员表优先、cwd 兜底」的读取侧归属，对这批会话无从生效：数据里根本没有它们属于新工作区的证据。用户的原话是「这个我怎么感觉你什么都没改」，所以要的不是更好的推断，而是一个能真正修好的动作。同一轮用户还要求「人工添加待办」，而插件的既有边界是「对宿主数据零写入」。

## Decision

新增 `POST /dsh-overview/session/adopt`（`src/host/adopt.ts` 的 `adoptSessionsIntoWorkspace(home, workspaceId, sessionIds)`）：把选中的孤儿会话 id 追加进 `workspace.json` 的 `tables.workspaces[<id>].sessionIds`，**只改这一个字段**——不动 `archivedSessionIds`、不动转录文件、不动投影缓存。写入约束：工作区必须已存在（否则 500 且不写文件）；已存在的 id 幂等跳过并计入 `alreadyThere`；跟随目标工作区现有写法补 `session-` 前缀，避免同一会话两种 id 并存；写前 `copyFileSync` 出 `workspace.json.bak-<ts>`；写 `.tmp-<pid>` 再 `renameSync`；写完回读校验 `sessionIds` 真的含新 id，失败即报错（备份保留）。触发面只有详情页孤儿项目上的「并入工作区」选择器（`state.projects` 里 `workspaceId !== null` 的项目），先 `confirm` 说明「只追加成员表、不动文件、会备份」。同轮新增的**人工待办**同样不写宿主：`localStorage` 键 `dsho-manual-todos`（按 projectId 分组、单项目上限 200 条、单条 ≤ 200 字符），行内打勾/删除，标「手动」与宿主 todo 区分——插件不伪造 `todo/write` 事件，代价是换浏览器/清缓存即丢且不同步回会话。
## Alternatives considered

**按 cwd 相似度自动并入**（同父目录、basename 前缀/编辑距离）：`D:\\Projects\\dsh-edict` → `D:\\Projects\\dsh-onenpc` 这种改名在机械上不可识别，误并会把不相关的会话塞进别人的项目，用户还看不出错了；错一次就再也不敢用。<br>**插件本地维护一张「旧路径 → 工作区」别名表**（只存在插件自己的存储里，渲染时合并）：能不碰宿主数据做到「看起来修好了」，但宿主侧栏、`dsh --resume`、归档等处仍然认为这些会话无主，两套真相长期并存，用户点开会话时归属还会跳变。<br>**默认把孤儿会话按 cwd 直接展示在最近修改的工作区下**：等于猜，且会让「孤儿」这个诊断分类失去意义。
## Consequences

代价：插件从「完全只读」变成「有两个显式写入口」，README / 宿主注释 / 本 note 都必须写清楚边界，否则下一个人会以为可以随手写 workspace.json；`/session/adopt` 成功后会触发一次全量 rebuild，且备份文件会在 `~/.dsh/storages` 下累积（每次并入一份，未做自动清理）。收益：项目改名/搬迁这个真实场景终于有可执行的补救动作，而且改的是宿主认的真相，宿主侧栏与插件看到的是同一份成员表。给用户的话术要写死：这是显式动作，不是自动识别。

