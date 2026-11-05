# 参考拆解：@michengai/dsh-archive-manager → dsh-overview 可复刻清单

> 分析对象：`_refs/dsh-archive-manager`（v1.1.22，Apache-2.0，npm 已发布，86 个版本约 2.5 个月）。
> 目的：为 README「后续步骤 · P3」给出经过对照的取舍，而不是照单全收。
> 结论先行：**值得抄的是「诊断/检索/批量」三类能力 + 一整套工程纪律；不值得抄的是 Typert overlay、DOM 织入与双入口。**

## 1. 参考项目画像

| 维度 | 事实 | 对我们的含义 |
| --- | --- | --- |
| 规模 | `src/client.ts` 4053 行**单函数** `startArchiveClient`，`src/workspace.ts` 1349 行 | 反例：一个插件把 UI 全塞进单函数，后期只能靠 region 注释导航。我们已按 `App/views/*` 分文件，保持住 |
| 分层 | `contracts.ts`（边界收窄）/ `host-compat.ts`（宿主类型本地化）/ `client-compat.ts`（只声明消费到的客户端能力）/ 各 `*-ui.ts`（页面级 controller） | 正面：值得照抄的分层与命名 |
| 测试 | ~40 个 `node:test` 文件，含 `test/fixtures/{latest-host,isolated-host}.mjs`、`scripts/test-version-matrix.mjs` | 正面：对抗宿主 API 漂移的隔离 fixture |
| 发布 | `CHANGELOG` 每版记录「删除了什么 + 为什么删」 | 正面：减法文化 |
| 负向承诺 | README 明写「无全文索引 / 每批 20 条 / 无延迟保证 / 关页面即失去撤销」 | 正面：把限制写成契约 |

## 2. 可直接复刻（按 ROI 排序）

### 2.1 【高】正文检索 + 只读预览 — `src/archive-discovery.ts`

现在我们只搜项目名 / 会话标题 / 待办（`src/client/SearchHit.ts`），这是最明显的体验缺口。

参考实现的可抄细节：

- **正文口径**：只取 `user/message` 与 `assistant/message`；`user` 还必须 `source.kind === "user"`，否则丢弃——这一条排除了插件注入、工具输出、推理草稿，是搜索质量的命门。
- **批次**：一次 20 个会话、批内串行、批间可被 `AbortSignal` 取消、`onProgress` 回报进度；查询上限 200 字符。
- **高亮**：`findTextRange` 做大小写折叠后的**码元区间映射**，`sliceWholeCharacters` 避免切断代理对（emoji）。
- **预览**：`previewConversation` 无命中取最近 8 条；有命中取命中 ±2 起共 8 条；单条截 2000 UTF-16 码元。
- **诚实边界**：不建索引、不做语义搜索、改变筛选只能停掉「后续批次」而停不掉「正在读的那批」。

落点：新增 `src/model/contentSearch.ts`（纯函数，可单测）+ 复用现有 `/state` 的会话清单做候选集；预览走详情页抽屉，不新开路由。
收益：一份实现同时覆盖 live 与归档，直接把 README P3 的「归档内容搜索」并掉。

### 2.2 【高】投影缓存诊断 + 按需重建 — `src/cache-rebuild*.ts`

我们已知缺口正是它的目标场景：7 条 live 会话没有 projcache 标题，只能显示「(无标题)」。参考项目把这件事做成了「缺失/不兼容才出修复卡 → 点一次用官方 `coldSnapshot` 修 → 有界回读确认」。

可抄的判定与安全阀：

- 只对**普通冷会话**出手：排除 `im:` 前缀、排除 live、排除 `waterfall('workspace/session-activity')` 非空的会话。
- `cacheIdentity(header) = JSON.stringify([version, createdAt, cwd, isSeeded])` 作为**生命周期见证**：动手前二次校验，避免修到一半会话被改写。
- 写后确认：`confirmColdCacheWrite` 轮询回读（100 × 20ms）才敢报成功。
- 失败项单独保留供重试；列表刷新失败单列 `refreshError`，不把「已成功写入」误报成失败。

落点：`src/host/cacheDiagnose.ts`（只读判定，进 `/state` 作为 `cacheIssues` 字段）+ `POST /dsh-overview/cache/rebuild`（逐条、单飞、8 KiB body、同源校验）。
收益：把「(无标题)」从产品缺陷变成可一键修复的状态，同时不引入自有索引文件。

