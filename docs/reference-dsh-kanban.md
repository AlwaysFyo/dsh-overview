# 参考：dsh-kanban 功能点与思路分析

> 对象：https://github.com/alpacachen/dsh-kanban（@alpacachen/dsh-kanban，Awesome DSH Plugin 收录）
> 性质：人 + AI agent 共享的看板任务板。与全景看板**互补不冲突**——它是任务协作工具，我们是项目/会话仪表盘（PRD 已明确不做任务管理器）。
> 本地只读参考副本：`.refs/dsh-kanban/`（浅克隆，勿修改）。

## 一、值得直接借鉴的机制

### 1. Q5「续接会话」的完整答案 ⭐ 价值最高

dsh-kanban 的"Chat with agent"解决了我们卡在 Q5 的跳转问题，全程不需要宿主"打开指定会话"API：

```
当前会话续聊：  ctx.get → InputActions.setDraft(text)   把上下文填进输入框（可编辑草稿，绝不自动发送）
新会话续聊：    uiWorkspace.openWorkspace(workspaceId, (nextId) => queueDraft(nextId, text))
                ↑ 切工作区，回调拿到新会话 id，草稿进队列
草稿落地：      conversation.input.dock slot 挂一个注入器组件，
                composer 挂载时消费队列 → 填充草稿
```

涉及服务：`inject: ['slots', 'locale', 'uiWorkspace', 'conversation']`；
类型来自 `@deepseek-ai/dsh-client-ui-conversation/client`（ConversationController.createDrafts / InputActions.setDraft / addAttachments）。

**落地到全景看板**：L2 会话行的"续接 ↗"改为——`uiWorkspace.openWorkspace(项目路径)` 切到目标项目，然后把"续接会话 session-xxx《标题》：轮次 N、最后活动 xx、待办 M 条"作为草稿填入。会话上下文由我们拼装（数据源就是 buildState 已有字段），agent 拿到即可继续。Q5 从"待宿主验证"变为"可立即实现"。

### 2. `conversation.view` slot：会话旁的 tab

dsh-kanban 把 Board 挂成会话视图旁的 tab（order 20），edict 的"军机处"同理。全景看板可把「项目概览」也挂进 conversation.view——在任何会话里一键看到全局状态，不用切走。低成本高价值，建议 P1。

### 3. Agent 工具化（P2 差异化功能）

宿主侧 `ctx.tools.register` 暴露 19 个 `kanban_*` 工具，agent 在对话里可直接读写看板。对应到全景看板的等价物：

- `workbench_get_status` — "我现在在忙什么？"（运行中会话 + 各项目待办）
- `workbench_list_projects` / `workbench_list_sessions(project)` — 会话检索
- `workbench_get_todos(project)` — 待办明细（R6 之后）

这是 LLM 周报（R9）的地基：agent 能读状态就能写周报。P0 架构已预留（buildState 纯函数），加 tools 只需在宿主 half 注册。

### 4. 活动时间线的 actor 归因

卡片时间线记录"谁改的：人 or agent"。我们的 R8 项目动态可借鉴：会话事件区分"用户发起 / agent 发起"（projcache 里有 agentPreset 等字段可推断），时间线价值翻倍。

### 5. 其他细节

| 点 | 做法 | 借鉴 |
|---|---|---|
| i18n | `inject: ['locale']` + installLocale(ctx)，跟随宿主语言 | P2；我们目前硬编码中文 |
| 数据落位 | 状态存 `<workspace.path>/.dsh-kanban.json`（工作区内，带 schemaVersion） | 与我们 PRD 的 `~/.dsh/dsh-workbench/` 方案相反；工作区内文件会污染 git status，**维持我们的方案**，但 schemaVersion 约定一致 |
| 兼容性声明 | `dsh.compatibility.dshReleases` 逐版本声明 | 补进我们的 manifest（现有 engines.dsh 是范围式） |
| 分发 | npm 预构建包 + Awesome DSH 索引 | 我们 tarball → 最终 npm + awesome-dsh-plugin.com |
| 主题 | 跟随 DSH 深浅模式 | 我们已用 --wb-* 变量，可再映射 --dsw-alias-* |

## 二、一个意外的集成彩蛋

dsh-kanban 的看板数据落在 `<workspace>/.dsh-kanban.json`（只读即可获取）。全景看板的项目卡片/详情页可以直接读它，给每个项目显示"看板任务 N（P0 x）"——零写入、零耦合，两个插件在 UI 层天然互补。若用户没装 kanban 则静默隐藏。归入 P1 待办。

## 三、结论

- **立即采纳**：Q5 续聊改走 openWorkspace + setDraft 路线（PRD Q5 可关闭）；conversation.view 项目概览 tab。
- **排期采纳**：agent tools（P2，R9 前置）、actor 归因时间线（R8 增强）、kanban 只读集成（P1）、compatibility manifest、npm 分发。
- **维持原案**：数据落位（~/.dsh/dsh-workbench/）、不做任务管理器的边界。
