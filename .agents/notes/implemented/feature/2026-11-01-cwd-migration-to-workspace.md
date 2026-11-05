# Agent Note: cwd-migration-to-workspace

Status: implemented

## Problem

并入工作区只写插件归属表，用户在宿主侧栏点开会话仍显示「未分组」——宿主按转录头里的 `cwd` 解析工作区，插件数据它根本不看。要让宿主也认，必须真的改会话的 cwd，这属于写宿主数据（第二处，仅次于永久删除），需要明确的安全边界。

## Decision

新增 `POST /dsh-overview/session/migrate`（`{workspaceId, sessionIds}`）与 `src/host/migrate.ts::migrateSessionCwd(home, sessionId, targetPath)`：把转录搬到 `sessions/--<目标路径>--/<会话 id>/`，并把首帧首行里的 `cwd` 改成目标路径。搬迁规则全部落在磁盘事实之上——目录名用 `sessionSlug()` 复刻宿主编码（`--` + 非 `[A-Za-z0-9._-]` 折成 `-` + `--`，实测 44 个转录 43 个一致），大小写差异交给 `resolveSlugDirName()`：先试计算名，命中就直接用（Windows 目录大小写不敏感），未命中再扫同名忽略大小写的目录，都失败才建新目录。

改写只动首帧：`rewriteHeadLine(bytes, patch)` 解出第一帧文本、只 patch 首个 JSON 行的字段（保留其余行原文与键顺序），`zstdCompressSync` 重压这一帧，再与原始字节从首帧结束处拼接。负向保证：不改写任何后续帧（宿主每 append 一帧，12.4 MB 转录有上万帧，整文件重压会同时改变体积、mtime 与「帧 = 一次追加」的形态），不合并帧，不触碰 projcache/归档缓存（宿主发现 identity.cwd 不匹配会自行重建）。

安全流程是固定的：原件先 `copyFileSync` 到 `~/.dsh/storages/dsh-overview-migration-backup/<ts>-<会话 id>/` 并写 `meta.json`（`{sessionId, from, to, sourceFile, at}`）→ 目标目录已存在同名会话则直接拒绝且不写任何东西 → 新文件先写 `.stage-<pid>` 再 `renameSync` → 回读校验 `id` 与 `cwd` → 校验通过才 `rmSync` 旧目录；任何一步失败都清掉半成品并返回带备份路径的错误。迁移成功后由 `addSessionIdsToWorkspace()` 把 id 补进 `workspace.json` 的成员表（跟随该表已有的 `session-` 前缀写法，tmp + rename），这条以前会被宿主过滤掉、现在 cwd 已匹配所以站得住，但仍标注为 best-effort：宿主内存里还有一份，重启后才读到。

客户端约束：`runMigrate()` 先按 `groups.running` 剔掉运行中的会话（宿主可能正在追加写），全部被剔掉时直接提示「先结束会话再迁移」；确认框写明会改写转录头、会备份、需重启应用才在宿主侧栏生效。UI 入口两处：旧路径提示条的「迁移到本项目（N）」与孤儿项目里的「迁移过来」。
## Alternatives considered

**整体解压再整体压缩**（最简单）：会把上万帧合并成一帧，体积和 mtime 全变，且丢掉「帧 = 一次追加」的形态；实测这份 12.4 MB 转录首帧只有几 KB，重压首帧后总长度只差 3 字节，成本差距是数量级的。放弃。

**只改 cwd 不搬目录**：宿主按 cwd 反推目录（`jsonlSessionDirectory`），目录留在旧 slug 下会导致会话在宿主里直接消失——比重叠更危险。放弃。

**不备份，靠「迁移可逆」**：cwd 的旧值虽然记录在返回体里，但一旦改写失败或宿主拒绝加载，用户手头就没有原件了。备份成本是一次 `copyFileSync`（24 ms 内的操作），没有理由省。放弃。

**让宿主自己 reload（调 registry 的 attach/detach）**：宿主成员表是内存真相，插件没有正式的迁移 API，掺进去等于和宿主抢所有权，archive-manager 的 overlay 路线就是在这里翻车的（#90/#92 皮肤冲突的那一类问题）。放弃，改为「文件层正确 + 明确告知需要重启」。

**迁移时一并重写 projcache 的 identity.cwd**：宿主的投影缓存有自己的生命周期与回读确认机制（`cacheIdentity` 见证、有界轮询），插件代写容易写出宿主不认的状态；让宿主自己判定缓存失效并重建更稳。放弃。
## Consequences

代价：这是插件的第二个宿主写入面（第一个是永久删除），`README` 的「默认零写入」措辞必须精确到「只有永久删除与迁移两个显式入口会写」；迁移后宿主内存仍持有旧路径，必须重启才在侧栏生效，界面上只能提示、无法自证；`sessions/--...--` 目录名规则是从磁盘反推的（44 个样本 43 个符合，唯一例外是大小写被系统还原），遇到宿主改编码规则会先失配——目前靠「沿用磁盘已有目录名」兜住，但新路径没有历史目录时只能依赖计算值。收益：改名/搬迁后的会话真正回到新工作区，宿主侧栏、CLI、续接全部一致；首帧重写的做法让 12.4 MB 转录的迁移在 24 ms 内完成，且失败可回滚。覆盖缺口：迁移不检查宿主是否正持有该会话（只在客户端按运行中列表过滤，绕过 HTTP 直接调路由时没有这道闸）；测试覆盖了 cwd 改写、字节保留、备份、幂等、目标冲突、成员表前缀与路由 400/404/200，没有覆盖「宿主重启后的实际分组效果」——那是真机验证项。

