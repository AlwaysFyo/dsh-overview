# Agent Note: workbench-archive-truth-and-session-delete

Status: implemented

## Problem

归档状态此前取错了数据源：buildState 以 session_projcache_archive_manager_v2 的记录判定 archived，且 live 会话合并时硬编码 archived:false 并覆盖同 id 的 archive 记录，导致"已归档但转录文件仍在"的会话在页签与指标里消失（实测 archived 7 条，其中 imageDedup 6 条缓存只显示 5 条，宿主真实归档只有 3 条）。同时 PRD 假设的 status.json 项目级归档从未实现，statusStore.ts 是无调用方的死代码；而详情页的"永久删除"只调 remote.workspaceRegistry.deleteSession，等于把可用性押在第三方 archive-manager 插件是否安装上。

## Decision

归档真相只认宿主 workspace 域。src/model/sources.ts 的 readHostArchivedIds() 读取 workspace.json 顶层 global.archivedSessionIds；buildState.ts 不再用归档缓存判定 archived（缓存只提供标题/token 等元数据兜底），聚合末尾统一执行 meta.archived = isArchivedInHost(meta.id)，并同时接受带与不带 session- 前缀的 id。因此一个会话可以同时是 live 与 archived，这是宿主语义而不是异常。归档/取消归档完全委托宿主 workspaces.archiveSession(id,{stopActivity:true}) / unarchiveSession(id)；插件不写任何自有状态文件，src/host/statusStore.ts 已删除。

永久删除由插件自有能力实现：src/host/deleteSession.ts 导出 deleteSessionArtifacts(ctx, sessionId)，语义对齐 dsh-archive-manager 的 deleteSessionCore——id 白名单（拒 . / .. / 分隔符）；未知会话幂等返回 skipped；live 会话先 flush 再 detach，冷会话走 publishColdSessionRemoval（prepare→enter→announce→detach→dispose）；清投影缓存；只级联 header.parentSession===id 且 header.origin==='subagent' 的子会话，绝不级联 fork 分支；清 spill；最后删除 jsonl 转录目录，且删除前逐项校验 persistence.name、location.kind、绝对 root、basename 正则、目录编码重建与 location.path 一致，拒绝符号链接，rm 后 stat 复查仍在则抛错；只有物理删除成功后才清 archivedSessionIds、workspace.sessionIds 与 headers/sessionPaths 记账，并 emit api-session/removed。宿主侧以 POST /dsh-workbench/session/delete 暴露：仅 POST（否则 405）、Origin 主机必须等于 Host（否则 403）、body ≤ 8 KiB（否则 413）、缺 sessionId 400、成功后 rebuild 再返回；客户端 api.ts 的 deleteSession() 走同一路由，Detail 页不再依赖 remote.workspaceRegistry。负向保证：不做批量删除、不做自动回收、不修改宿主归档机制本身。

归档缓存的孤儿记录不显示、删除时清掉。buildState 第 4 步丢弃 source==='archive' 且没有 dirName 且不在宿主 archivedSessionIds 里的会话：这些是宿主归档缓存留下的历史快照，没有转录文件、打不开也删不掉，此前会以"无标题"行出现在历史列表（本机实测 12 行）。宿主明确归档的 id 即使文件缺失也保留，保证仍能取消归档或删除。deleteSessionArtifacts 成功后由 host/index.ts 调 purgeArchiveCache(home, sessionId) 按 record.sessionId 精确删除归档缓存 JSON（损坏文件跳过、失败只记 warning），否则下次重建会从缓存把已删会话复活。数据源上这条规则只作用于归档缓存，live 与 projcache 会话不受影响。

SSE 只广播真实变化。宿主会周期性重写 session_projcache，watcher 因此每几秒触发一次重建；host/index.ts 的 rebuild() 先计算去掉 generatedAt 的内容签名，与上次签名相同就既不升 revision 也不推 change 事件。代价是每次重建仍要聚合一次（几十毫秒），换来客户端不再被无意义变更事件刷屏（实测 revision 从约每 5 秒 +1 变为几十秒稳定）。
## Alternatives considered

**照搬参考的 Typert 远程方案**：继承 WorkspaceRegistry、用 bindTypertRemote 注册 deleteSession 等 14 个远程方法。放弃，因为那会与宿主自身或真正安装的 archive-manager 争抢 workspaceRegistry 服务身份，还需要 dsh-typert-protocol 版本对齐；我们只需要一个删除入口，不值得拥有整个注册表子类。

**保留 status.json 做项目级归档**：按 path 记录 archived/archivedAt，满足 PRD R2 原文。放弃，因为宿主 workspace.json 的 global.archivedSessionIds 与会话导航已经构成唯一真相，再维护一份会分裂 L1/L2/指标三处判据，而且"项目已归档"在宿主导航里没有对应落点，用户会看到两套互不相认的归档。

**只做 UI 层 removeSession（取消归档标记）冒充删除**：实现最轻。放弃，因为它会留下孤立转录目录与投影缓存，磁盘不回收、名字也不符，属假删除。

**用 mtime 时间窗推断运行中、绕过 liveSessionIds 为空**：放弃，无法区分"刚发过消息"与"正在跑"，只保留为兜底显示。
## Consequences

代价：删除是不可逆操作，插件现在拥有真实写入能力，需要自己守住同源/上限/路径所有权三道边界；每次改动都要重新 build+pack+安装并核哈希，否则运行中的 GUI 仍是旧包（0.1.1→0.1.4 已各装一次）。收益：归档页签、指标、卡片状态第一次与宿主一致（archived 7→3），历史列表不再出现无法删除的幽灵行（56→44，幽灵 12→0），删除不再依赖第三方插件。遗留：无标题的真实 live 会话仍有 7 条（spike/插件创建、projcache 无标题元数据），当前显示「(无标题)」，可考虑后续用会话首条消息或短 id 兜底；storages 目录纳入 watch 后 SSE 重建范围变大，需留意重建耗时。

