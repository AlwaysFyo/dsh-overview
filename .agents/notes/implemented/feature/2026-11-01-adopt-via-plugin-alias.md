# Agent Note: adopt-via-plugin-alias

Status: implemented

## Problem

v0.1.14 的「并入工作区」是把会话 id 追加进宿主 `workspace.json` 的 `tables.workspaces[*].sessionIds`。用户实测：并入成功后再删除任意一个会话，并入结果整个回退。原因是宿主的成员表以内存为准——插件改文件宿主不知道，宿主下一次成员表写入就用自己的旧列表覆盖；而且宿主读成员表时会按 cwd 过滤（`@deepseek-ai/dsh-workspace` 的 `sessionIds` 文档明确写「canonical cwd mismatches are never returned」），项目改名后会话 cwd 与新工作区 path 天然不一致，所以这条路从一开始就不成立。

## Decision

「并入工作区」改为写插件自己的归属表 `~/.dsh/storages/dsh-overview-aliases.json`（`{ version: 1, cwds: { <normalizePath(旧 cwd)>: <workspaceId> } }`），而不是宿主的 `workspace.json`。`POST /dsh-overview/session/adopt` 现在接收 `{ workspaceId, cwd }`（`forget: true` 表示撤销，此时不需要 workspaceId），写入走 tmp + rename + 回读校验；`buildState({ home, aliases })` 在成员表查不到时按 `normalizePath(session.cwd)` 查归属表，命中就归到该工作区并把这条 cwd 记进 `project.staleCwds`，同时把对应会话从「无主转录」诊断里排除（避免同一批会话既显示已归属、又反复催清理）。指向不存在工作区的陈旧条目按未命中处理，退回孤儿桶，不静默丢会话。UI 上 stale 提示里多了「取消并入」，动作全部需要用户确认。**负向保证**：不写宿主 `workspace.json`、不动转录文件、不改归档集合；归属表损坏时读作空表而不是抛错。
## Alternatives considered

**往 `workspace.json` 的 `sessionIds` 追加 id**（v0.1.14 的做法，用户真机验否）：宿主成员表是内存真相，文件里追加的 id 宿主不知道；下一次任何成员表写入（哪怕只是删掉别的会话）宿主都会用内存里的旧列表覆盖落盘，追加当场消失。更根本的是宿主读成员表时就按 cwd 过滤，让改名后的会话永远显示不出来。<br>**调宿主的 `attachSession` / `insertSessionBefore`**（`dsh-workspace` 的实体方法）：它们显式要求会话头 cwd 等于工作区 path，正是改名场景不成立的条件，调用会被拒绝且不写盘。<br>**重写转录头的 cwd 再挂成员表**：这才是「真正修好」，但要重压缩 zstd 首帧并原子搬迁目录（archive-manager 的 `session-move.ts` 那套），风险与工作量都属于 P4，不该混在显示归属的修复里。
## Consequences

代价：这批会话在宿主侧栏、`dsh --resume` 会话列表里仍然看不到，插件与宿主在「谁属于这个项目」上有两套真相；归属表是插件私有状态，用户的另一台机器/清空 `~/.dsh/storages` 后就没了（可重新点一次并入）。收益：并入变成一次性、可撤销、不碰宿主数据的动作，删除任何一个会话都不会再把它冲掉——这是用户报的那个 bug 的直接解。后续若做 P4 的 move，应把归属表里的 cwd 当作搬迁候选，搬完删除对应条目。

