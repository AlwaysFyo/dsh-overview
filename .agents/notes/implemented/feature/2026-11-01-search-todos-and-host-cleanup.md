# Agent Note: search-todos-and-host-cleanup

Status: implemented (v0.1.11)

## Problem

P0/P1 收尾前，工作台有三处缺口：① 宿主侧留着调试期的服务探针与 `/_debug` 路由（暴露内部服务结构、约 130 行死代码），`/state` 还返回一个恒为空的 `liveSessionIds`；② SSE 没有心跳，代理/休眠断链后前端无感，重连后也不主动刷新；③ R4 搜索只匹配会话标题、不分组、点击只跳项目；R6 待办完全没接线（`todoCount` 恒 0），未命名会话只能显示「(无标题)」。

## Decision

- **R4 搜索**：`src/client/SearchHit.ts` 导出 `searchWorkbench(state, query, limit=24): SearchGroup[]`，对项目名、会话标题、`session.todos[].content` 三路做小写 includes 匹配，按项目分组（最多 8 组 / 24 条），`highlightTitle` 负责 `<mark>` 切片。`App.tsx` 的 `openHit` 优先 `getUiWorkspace()?.openSession(hit.sessionId)` 直达会话，拿不到服务时退回 `openProject`。弹层按项目分组渲染，副标题标注「项目/会话/待办 · 会话标题」。
- **R6 待办**：模型层把 `rows.todos.val` 解析为 `SessionMeta.todos: SessionTodoItem[]`（`extractTodoItems`：非数组→[]、空 content 丢弃、未知 status 归 `pending`），不再保留 `todosRaw`。`api.ts` 的 `todoCount` 统计非 completed，`projectTodos` 汇总项目内未完成待办并把 `in_progress` 排前；详情页侧栏列出「状态点 + 内容 + 来源会话」，会话行显示未完成数，指标卡副标题显示进行中条数。**只读聚合**：不写 `todos.json`、不做手动添加或勾选回写。
- **标题兜底**：`readSessionTitleFallback(file)` 流式扫描前 2 MB 解压内容，取首条 `user/message` 的 `data.content[].type==='text'` 文本，折叠空白并截断到 60 字（超长加 …），结果按文件指纹缓存（失败也缓存 null）。`buildState` 在会话头合并后对 `source==='live' && !title` 的会话调用它，projcache 标题存在时绝不覆盖。
- **宿主瘦身**：`src/host/index.ts` 删除 `probeServices`/`sampleSessionService`/`extractFirstId`/`collectSessionIds` 与整条 `/_debug` 路由；`/state` 改为惰性单飞 `buildOnce()`（并发请求共用同一个 building Promise），响应不再含 `liveSessionIds`；`/events` 每 25 s 写 `: ping <ts>` 注释，客户端 `close` 时清 interval 并移出订阅集合；`App.tsx` 监听 `hello` 事件后主动 `refresh()`。
- 负向保证：`/state` 仍是只读快照接口；删除路由的同源校验、8 KiB body 上限、未知会话幂等 skipped 语义不变；搜索不建索引、不读会话正文（只读已聚合的标题与待办）。

## Alternatives considered

**继续用宿主 `SessionStore.list()` 提供运行中列表**：常驻 webServer 里恒为空，已证明不可用；运行中真源改为客户端 `ctx.sessions.list` 快照后，`/state.liveSessionIds` 已无存在意义，删掉避免两个真源打架。**保留 `/_debug` 作为运维探针**：它把内部服务原型方法名直接吐给任意同源请求，且调试期已结束，删除比加权限更简单。**搜索建倒排索引 / 读会话正文做语义搜索**：本机仅几十个会话，实时 includes 扫描已足够；语义搜索属于 R11，需要独立索引层，不在 P0/P1 范围。**待办走宿主 todo 工具事件并支持勾选回写**：Q3（事件是否可订阅）未验证，且当前需求只是「看见待办」，先做只读聚合，写回留给后续 R6 完整版。**给空会话编造标题（如「空会话 · 12:31」）**：会掩盖真实数据状态，保留「(无标题)」并在 README 说明这些是没有任何 user/message 的空会话。

## Consequences

代价：`/state` 不再提供宿主视角的运行中列表，任何脱离 Web 客户端的消费者（CLI、脚本）只能退回 2 小时时间窗判断；宿主侧少了一个可直接 curl 的调试入口，后续排查只能看 `src/cli.ts` 的快照输出；搜索仍然是 O(会话数 × 待办数) 的实时扫描，会话数上千时需要重新评估。收益：`/state` 载荷去掉恒空字段、host 少约 130 行死代码，内部服务原型不再泄露；SSE 断链后前端会因心跳缺失/重连 hello 主动刷新，不再显示过期数据；R4/R6 在 PRD 里从「未接线」变为「只读闭环」，搜索命中可直接进会话。未覆盖：待办勾选回写、手动添加、会话正文语义搜索仍未实现；本机 7 条无任何 user/message 的空会话依旧显示「(无标题)」（已在 README 已知缺口说明）。