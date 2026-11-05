import { copyFileSync, createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, unlinkSync, watch, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { homedir } from "node:os";
import { StringDecoder } from "node:string_decoder";
import { zstdCompressSync, zstdDecompressSync } from "node:zlib";
import { lstat, readFile, readdir, rm, stat, unlink } from "node:fs/promises";
// src/model/paths.ts
/** 解析 DSH home（默认 ~/.dsh，可用 DSH_HOME 覆盖，与 browser-dock 同规则） */
function dshHome(env = process.env) {
	return env["DSH_HOME"] || join(homedir(), ".dsh");
}
function workspaceJsonPath(home) {
	return join(home, "storages", "workspace.json");
}
function projcacheDir(home) {
	return join(home, "storages", "session_projcache", "sessions");
}
function archiveDir(home) {
	return join(home, "storages", "session_projcache_archive_manager_v2", "sessions");
}
function sessionsRoot(home) {
	return join(home, "sessions");
}
/**
* 会话 id 的两种写法：宿主在 workspace.json 的 sessionIds 与 global.archivedSessionIds
* 里带 'session-' 前缀，而转录文件头里的 id 不带（本机实测两种写法同时存在）。
* 关联时必须双向匹配，否则改名/归档后的会话会「查不到」。
*/
function sessionIdVariants(id) {
	return id.startsWith("session-") ? [id, id.slice(8)] : [id, `session-${id}`];
}
/** Windows 大小写不敏感；统一成小写 + 正斜杠比较键 */
function normalizePath(p) {
	const noTrail = p.replace(/\//g, "\\").trim().replace(/\\+$/, "");
	return process.platform === "win32" ? noTrail.toLowerCase() : noTrail;
}
// src/model/rows.ts
/** 从 projcache 行单元格安全取 val */
function cellVal(record, key) {
	return record.record.rows[key]?.val ?? null;
}
/** 会话标题：优先 rows.title.val，回退 titleInput.val.first.text（PRD R4 搜索也要用它） */
function extractTitle(record) {
	const title = cellVal(record, "title");
	if (typeof title === "string" && title.trim()) return title.trim();
	const text = cellVal(record, "titleInput")?.first?.text;
	return typeof text === "string" && text.trim() ? text.trim() : null;
}
function extractLastPromptAt(record) {
	const meta = cellVal(record, "sessionListMetadata");
	return typeof meta?.lastPromptAt === "number" ? meta.lastPromptAt : null;
}
function extractTurns(record) {
	const stats = cellVal(record, "sessionStats");
	return typeof stats?.turns === "number" ? stats.turns : null;
}
function extractTokenTotals(record) {
	const t = cellVal(record, "tokenUsage")?.totals;
	if (!t) return null;
	return {
		uncachedInputTokens: t.uncachedInputTokens ?? 0,
		outputTokens: t.outputTokens ?? 0,
		cacheReadTokens: t.cacheReadTokens ?? 0,
		cacheWriteTokens: t.cacheWriteTokens ?? 0
	};
}
/**
* 会话待办：rows.todos.val 实测为 [{ content, status }]，也可能为空/异形。
* 只保留有文字内容的条目；未知 status 归为 'pending'（计数口径：非 completed）。
*/
function extractTodoItems(record) {
	const raw = cellVal(record, "todos");
	if (!Array.isArray(raw)) return [];
	const items = [];
	for (const entry of raw) {
		if (!entry || typeof entry !== "object") continue;
		const obj = entry;
		const content = typeof obj["content"] === "string" ? obj["content"].trim() : "";
		if (!content) continue;
		const known = obj["status"];
		const status = known === "pending" || known === "in_progress" || known === "completed" ? known : "pending";
		items.push({
			content,
			status
		});
	}
	return items;
}
// src/model/sources.ts
function readWorkspaces(file) {
	const warnings = [];
	if (!existsSync(file)) return {
		data: [],
		warnings: [`workspace.json 不存在: ${file}`]
	};
	try {
		const table = JSON.parse(readFileSync(file, "utf-8")).tables?.workspaces ?? {};
		return {
			data: Object.entries(table).map(([id, v]) => {
				const w = v;
				return {
					id,
					path: String(w["path"] ?? ""),
					title: String(w["title"] ?? id),
					sessionIds: Array.isArray(w["sessionIds"]) ? w["sessionIds"] : [],
					createdAt: typeof w["createdAt"] === "string" ? Date.parse(w["createdAt"]) : null,
					updatedAt: typeof w["updatedAt"] === "string" ? Date.parse(w["updatedAt"]) : null
				};
			}),
			warnings
		};
	} catch (err) {
		warnings.push(`workspace.json 解析失败: ${err.message}`);
		return {
			data: [],
			warnings
		};
	}
}
/**
* 1b. workspace.json → global.archivedSessionIds（归档真相）
*
* 归档状态只存在于宿主 workspace 域的 global 表里；session_projcache_archive_manager_v2
* 目录是投影缓存快照，会保留历史遗留记录，不能当作「当前已归档」的依据
* （参考实现 @michengai/dsh-archive-manager 也用 workspaceState.archivedSessionIds 判归档）。
*/
function readHostArchivedIds(file) {
	const warnings = [];
	if (!existsSync(file)) return {
		data: [],
		warnings
	};
	try {
		const ids = JSON.parse(readFileSync(file, "utf-8")).global?.archivedSessionIds;
		return {
			data: Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [],
			warnings
		};
	} catch (err) {
		warnings.push(`workspace.json 归档集合解析失败: ${err.message}`);
		return {
			data: [],
			warnings
		};
	}
}
/** 2. session_projcache/sessions/*.json → 元数据记录列表 */
function readProjcacheRecords(dir) {
	const warnings = [];
	if (!existsSync(dir)) return {
		data: [],
		warnings: [`projcache 目录不存在: ${dir}`]
	};
	const data = [];
	for (const name of readdirSync(dir)) {
		if (!name.endsWith(".json")) continue;
		try {
			const parsed = JSON.parse(readFileSync(join(dir, name), "utf-8"));
			if (parsed?.record?.identity) data.push(parsed);
		} catch (err) {
			warnings.push(`projcache 文件跳过 ${name}: ${err.message}`);
		}
	}
	return {
		data,
		warnings
	};
}
/** 3. 归档缓存 → 同结构记录（含 record.sessionId） */
function readArchiveRecords(dir) {
	const warnings = [];
	if (!existsSync(dir)) return {
		data: [],
		warnings: []
	};
	const data = [];
	for (const name of readdirSync(dir)) {
		if (!name.endsWith(".json")) continue;
		try {
			const parsed = JSON.parse(readFileSync(join(dir, name), "utf-8"));
			if (parsed?.record?.identity) data.push(parsed);
		} catch (err) {
			warnings.push(`归档记录跳过 ${name}: ${err.message}`);
		}
	}
	return {
		data,
		warnings
	};
}
const headCache = /* @__PURE__ */ new Map();
const previewCache = /* @__PURE__ */ new Map();
const ZSTD_MAGIC = 4247762216;
const ZSTD_SKIPPABLE_MASK = 4294967280;
const ZSTD_SKIPPABLE_MAGIC = 407710288;
/** 单帧体积上限：超过说明帧头解析走进了死循环，宁可报错也不要吃光内存 */
const MAX_PENDING_BYTES = 67108864;
/**
* 量出一个 zstd 帧的结束偏移。
* 返回 null 表示数据还不够（需要继续读），返回 -1 表示这段不是合法的 zstd 帧。
* 为什么手写：宿主写转录用的是「每次 append 一帧」，一份 14MB 文件能有 10770 帧
* （实测），而 createZstdDecompress 的流在某些 Node 版本上解完第一帧就 end，
* 于是只拿到首行头 —— 预览空白、正文 0 命中、标题兜底失效都由此而来。
*/
function zstdFrameEnd(buf, start) {
	if (buf.length - start < 4) return null;
	const magic = buf.readUInt32LE(start);
	if ((magic & ZSTD_SKIPPABLE_MASK) === ZSTD_SKIPPABLE_MAGIC) {
		if (buf.length - start < 8) return null;
		const end = start + 8 + buf.readUInt32LE(start + 4);
		return end <= buf.length ? end : null;
	}
	if (magic !== ZSTD_MAGIC) return -1;
	if (buf.length - start < 6) return null;
	let p = start + 4;
	const fhd = buf[p] ?? 0;
	p += 1;
	const singleSegment = fhd >> 5 & 1;
	const hasChecksum = fhd >> 2 & 1;
	const dictFlag = fhd & 3;
	const fcsFlag = fhd >> 6 & 3;
	if (!singleSegment) p += 1;
	p += [
		0,
		1,
		2,
		4
	][dictFlag] ?? 0;
	p += fcsFlag === 0 ? singleSegment ? 1 : 0 : [
		0,
		2,
		4,
		8
	][fcsFlag] ?? 0;
	for (;;) {
		if (buf.length - p < 3) return null;
		const v = (buf[p] ?? 0) | (buf[p + 1] ?? 0) << 8 | (buf[p + 2] ?? 0) << 16;
		const last = v & 1;
		const type = v >> 1 & 3;
		const size = v >>> 3;
		if (type === 3) return -1;
		p += 3 + (type === 1 ? 1 : size);
		if (last) break;
	}
	if (hasChecksum) p += 4;
	return p <= buf.length ? p : null;
}
/**
* 按行流式读取 JSONL 转录；onLine 返回 false 立即停止（省掉剩余解压）。
* 同时支持多帧 zstd（宿主形态）与未压缩 jsonl（手工放进去的文件）。
*/
function streamLines(file, onLine) {
	return new Promise((resolve, reject) => {
		const rs = createReadStream(file, { highWaterMark: 65536 });
		const decoder = new StringDecoder("utf8");
		let pending = Buffer.alloc(0);
		let text = "";
		let mode = "unknown";
		let settled = false;
		const finish = (err) => {
			if (settled) return;
			settled = true;
			rs.destroy();
			if (err) reject(err);
			else resolve();
		};
		const consume = (chunk) => {
			text += chunk;
			let nl = text.indexOf("\n");
			while (nl >= 0) {
				const line = text.slice(0, nl);
				text = text.slice(nl + 1);
				if (onLine(line) === false) return false;
				nl = text.indexOf("\n");
			}
			return true;
		};
		/** 把 pending 里所有完整帧解压并吃掉；返回 false 表示调用方要求停止 */
		const drainZstd = () => {
			let off = 0;
			let out = "";
			for (;;) {
				const end = zstdFrameEnd(pending, off);
				if (end === null) break;
				if (end === -1) throw new Error(`zstd 帧损坏: ${file}`);
				const frame = pending.subarray(off, end);
				if ((frame.readUInt32LE(0) & ZSTD_SKIPPABLE_MASK) !== ZSTD_SKIPPABLE_MAGIC) out += zstdDecompressSync(frame).toString("utf8");
				off = end;
			}
			if (off === 0) return true;
			pending = pending.subarray(off);
			return consume(out);
		};
		rs.on("data", (chunk) => {
			if (settled) return;
			try {
				pending = pending.length === 0 ? chunk : Buffer.concat([pending, chunk]);
				if (pending.length > MAX_PENDING_BYTES) {
					finish(/* @__PURE__ */ new Error(`zstd 帧过大，疑似解析错误: ${file}`));
					return;
				}
				if (mode === "unknown") {
					if (pending.length < 4) return;
					const magic = pending.readUInt32LE(0);
					mode = magic === ZSTD_MAGIC || (magic & ZSTD_SKIPPABLE_MASK) === ZSTD_SKIPPABLE_MAGIC ? "zstd" : "plain";
				}
				if (mode === "plain") {
					const raw = pending;
					pending = Buffer.alloc(0);
					if (!consume(decoder.write(raw))) finish();
					return;
				}
				if (!drainZstd()) finish();
			} catch (err) {
				finish(err);
			}
		});
		rs.on("end", () => {
			if (settled) return;
			try {
				if (mode === "plain") consume(decoder.end());
				else if (mode === "zstd") {
					if (!drainZstd()) {
						finish();
						return;
					}
				}
				if (text) onLine(text);
				finish();
			} catch (err) {
				finish(err);
			}
		});
		rs.on("error", (err) => finish(err));
	});
}
/** 只读第一行（会话头）：流式解压到首个换行即停，不再整文件解压 */
async function readFirstLine(file) {
	let first = null;
	await streamLines(file, (line) => {
		first = line;
		return false;
	});
	if (first === null) throw new Error("empty session file");
	return first;
}
/** 从一条 user/message 事件里取首段文本（宿主事件形态：data.content[].type==='text'） */
function userTextFromEvent(line) {
	if (!line.includes("user/message")) return null;
	let evt;
	try {
		evt = JSON.parse(line);
	} catch {
		return null;
	}
	if (evt.type !== "user/message" || !Array.isArray(evt.data?.content)) return null;
	return evt.data.content.filter((part) => part?.type === "text" && typeof part.text === "string").map((part) => String(part.text)).join(" ").trim() || null;
}
/** 首条用户消息 → 单行短标题（折叠空白、限长） */
function shorten(text, max = 60) {
	const oneLine = text.replace(/\s+/g, " ").trim();
	return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine;
}
/** 首条 user 消息的扫描上限（超过就放弃，结论只能是「没扫到」） */
const TITLE_SCAN_LIMIT = 2097152;
/**
* 扫前 2 MB 解压内容：取首条 user 消息当标题，并顺带回答「这个会话到底有没有对话」。
*
* 后一个问题的来源：宿主新建会话时会立刻落一个只有头 + 权限/沙箱事件的转录（实测 318 B、4 行），
* 切走后宿主把它从会话列表里摘掉，但**磁盘上的目录不删**。全景概览读的是磁盘，
* 于是会显示这批宿主自己都不再列出的空会话——判定依据就是这里扫到的 hasMessages。
*/
async function probeSessionFile(file) {
	const unknown = {
		title: null,
		hasMessages: false,
		complete: false
	};
	let key = "";
	try {
		const st = statSync(file);
		key = `${st.size}:${Math.round(st.mtimeMs)}`;
		const cached = previewCache.get(file);
		if (cached && cached.key === key) return cached.probe;
	} catch {
		return unknown;
	}
	let scanned = 0;
	let title = null;
	let hasMessages = false;
	let complete = true;
	try {
		await streamLines(file, (line) => {
			scanned += line.length + 1;
			if (scanned > TITLE_SCAN_LIMIT) {
				complete = false;
				return false;
			}
			if (line.startsWith("{\"type\":\"user/message\"") || line.startsWith("{\"type\":\"assistant/message\"")) hasMessages = true;
			const text = userTextFromEvent(line);
			if (text) {
				title = shorten(text);
				return false;
			}
		});
	} catch {
		return unknown;
	}
	const probe = {
		title,
		hasMessages,
		complete
	};
	previewCache.set(file, {
		key,
		probe
	});
	return probe;
}
/** 4. sessions/<slug>/<dir>/session.v4.jsonl.zstd → 会话头 + 文件 mtime（异步流式） */
async function readSessionHeads(root) {
	const warnings = [];
	if (!existsSync(root)) return {
		data: [],
		warnings: [`sessions 目录不存在: ${root}`]
	};
	const seen = /* @__PURE__ */ new Set();
	const files = [];
	for (const slug of readdirSync(root)) {
		const slugPath = join(root, slug);
		if (!statSync(slugPath).isDirectory()) continue;
		for (const dir of readdirSync(slugPath)) {
			const file = join(slugPath, dir, "session.v4.jsonl.zstd");
			if (!existsSync(file)) continue;
			seen.add(file);
			try {
				const st = statSync(file);
				files.push({
					rel: `${slug}/${dir}`,
					file,
					size: st.size,
					mtimeMs: st.mtimeMs
				});
			} catch (err) {
				warnings.push(`会话文件跳过 ${slug}/${dir}: ${err.message}`);
			}
		}
	}
	const data = [];
	const CONCURRENCY = 8;
	let cursor = 0;
	const worker = async () => {
		while (cursor < files.length) {
			const entry = files[cursor++];
			const fingerprint = `${entry.size}:${Math.round(entry.mtimeMs)}`;
			const cached = headCache.get(entry.file);
			if (cached && cached.key === fingerprint) {
				if (cached.info) data.push({
					...cached.info,
					fileMtime: entry.mtimeMs,
					size: entry.size
				});
				continue;
			}
			try {
				const head = JSON.parse(await readFirstLine(entry.file));
				if (typeof head?.id === "string" && typeof head?.createdAt === "number") {
					const info = {
						dirName: entry.rel,
						file: entry.file,
						head,
						fileMtime: entry.mtimeMs,
						size: entry.size
					};
					headCache.set(entry.file, {
						key: fingerprint,
						info
					});
					data.push(info);
				} else {
					headCache.set(entry.file, {
						key: fingerprint,
						info: null
					});
					warnings.push(`会话头字段缺失: ${entry.rel}`);
				}
			} catch (err) {
				headCache.set(entry.file, {
					key: fingerprint,
					info: null
				});
				warnings.push(`会话文件跳过 ${entry.rel}: ${err.message}`);
			}
		}
	};
	await Promise.all(Array.from({ length: Math.min(CONCURRENCY, files.length) }, worker));
	for (const cachedPath of headCache.keys()) if (!seen.has(cachedPath)) headCache.delete(cachedPath);
	for (const cachedPath of previewCache.keys()) if (!seen.has(cachedPath)) previewCache.delete(cachedPath);
	return {
		data,
		warnings
	};
}
// src/model/buildState.ts
/**
* 聚合四源 → WorkbenchState。
*
* 关联键（本机探查验证，scripts/probe-projcache-map.mjs，46/47 命中）：
*  - projcache ↔ 会话文件：normalizePath(identity.cwd) + identity.createdAt === head.createdAt
*  - 归档记录 ↔ 项目：record.sessionId 自标识 + identity.cwd
*  - 会话 ↔ 工作区：normalizePath(cwd) === normalizePath(workspace.path)
*/
async function buildState(options) {
	const warnings = [];
	const { home } = options;
	const checkDisk = options.checkDisk ?? true;
	const aliases = options.aliases ?? {};
	const wsRes = readWorkspaces(workspaceJsonPath(home));
	const arcRes = readHostArchivedIds(workspaceJsonPath(home));
	const pcRes = readProjcacheRecords(projcacheDir(home));
	const arRes = readArchiveRecords(archiveDir(home));
	const sfRes = await readSessionHeads(sessionsRoot(home));
	warnings.push(...wsRes.warnings, ...arcRes.warnings, ...pcRes.warnings, ...arRes.warnings, ...sfRes.warnings);
	const archivedIds = new Set(arcRes.data);
	const isArchivedInHost = (id) => archivedIds.has(id) || archivedIds.has(id.startsWith("session-") ? id.slice(8) : `session-${id}`);
	const pcByKey = /* @__PURE__ */ new Map();
	for (const rec of pcRes.data) {
		const key = `${normalizePath(rec.record.identity.cwd)}|${rec.record.identity.createdAt}`;
		pcByKey.set(key, rec);
	}
	const metaForRecord = (rec, base) => ({
		id: rec.record.sessionId ?? base.id,
		title: extractTitle(rec),
		cwd: rec.record.identity.cwd,
		createdAt: rec.record.identity.createdAt,
		lastPromptAt: extractLastPromptAt(rec),
		lastActivityAt: null,
		turns: extractTurns(rec),
		tokenTotals: extractTokenTotals(rec),
		todos: extractTodoItems(rec),
		archived: base.archived,
		source: base.source,
		dirName: base.dirName,
		origin: null,
		parentSession: null,
		derived: false,
		sizeBytes: null,
		empty: false
	});
	const sessions = /* @__PURE__ */ new Map();
	for (const rec of arRes.data) {
		const id = rec.record.sessionId;
		if (!id) continue;
		const meta = metaForRecord(rec, {
			id: rec.record.sessionId,
			archived: false,
			source: "archive",
			dirName: null
		});
		meta.lastActivityAt = meta.lastPromptAt ?? meta.createdAt;
		sessions.set(id, meta);
	}
	const noRecordIds = /* @__PURE__ */ new Set();
	for (const info of sfRes.data) {
		const head = info.head;
		const pcKey = `${normalizePath(head.cwd)}|${head.createdAt}`;
		const rec = pcByKey.get(pcKey);
		const meta = rec ? metaForRecord(rec, {
			id: head.id,
			archived: false,
			source: "live",
			dirName: info.dirName
		}) : {
			id: head.id,
			title: null,
			cwd: head.cwd,
			createdAt: head.createdAt,
			lastPromptAt: null,
			lastActivityAt: null,
			turns: null,
			tokenTotals: null,
			todos: [],
			archived: false,
			source: "live",
			dirName: info.dirName,
			origin: null,
			parentSession: null,
			derived: false,
			sizeBytes: null,
			empty: false
		};
		if (!rec) noRecordIds.add(head.id);
		meta.origin = typeof head.origin === "string" ? head.origin : null;
		meta.parentSession = typeof head.parentSession === "string" ? head.parentSession : null;
		meta.sizeBytes = info.size;
		meta.lastActivityAt = Math.max(meta.lastPromptAt ?? 0, info.fileMtime) || meta.lastPromptAt || info.fileMtime;
		const prev = sessions.get(head.id);
		if (!prev || prev.source !== "live") sessions.set(head.id, meta);
	}
	const infoById = new Map(sfRes.data.map((info) => [info.head.id, info]));
	for (const meta of sessions.values()) {
		if (meta.source !== "live" || meta.title) continue;
		const info = infoById.get(meta.id);
		if (!info) continue;
		const probe = await probeSessionFile(info.file);
		if (probe.title) meta.title = probe.title;
		meta.empty = probe.complete && !probe.hasMessages;
	}
	for (const rec of pcRes.data) {
		if ([...sessions.values()].some((s) => s.cwd !== null && normalizePath(s.cwd) === normalizePath(rec.record.identity.cwd) && s.createdAt === rec.record.identity.createdAt)) continue;
		const meta = metaForRecord(rec, {
			id: `pc-${rec.record.identity.createdAt}-${normalizePath(rec.record.identity.cwd)}`,
			archived: false,
			source: "cacheOnly",
			dirName: null
		});
		meta.lastActivityAt = meta.lastPromptAt ?? meta.createdAt;
		sessions.set(meta.id, meta);
	}
	let staleArchiveRecords = 0;
	for (const [id, meta] of sessions) if (meta.source === "archive" && !meta.dirName && !isArchivedInHost(id)) {
		sessions.delete(id);
		staleArchiveRecords += 1;
	}
	const claimedKeys = /* @__PURE__ */ new Set();
	for (const ws of wsRes.data) for (const sid of ws.sessionIds) for (const key of sessionIdVariants(sid)) claimedKeys.add(key);
	const aliasedIds = /* @__PURE__ */ new Set();
	for (const meta of sessions.values()) {
		if (!meta.cwd) continue;
		if (aliases[normalizePath(meta.cwd)] && !sessionIdVariants(meta.id).some((key) => claimedKeys.has(key))) aliasedIds.add(meta.id);
	}
	const registeredPaths = new Set(wsRes.data.map((ws) => normalizePath(ws.path)));
	/** 靠父会话挂进项目的子会话：既不算 staleCwd，也不再算「无主转录」 */
	const derivedIds = /* @__PURE__ */ new Set();
	const projects = groupIntoProjects(wsRes.data, [...sessions.values()], warnings, checkDisk, aliases, derivedIds);
	for (const meta of sessions.values()) meta.archived = isArchivedInHost(meta.id);
	const diagnostics = buildDiagnostics({
		sessions: [...sessions.values()],
		claimedKeys,
		aliasedIds,
		derivedIds,
		registeredPaths,
		noRecordIds,
		staleArchiveRecords
	});
	return {
		generatedAt: Date.now(),
		projects,
		warnings,
		diagnostics
	};
}
/** 诊断：只归纳证据，不做任何修复（修复动作由用户显式触发，见宿主路由） */
function buildDiagnostics(input) {
	const cacheIssues = [];
	const unclaimed = [];
	for (const meta of input.sessions) {
		if (meta.source !== "live") continue;
		if (meta.title === null) cacheIssues.push({
			kind: input.noRecordIds.has(meta.id) ? "no-record" : "no-title",
			sessionId: meta.id,
			title: meta.title,
			cwd: meta.cwd
		});
		if (!(input.derivedIds.has(meta.id) || input.aliasedIds.has(meta.id) || sessionIdVariants(meta.id).some((key) => input.claimedKeys.has(key))) && !meta.archived) unclaimed.push({
			sessionId: meta.id,
			title: meta.title,
			cwd: meta.cwd,
			createdAt: meta.createdAt,
			origin: meta.origin,
			sizeBytes: meta.sizeBytes ?? 0,
			dirName: meta.dirName,
			pathRegistered: meta.cwd ? input.registeredPaths.has(normalizePath(meta.cwd)) : false
		});
	}
	unclaimed.sort((a, b) => Number(a.pathRegistered) - Number(b.pathRegistered) || b.sizeBytes - a.sizeBytes);
	return {
		cacheIssues: cacheIssues.slice(0, 200),
		unclaimed: unclaimed.slice(0, 200),
		staleArchiveRecords: input.staleArchiveRecords
	};
}
function groupIntoProjects(workspaces, sessions, warnings, checkDisk, aliases, derivedIds) {
	const existsCache = /* @__PURE__ */ new Map();
	const dirExists = (p) => {
		let hit = existsCache.get(p);
		if (hit === void 0) {
			try {
				hit = statSync(p).isDirectory();
			} catch {
				hit = false;
			}
			existsCache.set(p, hit);
		}
		return hit;
	};
	const byPath = /* @__PURE__ */ new Map();
	const getProject = (path, workspace) => {
		const key = normalizePath(path);
		let project = byPath.get(key);
		if (!project) {
			const isWorkspace = workspace !== null;
			project = {
				id: isWorkspace ? workspace.id : `orphan:${key}`,
				path,
				title: isWorkspace ? workspace.title : path.split("\\").pop() || path,
				workspaceId: isWorkspace ? workspace.id : null,
				existsOnDisk: !checkDisk || dirExists(path),
				sessions: [],
				lastActivityAt: null,
				staleCwds: []
			};
			byPath.set(key, project);
		}
		return project;
	};
	const projectByWsId = /* @__PURE__ */ new Map();
	const ownerByKey = /* @__PURE__ */ new Map();
	const conflicts = /* @__PURE__ */ new Set();
	for (const ws of workspaces) {
		if (!ws.path) {
			warnings.push(`工作区 ${ws.id} 缺少 path，已跳过`);
			continue;
		}
		projectByWsId.set(ws.id, getProject(ws.path, ws));
		for (const sid of ws.sessionIds ?? []) for (const key of sessionIdVariants(sid)) {
			const prev = ownerByKey.get(key);
			if (prev && prev.id !== ws.id) {
				conflicts.add(key);
				continue;
			}
			ownerByKey.set(key, ws);
		}
	}
	if (conflicts.size > 0) warnings.push(`${conflicts.size} 个会话同时登记在多个工作区，按首次出现归属`);
	/** 子会话挂父会话用：id → 项目（两种写法都登记，父会话 id 带 session- 前缀） */
	const projectBySessionKey = /* @__PURE__ */ new Map();
	const remember = (session, project) => {
		for (const key of sessionIdVariants(session.id)) if (!projectBySessionKey.has(key)) projectBySessionKey.set(key, project);
	};
	/** 落在孤儿桶里的会话：稍后尝试按父会话改挂到工作区 */
	const pending = [];
	for (const session of sessions) {
		let placed = null;
		const owner = sessionIdVariants(session.id).map((key) => ownerByKey.get(key)).find((ws) => ws !== void 0);
		if (owner) {
			const project = projectByWsId.get(owner.id);
			if (project) {
				project.sessions.push(session);
				if (session.cwd && normalizePath(session.cwd) !== normalizePath(owner.path) && !project.staleCwds.includes(session.cwd)) project.staleCwds.push(session.cwd);
				placed = project;
			}
		}
		if (!placed && session.cwd) {
			const key = normalizePath(session.cwd);
			const aliasedWsId = aliases[key];
			const target = aliasedWsId ? projectByWsId.get(aliasedWsId) : void 0;
			if (target) {
				target.sessions.push(session);
				if (normalizePath(target.path) !== key && !target.staleCwds.includes(session.cwd)) target.staleCwds.push(session.cwd);
				placed = target;
			} else {
				let project = byPath.get(key);
				if (!project) project = getProject(session.cwd, null);
				project.sessions.push(session);
				placed = project;
				if (project.workspaceId === null) pending.push({
					session,
					project
				});
			}
		}
		if (!placed) {
			warnings.push(`会话 ${session.id} 无 cwd 且不在任何工作区，跳过`);
			continue;
		}
		remember(session, placed);
	}
	/**
	* 子会话跟随父会话：宿主只在子代理转录头里写 parentSession，而子会话的 cwd 常是 ~/.dsh
	* 或父项目的旧路径，按 cwd 归桶会让它们留在孤儿桶里当「无主转录」。父会话既然已经落在
	* 某个工作区，子会话就该一起进去（标记 derived，且不往 staleCwds 里塞 ~/.dsh 这种噪声）。
	* 父会话本身可能也是另一个子会话（多级委派），所以迭代到不动为止。
	*/
	let moved = true;
	let guard = 0;
	while (moved && guard < 8) {
		moved = false;
		guard += 1;
		for (const entry of pending) {
			if (entry.project.workspaceId !== null) continue;
			const parent = entry.session.parentSession;
			if (!parent) continue;
			const parentProject = sessionIdVariants(parent).map((key) => projectBySessionKey.get(key)).find((candidate) => candidate !== void 0);
			if (!parentProject || parentProject.workspaceId === null) continue;
			const index = entry.project.sessions.indexOf(entry.session);
			if (index < 0) continue;
			entry.project.sessions.splice(index, 1);
			entry.session.derived = true;
			parentProject.sessions.push(entry.session);
			derivedIds.add(entry.session.id);
			remember(entry.session, parentProject);
			entry.project = parentProject;
			moved = true;
		}
	}
	const projects = [...byPath.values()].filter((project) => project.workspaceId !== null || project.sessions.length > 0);
	for (const project of projects) {
		project.sessions.sort((a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0));
		project.lastActivityAt = project.sessions[0]?.lastActivityAt ?? null;
	}
	projects.sort((a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0));
	return projects;
}
// src/model/batch.ts
/** 串行执行；单条失败继续，不并发（宿主 fs/状态操作并发没有收益，只有竞态） */
async function runSerialBatch(ids, run, onProgress) {
	const succeeded = [];
	const skipped = [];
	const failures = [];
	let done = 0;
	for (const id of ids) {
		try {
			if (await run(id) === "skip") skipped.push(id);
			else succeeded.push(id);
		} catch (err) {
			failures.push({
				id,
				error: err?.message ?? String(err)
			});
		}
		done += 1;
		onProgress?.(done, ids.length);
	}
	return {
		requested: ids.length,
		succeeded,
		skipped,
		failures,
		remaining: failures.map((f) => f.id)
	};
}
/** 命中前的上下文长度 */
const SNIPPET_LEAD = 40;
/** 单条消息参与匹配的文本上限（超长粘贴截断，避免整段 JSON 撑爆内存） */
const MAX_MATCH_CHARS = 2e4;
function isLowSurrogate(code) {
	return code >= 56320 && code <= 57343;
}
/** 码元切片，边界落在代理对中间时向外扩一格 */
function wholeChars(text, start, end) {
	let s = Math.max(0, start);
	let e = Math.min(text.length, end);
	if (s > 0 && s < text.length && isLowSurrogate(text.charCodeAt(s))) s -= 1;
	if (e > 0 && e < text.length && isLowSurrogate(text.charCodeAt(e))) e += 1;
	return text.slice(s, e);
}
/** 逐码元小写折叠；单个码元可能折叠成多个（少数语言），因此要带下标映射 */
function fold(text) {
	let folded = "";
	const map = [];
	for (let i = 0; i < text.length; i += 1) {
		const lower = text[i].toLowerCase();
		for (let k = 0; k < lower.length; k += 1) {
			folded += lower[k];
			map.push(i);
		}
	}
	return {
		folded,
		map
	};
}
/** 把空白折叠成单个空格：转录里的换行/缩进对摘要没有信息量 */
function flatten(text) {
	return text.replace(/\s+/g, " ").trim();
}
function textOfParts(parts) {
	if (!Array.isArray(parts)) return "";
	const out = [];
	for (const part of parts) if (part?.type === "text" && typeof part.text === "string" && part.text) out.push(part.text);
	return out.join("\n");
}
function eventTime(evt) {
	return typeof evt.time === "number" ? evt.time : null;
}
/** 解析一条转录事件为消息；非消息事件、工具消息、注入消息返回 null */
function parseMessageLine(line) {
	if (!line.includes("/message")) return null;
	let evt;
	try {
		evt = JSON.parse(line);
	} catch {
		return null;
	}
	const seq = typeof evt.seq === "number" ? evt.seq : -1;
	if (evt.type === "user/message") {
		if (evt.data?.role !== "user") return null;
		if (evt.data?.source?.kind !== "user") return null;
		const text = textOfParts(evt.data.content);
		return text ? {
			seq,
			role: "user",
			text,
			time: eventTime(evt)
		} : null;
	}
	if (evt.type === "assistant/message") {
		if (evt.data?.message?.role !== "assistant") return null;
		const text = textOfParts(evt.data.message.content);
		return text ? {
			seq,
			role: "assistant",
			text,
			time: eventTime(evt)
		} : null;
	}
	return null;
}
/** 大小写折叠后的匹配区间（元文字下标，左闭右开） */
function matchRanges(text, query) {
	const q = query.trim().toLowerCase();
	if (!q) return [];
	const { folded, map } = fold(text);
	const out = [];
	let cursor = 0;
	while (cursor <= folded.length - q.length) {
		const idx = folded.indexOf(q, cursor);
		if (idx < 0) break;
		const start = map[idx] ?? 0;
		const end = (map[idx + q.length - 1] ?? start) + 1;
		out.push([start, end]);
		cursor = idx + q.length;
	}
	return out;
}
/** 命中片段：命中点前留 40 码元上下文，总长不超过 200 码元 */
function snippetOf(text, query) {
	const flat = flatten(text).slice(0, MAX_MATCH_CHARS);
	const hits = matchRanges(flat, query);
	if (hits.length === 0) return {
		snippet: flat.slice(0, 200),
		ranges: []
	};
	const first = hits[0];
	Math.max(1, query.trim().length);
	const start = Math.max(0, first[0] - SNIPPET_LEAD);
	const end = Math.min(flat.length, start + 200);
	const shifted = wholeChars(flat, start, end).trimStart();
	const prefix = `${start > 0 ? "…" : ""}${shifted}${end < flat.length ? "…" : ""}`;
	return {
		snippet: prefix,
		ranges: matchRanges(prefix, query)
	};
}
/** 单会话正文检索：流式扫描，命中达到上限立刻停止解压 */
async function searchSessionContent(ref, query, perSession = 20, signal) {
	const q = query.trim();
	if (!q) return [];
	const hits = [];
	await streamLines(ref.file, (line) => {
		if (signal?.aborted) return false;
		const msg = parseMessageLine(line);
		if (!msg) return;
		if (!msg.text.slice(0, MAX_MATCH_CHARS).toLowerCase().includes(q.toLowerCase())) return;
		const { snippet, ranges } = snippetOf(msg.text, q);
		hits.push({
			sessionId: ref.sessionId,
			seq: msg.seq,
			role: msg.role,
			time: msg.time,
			snippet,
			ranges
		});
		return hits.length < perSession ? void 0 : false;
	});
	return hits;
}
/**
* 跨会话检索：**串行**按批扫描。
* 串行不是保守，而是必须：并发解压十几个大转录会把宿主事件循环占满（详见 sources.readSessionHeads 的注释）。
*/
async function searchAcrossSessions(refs, options) {
	const limit = options.limit ?? 50;
	const perSession = options.perSession ?? 5;
	const hits = [];
	const skipped = [];
	let scanned = 0;
	let truncated = false;
	for (let i = 0; i < refs.length; i += 20) {
		const batch = refs.slice(i, i + 20);
		for (const ref of batch) {
			if (options.signal?.aborted || hits.length >= limit) {
				truncated = true;
				break;
			}
			try {
				const found = await searchSessionContent(ref, options.query, perSession, options.signal);
				hits.push(...found);
			} catch {
				skipped.push(ref.sessionId);
			}
			scanned += 1;
			options.onProgress?.(scanned, refs.length);
		}
		if (truncated) break;
	}
	return {
		hits: hits.slice(0, limit),
		scanned,
		skipped,
		truncated
	};
}
/**
* 只读预览：有查询时取首次命中前后各 2 条（共 8 条），没有命中或无查询时取最近 8 条。
* 单条消息截断到 2000 码元——预览是「看一眼上下文」，不是导出全文。
*/
async function previewSessionContent(file, query = "", limit = 8, signal) {
	const q = query.trim();
	const keep = limit + 4;
	const buf = [];
	let seen = 0;
	let hitAt = null;
	await streamLines(file, (line) => {
		if (signal?.aborted) return false;
		const msg = parseMessageLine(line);
		if (!msg) return;
		const index = seen;
		seen += 1;
		buf.push(msg);
		if (buf.length > keep) buf.shift();
		if (hitAt === null && q && msg.text.slice(0, MAX_MATCH_CHARS).toLowerCase().includes(q.toLowerCase())) hitAt = index;
		if (hitAt !== null && index >= hitAt + 2) return false;
	});
	const base = seen - buf.length;
	return {
		messages: (hitAt === null ? buf : buf.filter((_, i) => {
			const at = base + i;
			return at >= hitAt - 2 && at <= hitAt + 5;
		})).slice(-limit).map((m) => ({
			seq: m.seq,
			role: m.role,
			time: m.time,
			text: m.text.length > 2e3 ? `${m.text.slice(0, 2e3)}…` : m.text,
			hit: Boolean(q) && m.text.slice(0, MAX_MATCH_CHARS).toLowerCase().includes(q.toLowerCase())
		})),
		scanned: seen
	};
}
// src/host/deleteSession.ts
/**
* 会话删除（宿主侧）：物理清理转录目录 + 投影缓存 + 工作区记账。
*
* 语义对齐参考实现 @michengai/dsh-archive-manager 1.1.22 的 deleteSessionCore：
*   1. 校验会话已知（实时实例或持久化头部），未知时只清残留记账后按幂等成功返回；
*   2. 实时会话先 flush 再 detach（保证删除前没有排队写入复活文件）；
*   3. 删投影缓存、子代理（origin=subagent）会话、spill 目录；
*   4. 删转录目录——仅当 jsonl 后端能证明目录归属时递归删目录，否则只删定位到的工件；
*   5. 物理删除成功后才动记账（归档集合、工作区 sessionIds），失败保留记账以便重试；
*   6. 广播 api-session/removed，让宿主侧边栏与我们的 /state 一起刷新。
*
* 与参考实现的差异：不继承 WorkspaceRegistry、不注册 Typert 远程方法，
* 而是在插件自己的 webServer 路由里调用同一批宿主服务（sessions / sessionPersistence /
* sessionProjectionCache / workspaceRegistry），从而不依赖 archive-manager 是否安装。
* 能力探测失败时返回明确错误，绝不猜测路径删除。
*/
/** session-<uuid> 或裸 uuid；拒绝路径分隔符与点号目录 */
const SESSION_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const warn = (ctx, message) => {
	try {
		ctx.logger?.warn(`dsh-overview: ${message}`);
	} catch {}
};
async function pathExists(path) {
	try {
		await stat(path);
		return true;
	} catch {
		return false;
	}
}
/** 官方 JSONL 目录分段编码（非 [A-Za-z0-9._-] 一律 ~XXXX） */
function encodeSegment(text) {
	return text.replace(/[^A-Za-z0-9._-]/g, (ch) => `~${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}`);
}
/**
* 证明 transcript 所在目录归属该会话，返回可递归删除的目录。
* 任何一环对不上就返回 undefined——调用方退化为只删 locate() 指到的工件。
*/
function jsonlSessionDirectory(persistence, header, location) {
	if (persistence.name !== "session-persistence-jsonl" || location.kind !== "jsonl") return void 0;
	const root = persistence.root ?? persistence.config?.root;
	if (typeof root !== "string" || !isAbsolute(root)) return void 0;
	const cwd = header.cwd;
	const id = header.id;
	if (typeof cwd !== "string" || typeof id !== "string") return void 0;
	const project = `--${(encodeSegment(cwd.replace(/[\\/:]+/g, "-")).replace(/^-+/, "") || "root").slice(0, 251)}--`;
	const segment = id === "." ? "~002E" : id === ".." ? "~002E~002E" : encodeSegment(id);
	const directory = join(resolve(root), project, segment);
	if (join(directory, basename(location.path)) !== join(location.path)) return void 0;
	return directory;
}
async function statHeader(persistence, sessionId) {
	if (typeof persistence?.stat !== "function") return void 0;
	try {
		return (await persistence.stat(sessionId))?.header;
	} catch {
		return;
	}
}
/** 只认子代理会话；fork 分支有 parentSession 但 origin 不同，绝不级联。 */
async function listSubagentDescendants(persistence, parentId) {
	if (typeof persistence?.list !== "function") return [];
	let listed;
	try {
		listed = await persistence.list();
	} catch {
		return [];
	}
	const out = [];
	for (const item of listed) {
		const header = item?.header ?? item;
		if (typeof header?.id !== "string") continue;
		if (header.parentSession !== parentId) continue;
		if (header.origin !== "subagent") continue;
		out.push({
			id: header.id,
			header
		});
	}
	return out;
}
async function publishColdSessionRemoval(ctx, sessions, persistence, sessionId) {
	if (typeof persistence?.prepare !== "function" || typeof sessions?.enter !== "function") return;
	try {
		const preparation = await persistence.prepare(sessionId);
		const detach = sessions.enter(preparation.session);
		try {
			sessions.announce?.(preparation.session);
		} finally {
			detach?.();
			preparation[Symbol.dispose]?.();
		}
	} catch (error) {
		warn(ctx, `could not publish removal for stored session "${sessionId}": ${String(error)}`);
	}
}
/** 删除转录工件；返回被删路径。失败抛错（调用方据此保留记账）。 */
async function removeTranscriptArtifact(ctx, persistence, sessionId, header) {
	if (typeof persistence?.locate !== "function") throw new Error(`cannot delete session "${sessionId}": sessionPersistence does not expose locate()`);
	const location = persistence.locate(header);
	if (typeof location?.path !== "string") throw new Error(`cannot delete session "${sessionId}": transcript location unavailable`);
	const located = {
		path: location.path,
		kind: location.kind
	};
	let target = {
		path: located.path,
		kind: "transcript artifact"
	};
	const directory = jsonlSessionDirectory(persistence, header, located);
	if (directory !== void 0) {
		target = {
			path: directory,
			kind: "session directory"
		};
		for (const path of [dirname(directory), directory]) {
			let info;
			try {
				info = await lstat(path);
			} catch (error) {
				if (error.code === "ENOENT") continue;
				throw error;
			}
			if (info.isSymbolicLink()) throw new Error(`refusing to delete through symbolic link "${path}"`);
			if (!info.isDirectory()) throw new Error(`expected session storage directory "${path}"`);
		}
	} else warn(ctx, `session "${sessionId}": directory ownership unverified; deleting artifact only`);
	const existed = await pathExists(target.path);
	await rm(target.path, {
		recursive: true,
		force: true
	});
	if (typeof persistence.stat === "function") {
		let stillPresent;
		let statFailed;
		try {
			stillPresent = await persistence.stat(sessionId);
		} catch (error) {
			statFailed = error;
		}
		if (stillPresent !== void 0) throw new Error(`session "${sessionId}" artifact is still present`);
		if (statFailed !== void 0) {
			const gone = !await pathExists(target.path);
			if (!existed || !gone) throw new Error(`cannot verify removal of session "${sessionId}": stat failed and "${target.path}" was not an artifact removed by this call`);
		}
	}
	return target.path;
}
/** 清残留记账（归档集合 + 每个工作区的 sessionIds + 父类索引） */
async function cleanupBookkeeping(ctx, registry, sessionId) {
	if (!registry) return;
	try {
		const state = registry.requireState?.();
		if (state !== void 0 && typeof registry.setState === "function") {
			const archived = Array.isArray(state.archivedSessionIds) ? state.archivedSessionIds : [];
			if (archived.includes(sessionId)) await registry.setState({
				...state,
				archivedSessionIds: archived.filter((id) => id !== sessionId)
			});
		}
		const table = registry.requireTable?.();
		for (const workspaceId of state?.workspaceIds ?? []) {
			if (typeof table?.get !== "function" || typeof table.update !== "function") break;
			if (!table.get(workspaceId)?.sessionIds?.includes(sessionId)) continue;
			const next = await table.update(workspaceId, (current) => ({
				...current,
				sessionIds: (current["sessionIds"] ?? []).filter((id) => id !== sessionId),
				updatedAt: (/* @__PURE__ */ new Date()).toISOString()
			}));
			const entity = registry.entities?.get?.(workspaceId);
			if (entity) entity.record = next;
		}
	} catch (error) {
		warn(ctx, `bookkeeping cleanup for "${sessionId}" failed: ${String(error)}`);
	}
	registry.headers?.delete?.(sessionId);
	registry.sessionPaths?.delete?.(sessionId);
	registry.invalidSessionPaths?.delete?.(sessionId);
}
async function cleanupSpill(ctx, sessionId) {
	try {
		const spill = ctx.get("spillStore");
		if (typeof spill?.root !== "string") return;
		await rm(join(spill.root, sessionId), {
			recursive: true,
			force: true
		});
	} catch (error) {
		warn(ctx, `spill cleanup for "${sessionId}" failed: ${String(error)}`);
	}
}
/** 清投影缓存条目（能力缺失时静默跳过） */
async function dropProjectionCache(projCache, sessionId) {
	const table = projCache?.requireTable?.();
	const drop = table?.delete;
	if (typeof drop !== "function") return;
	await drop.call(table, sessionId);
}
async function deleteSessionArtifacts(ctx, sessionId) {
	if (!SESSION_ID_RE.test(sessionId) || sessionId === "." || sessionId === "..") throw new Error(`invalid session id: ${sessionId}`);
	const warnings = [];
	const note = (message) => {
		warnings.push(message);
		warn(ctx, message);
	};
	const sessions = ctx.get("sessions");
	const persistence = ctx.get("sessionPersistence");
	const projCache = ctx.get("sessionProjectionCache");
	const registry = ctx.get("workspaceRegistry");
	const live = sessions?.get?.(sessionId);
	const header = live?.header ?? await statHeader(persistence, sessionId);
	if (header === void 0 && live === void 0) {
		try {
			await dropProjectionCache(projCache, sessionId);
		} catch (error) {
			note(`projection cache cleanup failed: ${String(error)}`);
		}
		await cleanupBookkeeping(ctx, registry, sessionId);
		return {
			deleted: true,
			skipped: true,
			warnings
		};
	}
	if (live !== void 0) {
		if (typeof sessions?.flush === "function") try {
			await sessions.flush(live);
		} catch (error) {
			note(`flush before delete failed: ${String(error)}`);
		}
		try {
			const entry = sessions?.liveEntryFor?.(live);
			if (entry !== void 0) sessions?.detachEntered?.(entry);
		} catch (error) {
			note(`detach before delete failed: ${String(error)}`);
		}
	} else await publishColdSessionRemoval(ctx, sessions, persistence, sessionId);
	try {
		await dropProjectionCache(projCache, sessionId);
	} catch (error) {
		note(`projection cache cleanup failed: ${String(error)}`);
	}
	const queue = await listSubagentDescendants(persistence, sessionId);
	while (queue.length > 0) {
		const child = queue.shift();
		try {
			await removeTranscriptArtifact(ctx, persistence, child.id, child.header);
			queue.push(...await listSubagentDescendants(persistence, child.id));
		} catch (error) {
			note(`subagent "${child.id}" cleanup failed: ${String(error)}`);
		}
	}
	await cleanupSpill(ctx, sessionId);
	if (header === void 0) throw new Error(`cannot delete session "${sessionId}": header unavailable for transcript lookup`);
	const removedPath = await removeTranscriptArtifact(ctx, persistence, sessionId, header);
	await cleanupBookkeeping(ctx, registry, sessionId);
	try {
		ctx.emit?.("api-session/removed", sessionId);
	} catch (error) {
		note(`removal event failed: ${String(error)}`);
	}
	return {
		deleted: true,
		warnings,
		removedPath
	};
}
/**
* 清理宿主归档缓存里属于该会话的陈旧记录。
*
* 归档缓存（session_projcache_archive_manager_v2/sessions/*.json）是宿主写入的元数据快照，
* 会话被删除后不会自动消失；只要记录还在，聚合层就会把它当成"归档会话"重新列出来，
* 表现为「无标题、点删除提示成功但刷新后又回来」。这里按 record.sessionId 精确匹配删除，
* 只删缓存文件，不动任何转录/工作区数据；损坏或无法解析的文件一律跳过。
*/
async function purgeArchiveCache(home, sessionId) {
	const dir = join(home, "storages", "session_projcache_archive_manager_v2", "sessions");
	let names;
	try {
		names = await readdir(dir);
	} catch {
		return [];
	}
	const removed = [];
	for (const name of names) {
		if (!name.endsWith(".json")) continue;
		const file = join(dir, name);
		try {
			if (JSON.parse(await readFile(file, "utf-8"))?.record?.sessionId === sessionId) {
				await unlink(file);
				removed.push(name);
			}
		} catch {}
	}
	return removed;
}
function aliasFilePath(home) {
	return join(home, "storages", "dsh-overview-aliases.json");
}
function readAliases(home) {
	const file = aliasFilePath(home);
	try {
		if (!existsSync(file)) return {};
		const map = JSON.parse(readFileSync(file, "utf8"))?.cwds;
		if (!map || typeof map !== "object") return {};
		const out = {};
		for (const [cwd, workspaceId] of Object.entries(map)) if (typeof cwd === "string" && cwd && typeof workspaceId === "string" && workspaceId) out[cwd] = workspaceId;
		return out;
	} catch {
		return {};
	}
}
function writeAliases(home, aliases) {
	const file = aliasFilePath(home);
	const tmp = `${file}.tmp-${process.pid}`;
	try {
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(tmp, `${JSON.stringify({
			version: 1,
			cwds: aliases
		}, null, 2)}\n`, "utf8");
		renameSync(tmp, file);
	} catch (err) {
		return {
			ok: false,
			error: `写入归属表失败: ${err.message}`
		};
	}
	const check = readAliases(home);
	return Object.keys(aliases).length === Object.keys(check).length && Object.entries(aliases).every(([cwd, ws]) => check[cwd] === ws) ? { ok: true } : {
		ok: false,
		error: "写入归属表后回读校验失败"
	};
}
/** 把一条旧 cwd 并进目标工作区（幂等：已指向同一工作区则 changed=false） */
function adoptCwdIntoWorkspace(home, workspaceId, cwd) {
	const key = normalizePath(cwd);
	const aliases = readAliases(home);
	const result = {
		ok: false,
		changed: false,
		aliases,
		path: aliasFilePath(home)
	};
	if (!workspaceId.trim()) {
		result.error = "workspaceId 不能为空";
		return result;
	}
	if (!key) {
		result.error = "cwd 不能为空";
		return result;
	}
	if (aliases[key] === workspaceId.trim()) {
		result.ok = true;
		return result;
	}
	const next = {
		...aliases,
		[key]: workspaceId.trim()
	};
	const write = writeAliases(home, next);
	result.ok = write.ok;
	result.changed = write.ok;
	result.aliases = write.ok ? next : aliases;
	if (write.error) result.error = write.error;
	return result;
}
/** 撤销并入（忘记这条旧 cwd 的归属） */
function forgetCwdAlias(home, cwd) {
	const key = normalizePath(cwd);
	const aliases = readAliases(home);
	const result = {
		ok: true,
		changed: false,
		aliases,
		path: aliasFilePath(home)
	};
	if (!key || !(key in aliases)) return result;
	const next = { ...aliases };
	delete next[key];
	const write = writeAliases(home, next);
	result.ok = write.ok;
	result.changed = write.ok;
	result.aliases = write.ok ? next : aliases;
	if (write.error) result.error = write.error;
	return result;
}
// src/model/transcript.ts
/**
* 只重写转录的第一帧首行，其余帧逐字节保留。
*
* 为什么不像普通文件那样整体解压再整体压缩：宿主每 append 一次写一帧，一份 14MB 的
* 转录实测有 10770 帧；整体重压会把这 10770 帧合并成一帧，体积、mtime、以及宿主可能
* 依赖的「帧 = 一次追加」形态都会变（archive-manager 的迁移也是只动首帧）。首帧只含
* 会话头（必要时含紧随的少量事件），改一行 cwd 后重新压这一帧就够。
*
* 返回 null 表示这段字节不是它能处理的形态（不是 zstd、或首帧解析不出来）。
*/
function rewriteHeadLine(bytes, patch) {
	if (bytes.length < 4 || bytes.readUInt32LE(0) !== 4247762216) return null;
	const end = zstdFrameEnd(bytes, 0);
	if (end === null || end === -1) return null;
	const frame = bytes.subarray(0, end);
	let text;
	try {
		text = zstdDecompressSync(frame).toString("utf8");
	} catch {
		return null;
	}
	const newlineAt = text.indexOf("\n");
	const firstLine = newlineAt === -1 ? text : text.slice(0, newlineAt);
	const rest = newlineAt === -1 ? "" : text.slice(newlineAt);
	let head;
	try {
		const parsed = JSON.parse(firstLine);
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
		head = parsed;
	} catch {
		return null;
	}
	if (head.type !== "session") return null;
	patch(head);
	const rebuilt = zstdCompressSync(Buffer.from(JSON.stringify(head) + rest, "utf8"));
	return Buffer.concat([rebuilt, bytes.subarray(end)]);
}
/** 从转录字节里读出会话头（只要首帧首行），失败返回 null */
function headFromBytes(bytes) {
	if (bytes.length < 4 || bytes.readUInt32LE(0) !== 4247762216) return null;
	const end = zstdFrameEnd(bytes, 0);
	if (end === null || end === -1) return null;
	try {
		const firstLine = zstdDecompressSync(bytes.subarray(0, end)).toString("utf8").split("\n", 1)[0] ?? "";
		const parsed = JSON.parse(firstLine);
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
		return parsed;
	} catch {
		return null;
	}
}
// src/host/migrate.ts
/** 迁移前的原件备份目录（放在 storages 下，和宿主自己的数据分开） */
const MIGRATION_BACKUP_DIR = "dsh-overview-migration-backup";
/**
* 宿主按 cwd 反推会话目录名：`--<把非法字符折成 '-' 的可读路径>--`（实测 44 个转录，
* 43 个符合；唯一例外是大小写被系统还原过，见 resolveSlugDirName 的兜底）。
*/
function sessionSlug(cwd) {
	return `--${cwd.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 251)}--`;
}
/**
* 目标工作区的目录名：已经有会话的，沿用磁盘上的实际目录名（Windows 大小写不敏感，
* 计算出的名字可能和宿主当年创建的不一致）；没有则用计算值。
*/
function resolveSlugDirName(root, cwd) {
	const expected = sessionSlug(cwd);
	if (existsSync(join(root, expected))) return expected;
	try {
		const hit = readdirSync(root).find((name) => name.toLowerCase() === expected.toLowerCase());
		if (hit) return hit;
	} catch {}
	return expected;
}
async function findTranscript(home, sessionId) {
	const res = await readSessionHeads(sessionsRoot(home));
	const wanted = new Set(sessionIdVariants(sessionId));
	for (const info of res.data) {
		if (!wanted.has(info.head.id)) continue;
		return {
			file: info.file,
			cwd: typeof info.head.cwd === "string" ? info.head.cwd : null
		};
	}
	return null;
}
/**
* 把一条会话真正迁到目标工作区：改写转录头 cwd + 搬到对应目录。
*
* 为什么需要这一步：宿主侧栏按**转录头里的 cwd** 解析工作区，插件归属表只影响插件自己的
* 聚合视图；用户在宿主里点开会话仍显示「未分组」。只有把 cwd 改掉，宿主才认。
*
* 安全边界（都是硬约束）：
* - 只重写首帧首行，其余帧逐字节保留（宿主每 append 写一帧，14MB 文件有上万帧）；
* - 写之前先把原件复制到 storages/dsh-overview-migration-backup/<ts>-<id>/；
* - 新目录先写 .stage 临时文件，fsync 后 rename，再回读校验 id 与 cwd；
* - 目标目录已存在则拒绝（不覆盖任何东西）；
* - 校验通过后才删除原目录，失败则清掉半成品并把备份路径报给用户。
*/
async function migrateSessionCwd(home, sessionId, targetPath) {
	const found = await findTranscript(home, sessionId);
	if (!found) return {
		ok: false,
		sessionId,
		from: null,
		to: targetPath,
		moved: false,
		backupPath: null,
		error: "找不到该会话的转录文件"
	};
	const from = found.cwd;
	if (from && normalizePath(from) === normalizePath(targetPath)) return {
		ok: true,
		sessionId,
		from,
		to: targetPath,
		moved: false,
		backupPath: null
	};
	const patched = rewriteHeadLine(readFileSync(found.file), (head) => {
		head.cwd = targetPath;
	});
	if (!patched) return {
		ok: false,
		sessionId,
		from,
		to: targetPath,
		moved: false,
		backupPath: null,
		error: "转录首帧无法解析，已放弃（原件未改动）"
	};
	const check = headFromBytes(patched);
	if (!check || check.cwd !== targetPath || check.id !== sessionId) return {
		ok: false,
		sessionId,
		from,
		to: targetPath,
		moved: false,
		backupPath: null,
		error: "改写后的会话头校验失败（原件未改动）"
	};
	const root = sessionsRoot(home);
	const oldDir = dirname(found.file);
	const dirName = basename(oldDir);
	const targetDir = join(root, resolveSlugDirName(root, targetPath), dirName);
	if (normalizePath(targetDir) === normalizePath(oldDir)) return {
		ok: false,
		sessionId,
		from,
		to: targetPath,
		moved: false,
		backupPath: null,
		error: "目标目录与源目录相同，拒绝覆盖"
	};
	if (existsSync(targetDir)) return {
		ok: false,
		sessionId,
		from,
		to: targetPath,
		moved: false,
		backupPath: null,
		error: "目标目录已存在同名会话，已放弃"
	};
	const backupPath = join(home, "storages", MIGRATION_BACKUP_DIR, `${Date.now()}-${dirName}`);
	mkdirSync(backupPath, { recursive: true });
	copyFileSync(found.file, join(backupPath, "session.v4.jsonl.zstd"));
	writeFileSync(join(backupPath, "meta.json"), JSON.stringify({
		sessionId,
		from,
		to: targetPath,
		sourceFile: found.file,
		at: Date.now()
	}, null, 2));
	const stage = join(targetDir, `.stage-${process.pid}`);
	try {
		mkdirSync(targetDir, { recursive: true });
		writeFileSync(stage, patched);
		renameSync(stage, join(targetDir, "session.v4.jsonl.zstd"));
		const written = headFromBytes(readFileSync(join(targetDir, "session.v4.jsonl.zstd")));
		if (!written || written.id !== sessionId || written.cwd !== targetPath) throw new Error("回读校验失败：写入的会话头与预期不符");
	} catch (error) {
		try {
			if (existsSync(stage)) unlinkSync(stage);
			if (existsSync(targetDir)) rmSync(targetDir, {
				recursive: true,
				force: true
			});
		} catch {}
		return {
			ok: false,
			sessionId,
			from,
			to: targetPath,
			moved: false,
			backupPath,
			error: `${error instanceof Error ? error.message : String(error)}（原件备份在 ${backupPath}）`
		};
	}
	try {
		rmSync(oldDir, {
			recursive: true,
			force: true
		});
	} catch (error) {
		return {
			ok: true,
			sessionId,
			from,
			to: targetPath,
			moved: true,
			backupPath,
			error: `已迁移，但旧目录未能删除：${error instanceof Error ? error.message : String(error)}`
		};
	}
	return {
		ok: true,
		sessionId,
		from,
		to: targetPath,
		moved: true,
		backupPath
	};
}
/**
* 顺手把 id 补进宿主的成员表。
* 以前这条路走不通（宿主按 cwd 过滤，追加的 id 会被下一次写入连带抹掉）；
* 迁移之后会话 cwd 已经等于工作区路径，不再被过滤，所以这次追加是站得住的 —— 但仍属
* best-effort：宿主内存里还有一份，只有重启后才会读到。
*/
function addSessionIdsToWorkspace(home, workspaceId, sessionIds) {
	const file = workspaceJsonPath(home);
	try {
		const raw = JSON.parse(readFileSync(file, "utf8"));
		const entry = (raw["tables"]?.["workspaces"])?.[workspaceId];
		if (!entry) return {
			added: [],
			error: "工作区不存在"
		};
		const entryRecord = entry;
		const current = Array.isArray(entryRecord["sessionIds"]) ? entryRecord["sessionIds"].filter((x) => typeof x === "string") : [];
		const prefixed = current.some((id) => id.startsWith("session-"));
		const existing = new Set(current);
		const added = [];
		for (const id of sessionIds) {
			const storeId = prefixed && !id.startsWith("session-") ? `session-${id}` : id;
			if (existing.has(storeId)) continue;
			current.push(storeId);
			existing.add(storeId);
			added.push(storeId);
		}
		if (added.length === 0) return { added };
		entryRecord["sessionIds"] = current;
		const tmp = `${file}.tmp-${process.pid}`;
		writeFileSync(tmp, JSON.stringify(raw, null, 2));
		renameSync(tmp, file);
		return { added };
	} catch (error) {
		return {
			added: [],
			error: error instanceof Error ? error.message : String(error)
		};
	}
}
// src/host/index.ts
/**
* dsh-overview 宿主侧插件。
*
* 职责：读取 ~/.dsh 存储聚合出 WorkbenchState，通过宿主 webServer 暴露
* REST + SSE，供渲染端工作台 UI 消费。
*
* 写入边界：默认零写入。只有两个显式用户动作会改宿主数据 ——
*   1) 永久删除会话（/session/delete、/session/batch）删转录与投影缓存；
*   2) 并入工作区（/session/adopt）把一条旧 cwd 记进插件自己的归属表，用于项目改名后的归组。
* 其余路径（/state、/events、/search、/preview）只读。
*
* 服务注入与路由形态参照 browser-dock / dsh-better-sidebar 的成熟用法：
*   ctx.inject(['webServer'], (scope) => scope.webServer.register({ kind, path, handler }))
*/
const name = "dsh-overview";
const SSE_DEBOUNCE_MS = 400;
/** SSE 心跳：避免代理/休眠把长连接静默掐掉，客户端 EventSource 无需处理注释行 */
const SSE_HEARTBEAT_MS = 25e3;
function apply(ctx) {
	ctx.inject(["webServer"], ((scope) => {
		const home = dshHome();
		let state = null;
		let revision = 0;
		let lastSignature = "";
		let building = null;
		const sseClients = /* @__PURE__ */ new Set();
		const signature = (s) => JSON.stringify({
			...s,
			generatedAt: ""
		});
		const broadcast = () => {
			for (const res of sseClients) {
				const r = res;
				if (r.writableEnded) {
					sseClients.delete(res);
					continue;
				}
				try {
					r.write("event: change\ndata: changed\n\n");
				} catch {
					sseClients.delete(res);
				}
			}
		};
		/** 单飞构建：并发请求共享同一次扫描，避免事件风暴下重复解压 */
		const buildOnce = () => {
			if (!building) building = buildState({
				home,
				aliases: readAliases(home)
			}).finally(() => {
				building = null;
			});
			return building;
		};
		const rebuild = async () => {
			try {
				const next = await buildOnce();
				const sig = signature(next);
				if (sig === lastSignature) return;
				state = next;
				lastSignature = sig;
				revision += 1;
				broadcast();
			} catch {}
		};
		let timer = null;
		const scheduleRebuild = () => {
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => void rebuild(), SSE_DEBOUNCE_MS);
		};
		const watchRoots = [
			"sessions",
			"storages",
			"storages/session_projcache/sessions",
			"storages/session_projcache_archive_manager_v2/sessions"
		];
		const watchers = [];
		for (const rel of watchRoots) try {
			watchers.push(watch(`${home}/${rel}`, scheduleRebuild));
		} catch {}
		scope.effect(() => () => {
			for (const w of watchers) w.close();
			if (timer) clearTimeout(timer);
		}, "dsh-overview watchers");
		const json = (res, status, body) => {
			const r = res;
			r.writeHead(status, {
				"content-type": "application/json; charset=utf-8",
				"cache-control": "no-store"
			});
			r.end(JSON.stringify(body));
		};
		/** 读取请求体（带字节上限，超限 reject） */
		const readBody = (q, limit) => new Promise((resolve, reject) => {
			const chunks = [];
			let size = 0;
			q.on("data", (chunk) => {
				if (!chunk) return;
				size += chunk.length;
				if (size > limit) {
					reject(/* @__PURE__ */ new Error(`request body exceeds ${limit} bytes`));
					return;
				}
				chunks.push(chunk);
			});
			q.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
		});
		scope.effect(() => scope.webServer.register({
			kind: "exact",
			path: "/dsh-overview/state",
			handler: async (_req, res) => {
				if (!state) await rebuild();
				if (!state) {
					json(res, 503, {
						ok: false,
						error: "state unavailable"
					});
					return;
				}
				json(res, 200, {
					revision,
					...state
				});
			}
		}), "dsh-overview /state");
		scope.effect(() => scope.webServer.register({
			kind: "exact",
			path: "/dsh-overview/events",
			handler: (_req, res) => {
				const r = res;
				r.writeHead(200, {
					"content-type": "text/event-stream; charset=utf-8",
					"cache-control": "no-store",
					connection: "keep-alive"
				});
				r.write(`event: hello\ndata: ${JSON.stringify({ revision })}\n\n`);
				sseClients.add(r);
				const heartbeat = setInterval(() => {
					try {
						r.write(`: ping ${Date.now()}\n\n`);
					} catch {
						release();
					}
				}, SSE_HEARTBEAT_MS);
				const release = () => {
					clearInterval(heartbeat);
					sseClients.delete(r);
				};
				r.on("close", release);
			}
		}), "dsh-overview /events");
		scope.effect(() => scope.webServer.register({
			kind: "exact",
			path: "/dsh-overview/session/delete",
			handler: async (req, res) => {
				const q = req;
				if (q.method !== "POST") {
					json(res, 405, {
						ok: false,
						error: "POST only"
					});
					return;
				}
				const origin = typeof q.headers?.origin === "string" ? q.headers.origin : "";
				const hostHeader = typeof q.headers?.host === "string" ? q.headers.host : "";
				if (origin) {
					let originHost = "";
					try {
						originHost = new URL(origin).host;
					} catch {
						originHost = "";
					}
					if (!originHost || originHost !== hostHeader) {
						json(res, 403, {
							ok: false,
							error: "cross-origin request rejected"
						});
						return;
					}
				}
				let body = "";
				try {
					body = await readBody(q, 8192);
				} catch (error) {
					json(res, 413, {
						ok: false,
						error: String(error.message)
					});
					return;
				}
				let sessionId = "";
				try {
					const parsed = JSON.parse(body || "{}");
					if (typeof parsed.sessionId !== "string") throw new Error("sessionId is required");
					sessionId = parsed.sessionId;
				} catch (error) {
					json(res, 400, {
						ok: false,
						error: String(error.message)
					});
					return;
				}
				try {
					const result = await deleteSessionArtifacts(ctx, sessionId);
					try {
						const purged = await purgeArchiveCache(dshHome(), sessionId);
						if (purged.length > 0) result.warnings.push(`purged archive cache: ${purged.join(", ")}`);
					} catch (error) {
						result.warnings.push(`archive cache purge failed: ${String(error)}`);
					}
					await rebuild();
					json(res, 200, {
						ok: true,
						...result
					});
				} catch (error) {
					const message = error instanceof Error ? error.message : String(error);
					json(res, 500, {
						ok: false,
						error: message
					});
				}
			}
		}), "dsh-overview POST /session/delete");
		/** 同源校验：浏览器跨站 fetch 一定带 Origin；无 Origin 的非浏览器调用放行 */
		const sameOrigin = (q) => {
			const origin = typeof q.headers?.origin === "string" ? q.headers.origin : "";
			if (!origin) return true;
			const hostHeader = typeof q.headers?.host === "string" ? q.headers.host : "";
			if (!hostHeader) return false;
			try {
				return new URL(origin).host === hostHeader;
			} catch {
				return false;
			}
		};
		/** POST + 同源 + 体积上限 + JSON 解析；任一步失败都已写好响应并返回 null */
		const guardedJson = async (req, res, limit) => {
			const q = req;
			if (q.method !== "POST") {
				json(res, 405, {
					ok: false,
					error: "POST only"
				});
				return null;
			}
			if (!sameOrigin(q)) {
				json(res, 403, {
					ok: false,
					error: "cross-origin request rejected"
				});
				return null;
			}
			let body = "";
			try {
				body = await readBody(q, limit);
			} catch (error) {
				json(res, 413, {
					ok: false,
					error: String(error.message)
				});
				return null;
			}
			try {
				return JSON.parse(body || "{}");
			} catch (error) {
				json(res, 400, {
					ok: false,
					error: String(error.message)
				});
				return null;
			}
		};
		/** 会话文件索引：头部解析带 (size:mtime) 指纹缓存，重复调用只付目录扫描的钱 */
		const sessionFiles = async () => {
			const res = await readSessionHeads(sessionsRoot(home));
			const byId = /* @__PURE__ */ new Map();
			const files = [];
			for (const info of res.data) {
				const id = info.head.id;
				files.push({
					sessionId: id,
					file: info.file
				});
				for (const key of sessionIdVariants(id)) byId.set(key, info.file);
			}
			return {
				files,
				byId
			};
		};
		scope.effect(() => scope.webServer.register({
			kind: "exact",
			path: "/dsh-overview/search",
			handler: async (req, res) => {
				const body = await guardedJson(req, res, 8192);
				if (!body) return;
				const query = typeof body.query === "string" ? body.query.trim().slice(0, 200) : "";
				if (!query) {
					json(res, 400, {
						ok: false,
						error: "query is required"
					});
					return;
				}
				const wanted = Array.isArray(body.sessionIds) ? new Set(body.sessionIds.filter((x) => typeof x === "string")) : null;
				const limit = Math.min(100, Math.max(1, typeof body.limit === "number" ? Math.floor(body.limit) : 50));
				try {
					const { files } = await sessionFiles();
					const result = await searchAcrossSessions(wanted ? files.filter((f) => wanted.has(f.sessionId)) : files, {
						query,
						limit,
						perSession: 5
					});
					json(res, 200, {
						ok: true,
						query,
						...result
					});
				} catch (error) {
					json(res, 500, {
						ok: false,
						error: String(error.message)
					});
				}
			}
		}), "dsh-overview POST /search");
		scope.effect(() => scope.webServer.register({
			kind: "exact",
			path: "/dsh-overview/preview",
			handler: async (req, res) => {
				const body = await guardedJson(req, res, 8192);
				if (!body) return;
				const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
				if (!sessionId) {
					json(res, 400, {
						ok: false,
						error: "sessionId is required"
					});
					return;
				}
				const query = typeof body.query === "string" ? body.query.trim().slice(0, 200) : "";
				try {
					const { byId } = await sessionFiles();
					const file = sessionIdVariants(sessionId).map((key) => byId.get(key)).find((p) => typeof p === "string");
					if (!file) {
						json(res, 404, {
							ok: false,
							error: "session transcript not found"
						});
						return;
					}
					const preview = await previewSessionContent(file, query);
					json(res, 200, {
						ok: true,
						sessionId,
						query,
						...preview
					});
				} catch (error) {
					json(res, 500, {
						ok: false,
						error: String(error.message)
					});
				}
			}
		}), "dsh-overview POST /preview");
		scope.effect(() => scope.webServer.register({
			kind: "exact",
			path: "/dsh-overview/session/batch",
			handler: async (req, res) => {
				const body = await guardedJson(req, res, 32768);
				if (!body) return;
				const ids = Array.isArray(body.ids) ? [...new Set(body.ids.filter((x) => typeof x === "string" && x.length > 0))].slice(0, 200) : [];
				if (ids.length === 0) {
					json(res, 400, {
						ok: false,
						error: "ids is required"
					});
					return;
				}
				const warnings = [];
				const result = await runSerialBatch(ids, async (id) => {
					const single = await deleteSessionArtifacts(ctx, id);
					warnings.push(...single.warnings);
					try {
						await purgeArchiveCache(home, id);
					} catch (error) {
						warnings.push(`archive cache purge failed: ${String(error)}`);
					}
					return "ok";
				});
				try {
					await rebuild();
				} catch (error) {
					result.refreshError = String(error.message);
				}
				json(res, 200, {
					ok: result.failures.length === 0,
					...result,
					warnings
				});
			}
		}), "dsh-overview POST /session/batch");
		scope.effect(() => scope.webServer.register({
			kind: "exact",
			path: "/dsh-overview/session/adopt",
			handler: async (req, res) => {
				const body = await guardedJson(req, res, 32768);
				if (!body) return;
				const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : "";
				const cwd = typeof body.cwd === "string" ? body.cwd.trim() : "";
				const forget = body.forget === true;
				if (!cwd || !forget && !workspaceId) {
					json(res, 400, {
						ok: false,
						error: "cwd is required (workspaceId is required unless forget)"
					});
					return;
				}
				const result = forget ? forgetCwdAlias(home, cwd) : adoptCwdIntoWorkspace(home, workspaceId, cwd);
				if (!result.ok) {
					json(res, 500, result);
					return;
				}
				try {
					await rebuild();
				} catch (error) {
					json(res, 200, {
						...result,
						refreshError: String(error.message)
					});
					return;
				}
				json(res, 200, result);
			}
		}), "dsh-overview POST /session/adopt");
		scope.effect(() => scope.webServer.register({
			kind: "exact",
			path: "/dsh-overview/session/migrate",
			handler: async (req, res) => {
				const body = await guardedJson(req, res, 32768);
				if (!body) return;
				const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : "";
				const ids = Array.isArray(body.sessionIds) ? [...new Set(body.sessionIds.filter((x) => typeof x === "string" && x.length > 0))].slice(0, 200) : [];
				if (!workspaceId || ids.length === 0) {
					json(res, 400, {
						ok: false,
						error: "workspaceId and sessionIds are required"
					});
					return;
				}
				const workspace = readWorkspaces(workspaceJsonPath(home)).data.find((w) => w.id === workspaceId);
				if (!workspace) {
					json(res, 404, {
						ok: false,
						error: "工作区不存在"
					});
					return;
				}
				const warnings = [];
				const result = await runSerialBatch(ids, async (id) => {
					const migrated = await migrateSessionCwd(home, id, workspace.path);
					if (!migrated.ok) throw new Error(migrated.error ?? "迁移失败");
					if (migrated.error) warnings.push(`${id}：${migrated.error}`);
				});
				const membership = result.succeeded.length > 0 ? addSessionIdsToWorkspace(home, workspaceId, result.succeeded) : { added: [] };
				if (membership.error) warnings.push(`成员表未更新：${membership.error}`);
				let refreshError;
				try {
					await rebuild();
				} catch (error) {
					refreshError = String(error.message);
				}
				json(res, 200, {
					ok: result.failures.length === 0,
					...result,
					...refreshError ? { refreshError } : {},
					workspace: {
						id: workspace.id,
						path: workspace.path,
						title: workspace.title
					},
					addedSessionIds: membership.added,
					warnings
				});
			}
		}), "dsh-overview POST /session/migrate");
		rebuild();
	}));
}
export { apply, name };
