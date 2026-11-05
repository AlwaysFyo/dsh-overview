# Agent Note: parent-session-attribution

Status: implemented

## Problem

子代理会话（origin=subagent）的 cwd 往往是 `~/.dsh`（宿主默认目录）或父项目改名前的旧路径，按 cwd 归桶会把它们丢进孤儿桶，并在 diagnostics 里被当成「无主转录」反复提示清理。用户因此问：并入项目时能不能把项目的子会话一起带进来？

## Decision

会话归属在成员表、插件归属表之后增加一步「跟随母会话」：`groupIntoProjects` 先把落进孤儿桶（workspaceId === null）的会话放进 `pending`，第一轮归属结束后用 `projectBySessionKey`（`sessionIdVariants` 双向登记）解析 `session.parentSession`，命中一个 workspaceId !== null 的项目就把会话从原桶 splice 出去、push 到父项目、`session.derived = true`、加入 `derivedIds`、重新登记。因为父会话本身可能是另一个子会话（多级委派），这一轮迭代到不动为止，guard 上限 8 轮。`derivedIds` 同时用于两件事：诊断里 `claimed` 判定（跟随成功的子会话不再进 `diagnostics.unclaimed`），以及把被子会话搬空的孤儿桶从 `projects` 里过滤掉（`workspaceId !== null || sessions.length > 0`）。derived 的子会话**不写进 `staleCwds`**——`~/.dsh` 是宿主默认目录，不是项目改名的痕迹，记进去会制造噪声。界面上这类会话行多一个 `子会话` 标签（title 说明「cwd 与本项目不同，靠母会话归到这里」）。

数据边界（负向保证）：只有转录头里真的写了 `parentSession` 的子会话才能跟随。本机 44 个转录里只有 7 个带这个字段（6 个 `D:\Projects\dsh-edict` 的子代理 + 1 个 dsh-fairy），另外 9 个 `edict-*` / `npc-exec-*` 子代理头里没有 `parentSession`，数据上无从关联——它们仍留在孤儿桶、仍算无主转录，插件不做启发式猜测（不按 id 前缀、不按时间邻近度、不按 cwd 相似度配对）。父会话自己也不在任何工作区时，子会话同样跟随不了，保持原状。

另一条明确不做的事：宿主侧栏把会话显示在「未分组」，是宿主按会话 cwd 解析工作区得到的标签，插件归属表影响不了它；只有重写转录头 cwd 的真正迁移（P4）能改变宿主视图，本决策只解决插件自己的聚合与诊断口径。
## Alternatives considered

**按 id 前缀猜父子关系**（`edict-*`、`npc-exec-*` 看起来像子代理）：这 9 个没有 `parentSession` 的会话确实都是子代理，前缀能猜出「它是子代理」，但猜不出「它是谁的子代理」——一个母会话可能派生多个子代理，前缀不带任何母会话信息。放弃。

**按时间邻近度配对**（子会话 createdAt 落在某母会话活跃区间内就挂过去）：D:\Projects\dsh-edict 里 6 个子代理的时间窗与两条母会话重叠，配错一次就会把会话挂到错误项目，而错误归属比「留在孤儿桶」更难被用户发现。放弃。

**把 ~/.dsh 整体并进某个工作区**：一次性把 9 条子会话塞进某个项目，但同时会把所有无关的 `~/.dsh` 会话（包括以后新建的）永久归到那个项目下，副作用不可控。放弃。

**重写转录头 cwd 让宿主也认**（P4 真迁移）：能同时修好宿主侧栏的「未分组」，但要在 14 MB 转录上重压 zstd 首帧、原子搬目录、回滚，风险与工作量都远大于本次问题；没有用户明确授权不做。
## Consequences

代价：`buildState` 的归组多了一轮迭代与一张 `projectBySessionKey` 表（内存开销可忽略，但归属逻辑多了「父会话可能还没归位」这一层时序，读代码要理解 guard 循环）；`SessionMeta` 多了 `parentSession` 与 `derived` 两个字段，mock 与测试工厂都要补默认值。收益：子代理不再污染「无主转录」诊断（本机 unclaimed 从 23 降到 10），多级委派的子会话能一次归位；同时把「孤儿桶可能是空壳」这个副作用一并修掉。覆盖缺口：没有 `parentSession` 的 9 个子代理仍无主，需要宿主以后在转录头里补这个字段（或 P4 迁移）才能真正归位；测试用 3 个用例覆盖守护（跟随成功、父会话缺失、孤儿桶被搬空），没有覆盖多级委派链。

