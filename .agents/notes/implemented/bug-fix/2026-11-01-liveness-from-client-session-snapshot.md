# Agent Note: liveness-from-client-session-snapshot

Status: implemented

## Problem

看板的「运行中」状态点长期点不亮：宿主侧 `SessionStore.list()` 在常驻 webServer 上下文里返回空数组，`liveSessionIds` 恒为 `[]`，`splitSessions` / `projectLiveness` 只能退化为「2 小时内有活动」的时间窗猜测。Q2 一度被判为「宿主服务不可用」，实际是取错了数据源。

## Decision

运行中的真源改为官方客户端会话列表 `ctx.sessions.list`（Observable）的快照 `byId`：`running === true`、`runningSubagentCount > 0`、或 `pendingInteraction != null` 三者任一即算运行中。`src/client/liveness.ts` 把该 Observable 适配成模块级快照（`subscribeLiveness` / `getLivenessSnapshot`），`ready` 标记是否成功绑定；`src/client/plugin.tsx` 在 `inject` 中加入 `sessions` 并用 `ctx.effect` 绑定，`App.tsx` 用 `useSyncExternalStore` 消费，`ready` 时以客户端快照为准（空数组也是权威结果），未绑定（dev 沙盒/旧宿主）时才回退 `state.liveSessionIds`。`splitSessions` / `projectLiveness` 的 `liveIds` 参数放宽为 `readonly string[] | null`。宿主 `/state` 的 `liveSessionIds` 字段保留但不再是 UI 真源。
## Alternatives considered

**继续挖宿主 SessionStore 语义**：宿主安装目录不可读，只能靠运行时探针，且常驻 webServer 没有 enter 过任何会话，探到的 `list()` 始终为空——投入产出比差。**用文件 mtime 轮询当运行中**：会把「刚写完一轮的会话」误报为运行中，且无法表达等待审批的挂起态。**让宿主侧订阅 api-session 事件自行维护活跃集合**：需要猜事件名与载荷，而客户端快照已经是官方侧栏同源数据。
## Consequences

代价：运行中判定依赖客户端服务存在性，`sessions` 服务缺失时静默回退时间窗；快照订阅增加一个跨组件订阅点。收益：状态点、卡片「运行中 N」胶囊、详情三 tab 与官方侧栏完全一致，挂起待审批的会话也显示为活跃；`tests/liveness.test.ts` 用 19 个用例中的 4 个覆盖纯函数与绑定/解绑，无需真实宿主。