### 2.3 【中高】批量操作契约 + 逐项重试 + 撤销 — `src/contracts.ts` / `archive-organizer.ts`

别自己发明返回形状，直接照抄这个：

```
BatchResult = { requested, succeeded, skipped, failures[], remaining[], refreshError? }
```

- `remaining` **只含失败项**（供「重试失败项」按钮），不是全量。
- 串行执行、单条失败继续、写入前重新取快照复核（`createSessionOrganizer` 的做法）。
- 选中态要能算出**隐藏选中数**（筛选后不可见的已选项），批量确认前必须提示。
- 「撤销本次归档」只在当前页面存活期间有效——这个诚实的短命边界比假装持久化更好。

落点：`src/model/batch.ts` + 现有 `deleteSessionArtifacts` 复用；`/session/delete` 扩为接受数组（仍保持 8 KiB 上限、逐项报告）。

### 2.4 【中高】孤儿子代理检测与回收 — `workspace.ts` 的 `diagnoseOrphanSubagents`

判定条件（三路取证，缺一不可）：

1. `origin === "subagent"` 且 `parentSession` 非空；
2. 自身不是 live；
3. 母会话既不在 `knownIds`/live 集合里，**且**物理工件确实缺失（`sessionArtifactMissing` 用 findLog → 扫各 project 目录 → stat 兜底三路确认）。

返回 `{ count, items[{sessionId,parentSessionId,createdAt,sizeBytes}], totalSizeBytes }`，UI 展示磁盘占用再一键回收。

我们已经有对齐的 `deleteSessionArtifacts`（只级联 `origin==='subagent'`，绝不级联 fork），所以这条基本是「判定器 + 批量调用」，成本低于看上去。

### 2.5 【中】闲置会话整理 — `archive-organizer.ts` 的 `idleArchiveCandidate`

- `days ∈ [1, 36500]` 整数；无有效活跃时间的一律排除。
- 保护集：收藏、当前会话、`running`、`runningSubagentCount > 0`、`pendingInteraction`、`pending`、`retainedBy.mainView > 0`。
- 先出候选让用户逐个取消勾选，再确认；归档走宿主 `archiveSession`（我们已委托宿主，不新增写路径）。
- 明确负向：不做定时/后台自动清理。

### 2.6 【中】`plugins.bundle.config` 配置卡 + 能力探测式挂载 — `src/sidebar-entry.ts`

我们现在是「无条件连点」三个 slot。参考项目更稳：

- 先 `ctx.slots.inject("main" | "sidebar.panellist", cb)`，**回调被调用**才认为该 slot 存在，缺了就静默不挂。
- `ctx.inject(["layout"])` 拿 `layout.selectPanel(id|null)`，关闭入口时若正停在本面板就 `selectPanel(null)`，避免空白主区。
- 开关同时受 `cordis.patch.yml` 的 host 级配置锁定（`locked`），UI 只读置灰——企业/集市分发场景必要。
- 开关写盘走自建 POST，GET 返回 `{ enabled, locked? }`；带 epoch 计数防迟到响应覆盖用户操作。

落点：给「侧栏入口」「正文搜索（读会话体）」两个开关，默认都开，但允许关掉重扫描。

### 2.7 【中低】自研 DateRange 胶囊 + 日历弹层

参考项目为这一个控件写了完整组件，理由是 `input[type=date]` 在暗色下反色、点外部失焦（#74）。可抄的是**行为规格**：单行展示 + 独立清除按钮 + 快捷预设（全部/今天/近 7·30·90 天）+ 完整 WAI-ARIA 键盘（方向键/Home/End/PageUp/PageDown + 月末钳制）+ 实时区间预览。我们目前没有日期筛选，若加「最近活跃窗口」可直接用这套规格。

### 2.8 【低，等发布 npm 才做】在线更新器 — `src/plugin-updater.ts` + `src/release-age.ts`

**前置条件：本仓 `package.json` 目前 `private: true`，没有 npm 包，更新器无对象可更新。** 若将来发布，这套是成熟模板：

