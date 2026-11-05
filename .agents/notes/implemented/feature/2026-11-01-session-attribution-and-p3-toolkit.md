# Agent Note: session-attribution-and-p3-toolkit

Status: implemented

## Problem

用户报告两件事：项目改名或搬目录后，原来的会话和待办「丢了」；详情页右侧待办列太窄，中文每行只能塞 ~9 个字。同时 P3 待办要求复刻 dsh-archive-manager 的检索/预览/批量/诊断/整理。根因是 buildState 只按 normalizePath(session.cwd) 归桶，完全没用 workspace.json 的 workspaces[*].sessionIds（权威成员表），项目改名后会话就掉进 orphan 桶，待办数、会话列表、指标同时归零；宽度则是 .wb-cols 固定 264px 且待办行把「内容」和「来源会话」挤在同一行。

## Decision

会话归属改为「成员表优先、cwd 兜底」。groupIntoProjects 先用 ws.sessionIds 建 ownerByKey（经 sessionIdVariants 双向登记 `xxx` 与 `session-xxx` 两种写法，先到先得，冲突记 warning），命中即归该工作区，并把与 owner.path 不一致的 session.cwd 收进 ProjectState.staleCwds 供 UI 提示；未命中才退回 cwd 归桶/建 orphan 桶。workspace.json 与 global.archivedSessionIds 里的 id 带 `session-` 前缀而转录头 set.head.id 不带，这个差异由 paths.sessionIdVariants 统一抹平。\n\n诊断（Diagnostics）只归纳证据、不修复：cacheIssues 记录 live 但无标题的会话（区分 no-record / no-title），unclaimed 记录不在任何成员表的 live 未归档会话，staleArchiveRecords 记录被丢弃的归档幽灵记录。unclaimed 带 pathRegistered 布尔：cwd 仍对应已注册工作区的是「只是没登记」（UI 只给「打开会话」，打开一次宿主就会重新登记），只有 pathRegistered=false 的才叫无主转录，才允许归档或批量永久删除。实测本机 26 条 unclaimed 里有 2 条 pathRegistered=true，若一刀切当垃圾就会真丢数据。\n\nP3 能力（全部走既有硬边界：插件不写宿主数据、不激活会话、不调模型）：/dsh-overview/search 只认 user/message（且 data.source.kind==='user'，排除插件注入）与 assistant/message 的 text part，20 条一批串行流式扫描，不建索引不落盘，返回码元级 ranges 供前端 <mark>；/dsh-overview/preview 有命中取命中±2 起 8 条、无命中取最近 8 条、单条 ≤2000 码元；批量删除与批量归档共用 model/batch.ts 的 BatchResult{requested,succeeded,skipped,failures,remaining}，串行、单条失败继续、remaining 只含失败项；闲置整理 idleCandidates 排除 archived/当前会话/live/pending/无可信 lastActivityAt，归档后仅当页可撤销。前端新增只读预览抽屉、数据诊断抽屉、顶栏琥珀胶囊（有问题才出现）、插件详情卡（plugins.bundle.config，两个 localStorage 开关）。\n\n宽度：.wb-cols 由固定 `264px` 改为**内容区 1/4**（`minmax(0, 3fr) minmax(260px, 1fr)`，1024px 以下堆叠）。定 1/4 而不是 1/3 的依据是本机真实数据：25 条待办里中位数 31 字、p90 65 字，1/4 在 1440 窗口上约 360px（≈24 字/行）够中位数两行读完，而 1/3 在 1920 上是 640px（45+ 字/行），单列待办撑不住那种行长、还要从主列拿走 200px。260px 是下限，避免窄窗口把待办压到不可读。同时待办行改为块级布局——正文独占整行（.f-txt），来源会话另起一行（.f-w）单行省略，圆点只由 CSS ::before 画（原来 React 还渲染了一个 .wb-dot，所以每行两个点）。
## Alternatives considered

**认 workspace.json 的 cwd 为准，改名时提示用户手动重登记**：治不了本，用户遇到的正是「cwd 变了但成员表没变」，宿主自己的成员表才是真相源。\n**在插件里回填 ws.sessionIds（把按 cwd 找到的会话写回宿主）**：违反「插件对宿主数据零写入」的硬边界，而且写错就是永久脏数据。\n**把所有 unclaimed 都当子代理垃圾一键清理**：本机实测有 pathRegistered=true 的真会话混在里面，会误删；拆成两类后删除面收窄到「彻底无主」。\n**照抄 archive-manager 的 Typert overlay 挂 workspaceRegistry**：会抢宿主服务身份、和已装的 archive-manager 冲突，收益只是少写几条 HTTP 路由。\n**正文检索建持久全文索引**：写盘、要做失效与迁移，与「只读、无自有状态文件」的设计冲突；串行流式在 49 会话/58MB 规模下延迟可接受。\n**1/3 宽度**：一度考虑把右栏做成 1/3 去容纳长待办，但 1920 宽屏上会到 640px（45+ 字/行）且从主列抢走 200px；实测 p90 只有 65 字，1/4 已能把中位数压到两行，收益不抵代价。
**clamp(300px, 26vw, 380px) 的视口比例**：先落地过一版「26vw + 上限 380」，问题是在 1440 上等于 1/4、在 1920 上只有 20%，同一份数据在不同屏幕上行长不一致；改成 1/4 的内容区比例后行长稳定。
**用 input[type=date] 或第三方组件做时间筛选**：本轮不做时间范围筛选，闲置整理用 7/30/90 天下拉即可。
## Consequences

代价：①每次重建多一轮 ws.sessionIds 遍历与归属表构建（可忽略），但 staleCwds/conflicts 让 ProjectState 多两个字段，所有构造 ProjectState 的地方（mock、测试 fixture）都得补齐；②diagnostics 成为 WorkbenchState 必填字段，/state 契约变更，旧客户端读到新宿主没问题、新客户端连旧宿主会崩在 state.diagnostics——所以版本必须一起升（0.1.11→0.1.12）；③正文检索是 CPU/IO 型操作，靠防抖 320ms + AbortController + limit 100 兜住，没做取消后的服务端协作式中断（streamLines 收到 abort 才停）；④侧栏更宽后主列变窄，1024 以下就得堆叠，窄窗口下待办区会掉到主列下方。收益：项目改名/搬目录不再丢会话与待办，且能看见「旧路径」证据；检索、预览、批量、整理、诊断五项在真实 ~/.dsh 数据上跑通（38 个测试全绿，含 5 例宿主路由集成测试）。已知未做：跨工作区移动会话（要重写 zstd 首帧 cwd 并原子搬运转录目录）、会话收藏。

