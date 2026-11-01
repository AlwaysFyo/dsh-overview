# Agent Note: session-head-cache

Status: implemented

## Problem

宿主会在投影缓存变化时触发重建，而 `rebuild()` 每次都同步解压全部会话转录文件只为读第一行头信息；本机 47 个会话共 58MB（单文件最大 13.5MB），单次重建约 486ms 跑在宿主事件循环上，会话规模再涨会明显卡顿。

## Decision

`src/model/sources.ts` 的 `readSessionHeads` 增加进程内缓存 `headCache`：以会话文件绝对路径为键，值为 `${size}:${Math.round(mtimeMs)}` 指纹与解析结果（解析失败也缓存 null，避免反复读坏文件）。命中指纹则复用头部、仅回填当前 `fileMtime`；未命中才 `readFileSync` + `zstdDecompressSync` 解析首行。每次扫描结束按本轮 `seen` 集合淘汰已删除文件的缓存项，并导出 `clearSessionHeadCache()` 供测试隔离。实测冷启动 486ms → 命中缓存 10ms（本机 47 会话 / 58MB）。缓存是纯读优化：不影响 `buildState` 的合并规则、归档真相与 warnings 语义。
## Alternatives considered

**改成流式解压只读首行**（`createZstdDecompress` + 读到 `\n` 即 destroy）：能把冷启动也压到几十毫秒，但 `readSessionHeads` 是同步 API，改异步会波及 `buildState`、CLI、测试三层签名，收益只在每次进程启动一次。**把头部抽到独立索引文件**：需要写宿主数据目录，违背「对宿主数据零写入」的边界。**依赖宿主的 projcache 提供标题/mtime**：projcache 会周期性重写，且并非每个会话都有记录（现存 7 条无标题会话）。
## Consequences

代价：缓存是进程内 Map，进程重启后首次重建仍付 486ms；文件用 (size:mtimeMs 取整) 做指纹，同一毫秒内被改写成同样大小的文件理论上会命中陈旧值（实际 zstd 转录改写必然变大小，风险可忽略）；测试需 `clearSessionHeadCache()` 隔离临时目录。收益：宿主持续运行期间每次重建从 486ms 降到 10ms，watch 回调不再长时间阻塞事件循环；删除会话后缓存自动淘汰，不泄漏。