- 四种安装能力探测：`desktopProfiles` + `desktopPnpm.runPlugin`、官方 Desktop 的 `argv[5]` pnpm（`process.execPath --expose-internals` + `ELECTRON_RUN_AS_NODE=1`）、`pluginManager.installBundle`、兜底 spawn CLI `plugin --profile X add`。
- **发布年龄坑**：pnpm `minimumReleaseAge` 会拦住刚发布的版本，必须把目标版本并进 `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` 的 `name@v1 || v2` union（同包名只认第一条，不能另起一行、不能写裸包名），无法安全解析时**宁可中止更新**（`release-age.ts:54`）。
- 路由所有权：`Symbol.for(...)` 把 dispose 挂在 raw server 的 Map 上，重新启用前先撤旧路由并清 `exact`/`prefixes` 表残留（`plugin-updater.ts:365`），否则「关掉再开」直接注册失败。
- 错误脱敏：`publicError` 把绝对路径替换成「请查看服务端日志」（`plugin-updater.ts:351`）。
- 单飞 `installing` → 409；`latest` 取不到 → 503 而不是假装最新。

## 3. 明确不抄

| 不抄的东西 | 原因 |
| --- | --- |
| **Typert overlay**（继承 `WorkspaceRegistry` + 14 个 remote 方法 + 手写 strict codec） | 与宿主/真正安装的 archive-manager 抢 `workspaceRegistry` 服务身份，还要对齐 `dsh-typert-protocol`。我们只需要一个删除入口，已有自建路由。这条与既有 note 的结论一致，本次复核后维持 |
| **侧栏星标 DOM 织入** | 参考项目为它连吃三个 issue（#90 `nth-child` 错位、#92 盖住宿主状态点、#99 关闭时必须连 DOM 容器与覆盖样式一起卸载）。收益（一排星）与维护成本不成比例 |
| **双入口同步**（Settings 面板 + sidebar main 同源） | 它必须做两个入口；我们只有一个整页视图，别复制这套双轨状态同步 |
| **对话轮次统计 / 日志修复 / 历史缓存扫描迁移** | 全部已被上游自己删掉（`CHANGELOG.md:116`、`:120`）：后台批量解压换不来价值，写回官方投影违背「零写入」 |
| **`document.baseURI` 反代适配** | 值得借鉴思路，但我们没有自建静态资源，路由全在宿主 origin 下，暂不需要 |

## 4. 工程纪律（比功能更值钱的部分）

1. **删除即记录理由**：参考项目 86 版里近 1/4 条目是「Removed」，每条都带为什么。建议我们的 CHANGELOG 从下一版开始也这样写。
2. **只声明消费到的类型**：`host-compat.ts` / `client-compat.ts` 把宿主类型 `Omit` 成本地形状，宿主升级时改动面收敛在一个文件。我们目前直接 import 宿主类型，宿主 0.2.x 漂移时会散落报错。
3. **能力探测 > 版本号判断**：`slots.inject` 回调、`typeof x.method === "function"`、`ctx.get` 包 try/catch，都比读版本号稳。
4. **隔离 fixture 做宿主集成测试**：`test/fixtures/isolated-host.mjs` 这类假宿主让我们能在 CI 里跑路由（P2 欠账）。
5. **`engines.dsh` 的 pre-release 语义**：参考写 `>=0.2.0-rc.1 <0.3.0-0`，我们写 `>=0.2.0 <0.3.0`。严格 semver 下 `0.2.1-rc.x` 未必满足后者，需要实测宿主校验器是否 `includePrerelease`，否则装机时报「版本不满足」而无法解释。

## 5. 建议的 P3 分批

| 批 | 内容 | 判定 |
| --- | --- | --- |
| P3-a | 正文检索 + 只读预览（2.1） | 最高感知收益，纯读，零风险 |
| P3-b | 缓存诊断 + 按需重建（2.2）、孤儿 subagent 回收（2.4） | 直接消掉已知缺口与磁盘垃圾 |
| P3-c | 批量契约（2.3）+ 闲置整理（2.5）+ 配置卡/能力探测（2.6） | 需要新的写入口，先把 BatchResult 与同源/上限边界立好 |
| 观察 | 收藏（DOM 织入，成本高）、跨工作区移动（zstd 首帧重写 + 备份回滚，风险最高） | 只有在用户真的抱怨「会话放错项目」时才做 |
