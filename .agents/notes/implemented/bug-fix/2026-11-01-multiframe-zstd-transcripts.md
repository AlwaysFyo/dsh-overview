# Agent Note: multiframe-zstd-transcripts

Status: implemented

## Problem

正文检索返回 0 命中、只读预览抽屉永远空白、无标题会话的标题兜底也失效，但项目名 / cwd / 创建时间全部正常。根因不在检索逻辑：宿主写转录是「每次 append 一个 zstd 帧」（本机 14127382 字节的一份 `session.v4.jsonl.zstd` 里有 10770 个帧，单帧最小 146 字节），而 `streamLines` 用 `createReadStream().pipe(createZstdDecompress())` 读整文件时，应用进程里的 Node 解完第一帧就 end，于是只拿到首行头部——首行解析没问题（`readFirstLine` 只要第一行），所以界面上的项目信息一直是对的，坏的只有「需要读完整文件」的三处：检索、预览、标题兜底。

## Decision

`src/model/sources.ts` 的 `streamLines` 不再依赖 zlib 流的多帧语义：自己按 RFC 8878 走帧边界（magic `0xFD2FB528`，FHD 的 singleSegment / checksum / dictId / FCS 标志位，随后逐块 block header 的 last/type/size），遇到 skippable 帧（`0x184D2A50..5F`）按 4 字节长度跳过，找到完整帧尾后只对这一帧调 `zstdDecompressSync`，逐帧拼接成文本再按 `\n` 切行。返回 `null` 表示「数据还不够，继续读」，返回 `-1` 表示帧结构非法（抛错，由调用方计入 skipped）。同时支持未压缩的 `.jsonl`（首个 magic 不匹配就按纯文本走 `StringDecoder`，避免中文被切在多字节中间）。`onLine` 返回 `false` 仍然立即停止（保留原来「读到首行就掐断」的冷启动优化）。单帧超过 64 MiB 视为解析失控，直接报错而不是吃内存。本机实测 14 MB / 10770 帧整文件走完 264 ms，`previewSessionContent` 返回 8 条消息、`searchSessionContent` 正常命中。
## Alternatives considered

**升级运行环境的 Node 到会跨帧解码的版本**：修复点落在宿主 Electron 内嵌的 Node 上，不是我们能控制的发布面，而且同一份代码在 CLI（Node v24.22.1）里是对的、在应用里是错的——把正确性绑在运行时版本上等于把 bug 留给下一个环境。<br>**整段 `zstdDecompressSync(buf)` 一次解完**：本机确实能一次解多帧（135 ms），但那正是「依赖宿主 Node 的跨帧语义」，与应用里的失败模式同源，不能作为修复基础；逐帧解只多花一倍时间（264 ms），换来的是与实现版本无关。<br>**改读 projcache 的投影代替读转录**：投影里没有完整对话正文（只有 title / lastPromptAt / todos / tokenUsage 之类列表字段），预览和正文检索本来就要求读转录，绕不过去。
## Consequences

代价：逐帧解压比一次解多帧慢约一倍（14 MB 文件 264 ms vs 135 ms），且检索一次要串行扫多个文件时这份开销会叠起来——靠 `perSession` 上限提前 `onLine` 返回 false 把大部分文件掐在几十毫秒内。收益：预览、正文检索、标题兜底三处一起恢复，同时解释了「(无标题)」与 `diagnostics.cacheIssues` 里那批 no-title 的真实成因（不是缓存缺失，是读不到正文）。已知遗留：真正没有任何 `user/message` 事件的空会话仍然无标题；检索仍是全量流式扫描、不建索引，48 个文件里命中稀疏时耗时随文件数线性增长。

