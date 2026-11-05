/**
 * dsh-overview 数据模型。
 *
 * 数据源（全部只读，见 docs/design.md 与 PRD §6）：
 *  1. ~/.dsh/storages/workspace.json                    工作区注册表
 *  2. ~/.dsh/sessions/<slug>/<dir>/session.v4.jsonl.zstd 会话体（zstd JSONL，首行头部）
 *  3. ~/.dsh/storages/session_projcache/sessions/*.json  会话元数据缓存（标题/token/待办等）
 *  4. ~/.dsh/storages/session_projcache_archive_manager_v2/sessions/*.json 归档会话记录
 */

/** projcache 行单元格：宿主通用包装 { ver, seq, val } */
export interface RowCell {
  ver: number
  seq: number
  val: unknown
}

/** projcache / 归档记录共用的 record 结构 */
export interface ProjcacheRecord {
  version: number
  record: {
    /** 仅归档记录携带 */
    sessionId?: string
    identity: {
      formatVersion: number
      /** epoch ms，与会话头 createdAt 一致，是 projcache↔会话文件的关联键之一 */
      createdAt: number
      cwd: string
      isSeeded: boolean
      inheritedEventCount: number
    }
    rows: Record<string, RowCell | undefined>
  }
}

/** 会话文件头部（session.v4.jsonl.zstd 首行） */
export interface SessionHead {
  id: string
  createdAt: number
  cwd: string
  agentPreset?: string
  /** 会话来源；'subagent' 表示子代理会话（宿主不会把它放进工作区的 sessionIds） */
  origin?: string
  delegationDepth?: number
  /** 子代理会话指向的母会话 id（宿主只在子代理转录头里写这个字段） */
  parentSession?: string
  [k: string]: unknown
}

/** token 用量合计（rows.tokenUsage.val.totals） */
export interface TokenTotals {
  uncachedInputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

/**
 * 会话内待办条目（rows.todos.val 的元素）。
 * 实测宿主写入形态：[{ content, status: 'pending'|'in_progress'|'completed' }]，
 * 未知 status 原样保留，UI 按「未完成」计数。
 */
export interface SessionTodoItem {
  content: string
  status: string
}

/** sessions 目录扫描出的单个会话文件信息 */
export interface SessionFileInfo {
  /** 相对 sessions 根的路径：<slug>/<dir> */
  dirName: string
  /** 转录文件绝对路径（标题兜底时按需流式读取） */
  file: string
  head: SessionHead
  /** 文件修改时间（epoch ms） */
  fileMtime: number
  /** 压缩后文件字节数（诊断面板估算磁盘占用） */
  size: number
}

/** 归一化后的会话视图（L1/L2 直接消费） */
export interface SessionMeta {
  id: string
  title: string | null
  /** 归属目录（projcache identity.cwd 或会话头 cwd） */
  cwd: string | null
  createdAt: number | null
  /** 最近一次用户输入时间（rows.sessionListMetadata.val.lastPromptAt） */
  lastPromptAt: number | null
  /** 综合最近活动时间：max(文件 mtime, lastPromptAt)；未知为 null */
  lastActivityAt: number | null
  /** 轮次数（rows.sessionStats.val.turns） */
  turns: number | null
  tokenTotals: TokenTotals | null
  /** 会话内待办（rows.todos.val 解析结果，R6） */
  todos: SessionTodoItem[]
  archived: boolean
  /**
   * 数据来源：
   *  live       会话文件存在
   *  archive    归档缓存记录（会话文件可能已不在 sessions 目录）
   *  cacheOnly  仅有 projcache 记录（会话文件缺失）
   */
  source: 'live' | 'archive' | 'cacheOnly'
  /** sessions 目录下的相对路径（live 才有） */
  dirName: string | null
  /** 会话头 origin（'subagent' 等）；未知为 null */
  origin: string | null
  /** 母会话 id；子代理会话靠它挂到父会话所在的项目 */
  parentSession: string | null
  /** 是否靠「父会话归属」被带进项目的子会话（cwd 与本项目不同，不算 staleCwd） */
  derived: boolean
  /** 压缩后文件字节数（live 才有） */
  sizeBytes: number | null
  /** 转录里没有任何 user/assistant 消息：宿主新建后切走留下的空壳，宿主已不再列出 */
  empty: boolean
}

/** 项目（工作区）聚合视图 */
export interface ProjectState {
  /** workspace id；孤儿会话桶为 'orphan:<cwd>' */
  id: string
  /** 工作区路径；孤儿桶为会话 cwd */
  path: string
  title: string
  workspaceId: string | null
  /** 工作区目录当前是否存在于磁盘（AC-2 路径失效降级） */
  existsOnDisk: boolean
  /** 项目级归档标记（插件自有 status.json，R2；数据源层暂缺，宿主接线后填充） */
  archived?: boolean
  /** 归档时间（epoch ms，R2） */
  archivedAt?: number | null
  /** 归属于该路径的全部会话（含归档），按 lastActivityAt 倒序 */
  sessions: SessionMeta[]
  lastActivityAt: number | null
  /**
   * 项目改名/移动后，旧会话记录里遗留的 cwd（与工作区 path 不一致）。
   * 归属由 workspace.sessionIds 决定，cwd 只作为展示与提示用途。
   */
  staleCwds: string[]
}

/** 投影缓存问题（诊断用；本插件只读不写，修复交给宿主） */
export interface CacheIssue {
  /** no-record: live 会话没有 projcache 记录；no-title: 记录缺失或没写标题行且首条消息兜底失败 */
  kind: 'no-record' | 'no-title'
  sessionId: string
  title: string | null
  cwd: string | null
}

/** 侧栏里看不到的会话（子代理等，宿主不把它们放进工作区 sessionIds） */
export interface UnclaimedSession {
  sessionId: string
  title: string | null
  cwd: string | null
  createdAt: number | null
  origin: string | null
  sizeBytes: number
  dirName: string | null
  /** cwd 是否仍对应一个已注册工作区：true 表示「只是没登记成员表」，false 才是彻底无主 */
  pathRegistered: boolean
}

/** 数据卫生诊断：全部只读证据，不含任何修复动作 */
export interface Diagnostics {
  cacheIssues: CacheIssue[]
  unclaimed: UnclaimedSession[]
  /** 已从列表忽略的归档缓存残留记录数 */
  staleArchiveRecords: number
}

/** 聚合快照（CLI / 宿主 REST / UI 共用） */
export interface WorkbenchState {
  generatedAt: number
  projects: ProjectState[]
  /** 各数据源读取时的降级/告警信息（R5：不白屏，如实上报） */
  warnings: string[]
  diagnostics: Diagnostics
}
