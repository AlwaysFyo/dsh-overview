# Agent Note: session-head-streaming

Status: implemented

## Problem

会话头解析此前每次冷启动都要把 47 个会话文件（合计 58 MB，最大单文件 13.5 MB）整文件 zstd 解压，只为读出第一行 JSON 头。该同步工作跑在宿主事件循环上，实测单次 buildState 486–519 ms；加上文件指纹缓存后热读降到 10 ms，但进程启动后的首个 /state 请求仍会卡住事件循环。

## Decision

`src/model/sources.ts` 用 `createReadStream` + `createZstdDecompress` + `StringDecoder` 实现 `streamLines(file, onLine)`：按 64 KB 读、流式解压、逐行回调，`onLine` 返回 false 时立即 destroy 并 resolve。`readFirstLine` 读到首个换行即停；`readSessionHeads(root)` 改为 async，用 8 并发 worker 处理文件清单，仍保留 `headCache`（指纹 `${size}:${Math.round(mtimeMs)}`）并在每轮按 seen 淘汰。`buildState` 随之变为 `async function buildState(): Promise<WorkbenchState>`，`src/cli.ts` 与测试用 await；`src/host/index.ts` 用惰性单飞 `buildOnce()`（building Promise）避免并发重复扫描。实测 47 会话：冷建 486 ms → 29 ms，热读 10 ms。负向保证：不写任何索引文件或缓存文件到宿主目录，所有缓存都是进程内的；truncated zstd frame 不可解码这条限制仍然成立（Node 24 的 sync 解压在 4KB/64KB/256KB/1MB 截断下都抛 Z_BUF_ERROR），所以异步流式是唯一可行的「只读首行」路径，不能退回同步。本决定取代 `architecture/2026-11-01-session-head-cache.md` 中「只做指纹缓存、暂不流式化」的取舍。
## Alternatives considered

**保留同步只读缓存**：冷启动仍 ~490 ms，且首个 /state 会阻塞宿主事件循环；缓存只解决周期性 rebuild，不解决启动峰值。**把头部写入独立索引文件（如 heads.json）**：能真正避免解压，但违背插件对宿主数据零写入的约束（PRD 红线），也引入索引与真实文件不一致的失效问题。**只读压缩流前 N 字节再同步解压**：Node 24 的 `zstdDecompressSync` 对截断 frame 一律抛错，实测 4KB/64KB/256KB/1MB 全部失败，方案不可行。**把首次构建完全懒到用户打开页面**：仍是 486 ms，只是把卡顿挪到用户操作上，不解决根本问题。
## Consequences

代价：`buildState`/`readSessionHeads`/CLI 全部变成异步，调用点必须 await，未来任何同步消费者都要适配；流式解压对每个文件多一次 stream 生命周期开销（热路径仍由 headCache 兜住）。收益：冷启动降到 29 ms，宿主事件循环几乎不再被会话头解析阻塞；顺带得到 `streamLines` 这个可复用于标题兜底（扫描前 2 MB 找首条 user/message）的底层原语。未覆盖：进程重启后首次构建仍需读 47 个文件，只是每个只解压到首行；若未来单文件头部本身超大（>64 KB），需要调大 highWaterMark 或增加上限保护。

