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
}

/** 聚合快照（CLI / 宿主 REST / UI 共用） */
export interface WorkbenchState {
  generatedAt: number
  projects: ProjectState[]
  /** 各数据源读取时的降级/告警信息（R5：不白屏，如实上报） */
  warnings: string[]
}
