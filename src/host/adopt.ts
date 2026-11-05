import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { normalizePath } from '../model/paths.ts'

/**
 * 「并入工作区」= 插件侧记住「这条旧 cwd 属于哪个工作区」。
 *
 * 为什么不能直接改 workspace.json 的 sessionIds（v0.1.14 的做法，已被真机否证）：
 *  - 宿主的工作区成员表是**内存真相**：插件往文件里追加 id，宿主内存不知道；下次任何
 *    成员表写入（例如删除一个会话）宿主会把内存里的旧列表整体落盘，追加的 id 就消失了；
 *  - 更根本的是宿主的成员表在**读**的时候就会过滤——`sessionIds` 里 cwd 与工作区 path
 *    不一致的会话根本不会被返回（见 @deepseek-ai/dsh-workspace 的 types.d.ts），而项目
 *    改名/搬目录恰恰是 cwd 变了。也就是说宿主语义里这些会话**不可能**成为新工作区的成员，
 *    除了把转录头里的 cwd 重写掉（那是 move 的活，要动 zstd 帧，见 README 的 P4）。
 *
 * 所以这里只写插件自己的归属表：`~/.dsh/storages/dsh-overview-aliases.json`
 * （`cwds[normalizePath(旧目录)] = workspaceId`）。聚合时当成员表查不到时使用它，
 * 详情页据此把会话显示在目标项目下，并在 `staleCwds` 里提示这些会话的 cwd 仍是旧路径。
 * 边界：只影响本插件的归组，宿主侧栏/`dsh --resume` 仍按宿主自己的成员表；文件坏了或
 * 工作区被删则退化为「不并」，绝不猜。
 */
export const ALIAS_VERSION = 1

export interface AliasFile {
  version: number
  /** normalizePath(旧 cwd) → workspaceId */
  cwds: Record<string, string>
}

export interface AliasResult {
  ok: boolean
  changed: boolean
  /** 本次写入后的完整映射（便于前端即时提示） */
  aliases: Record<string, string>
  path: string
  error?: string
}

export function aliasFilePath(home: string): string {
  return join(home, 'storages', 'dsh-overview-aliases.json')
}

export function readAliases(home: string): Record<string, string> {
  const file = aliasFilePath(home)
  try {
    if (!existsSync(file)) return {}
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<AliasFile>
    const map = parsed?.cwds
    if (!map || typeof map !== 'object') return {}
    const out: Record<string, string> = {}
    for (const [cwd, workspaceId] of Object.entries(map)) {
      if (typeof cwd === 'string' && cwd && typeof workspaceId === 'string' && workspaceId) out[cwd] = workspaceId
    }
    return out
  } catch {
    // 归属表是我们自己的缓存：坏了就当没有，不能让整个聚合挂掉
    return {}
  }
}

function writeAliases(home: string, aliases: Record<string, string>): { ok: boolean; error?: string } {
  const file = aliasFilePath(home)
  const tmp = `${file}.tmp-${process.pid}`
  try {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(tmp, `${JSON.stringify({ version: ALIAS_VERSION, cwds: aliases }, null, 2)}\n`, 'utf8')
    renameSync(tmp, file)
  } catch (err) {
    return { ok: false, error: `写入归属表失败: ${(err as Error).message}` }
  }
  // 回读校验：Windows 上 rename 偶发被占用而静默丢写
  const check = readAliases(home)
  const same =
    Object.keys(aliases).length === Object.keys(check).length &&
    Object.entries(aliases).every(([cwd, ws]) => check[cwd] === ws)
  return same ? { ok: true } : { ok: false, error: '写入归属表后回读校验失败' }
}

/** 把一条旧 cwd 并进目标工作区（幂等：已指向同一工作区则 changed=false） */
export function adoptCwdIntoWorkspace(home: string, workspaceId: string, cwd: string): AliasResult {
  const key = normalizePath(cwd)
  const aliases = readAliases(home)
  const result: AliasResult = { ok: false, changed: false, aliases, path: aliasFilePath(home) }
  if (!workspaceId.trim()) {
    result.error = 'workspaceId 不能为空'
    return result
  }
  if (!key) {
    result.error = 'cwd 不能为空'
    return result
  }
  if (aliases[key] === workspaceId.trim()) {
    result.ok = true
    return result
  }
  const next = { ...aliases, [key]: workspaceId.trim() }
  const write = writeAliases(home, next)
  result.ok = write.ok
  result.changed = write.ok
  result.aliases = write.ok ? next : aliases
  if (write.error) result.error = write.error
  return result
}

/** 撤销并入（忘记这条旧 cwd 的归属） */
export function forgetCwdAlias(home: string, cwd: string): AliasResult {
  const key = normalizePath(cwd)
  const aliases = readAliases(home)
  const result: AliasResult = { ok: true, changed: false, aliases, path: aliasFilePath(home) }
  if (!key || !(key in aliases)) return result
  const next = { ...aliases }
  delete next[key]
  const write = writeAliases(home, next)
  result.ok = write.ok
  result.changed = write.ok
  result.aliases = write.ok ? next : aliases
  if (write.error) result.error = write.error
  return result
}
