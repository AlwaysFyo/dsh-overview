import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { normalizePath, sessionIdVariants, sessionsRoot, workspaceJsonPath } from '../model/paths.ts'
import { readSessionHeads } from '../model/sources.ts'
import { headFromBytes, rewriteHeadLine } from '../model/transcript.ts'

/** 迁移前的原件备份目录（放在 storages 下，和宿主自己的数据分开） */
export const MIGRATION_BACKUP_DIR = 'dsh-overview-migration-backup'

export interface MigrateResult {
  ok: boolean
  sessionId: string
  from: string | null
  to: string | null
  moved: boolean
  backupPath: string | null
  error?: string
}

/**
 * 宿主按 cwd 反推会话目录名：`--<把非法字符折成 '-' 的可读路径>--`（实测 44 个转录，
 * 43 个符合；唯一例外是大小写被系统还原过，见 resolveSlugDirName 的兜底）。
 */
export function sessionSlug(cwd: string): string {
  const readable = cwd
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 251)
  return `--${readable}--`
}

/**
 * 目标工作区的目录名：已经有会话的，沿用磁盘上的实际目录名（Windows 大小写不敏感，
 * 计算出的名字可能和宿主当年创建的不一致）；没有则用计算值。
 */
export function resolveSlugDirName(root: string, cwd: string): string {
  const expected = sessionSlug(cwd)
  if (existsSync(join(root, expected))) return expected
  try {
    const hit = readdirSync(root).find((name) => name.toLowerCase() === expected.toLowerCase())
    if (hit) return hit
  } catch {
    // 目录还不存在：用计算值，mkdir 时会建出来
  }
  return expected
}

async function findTranscript(home: string, sessionId: string): Promise<{ file: string; cwd: string | null } | null> {
  const res = await readSessionHeads(sessionsRoot(home))
  const wanted = new Set(sessionIdVariants(sessionId))
  for (const info of res.data) {
    if (!wanted.has(info.head.id)) continue
    return { file: info.file, cwd: typeof info.head.cwd === 'string' ? info.head.cwd : null }
  }
  return null
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
export async function migrateSessionCwd(home: string, sessionId: string, targetPath: string): Promise<MigrateResult> {
  const found = await findTranscript(home, sessionId)
  if (!found) {
    return { ok: false, sessionId, from: null, to: targetPath, moved: false, backupPath: null, error: '找不到该会话的转录文件' }
  }
  const from = found.cwd
  if (from && normalizePath(from) === normalizePath(targetPath)) {
    return { ok: true, sessionId, from, to: targetPath, moved: false, backupPath: null }
  }

  const bytes = readFileSync(found.file)
  const patched = rewriteHeadLine(bytes, (head) => {
    head.cwd = targetPath
  })
  if (!patched) {
    return { ok: false, sessionId, from, to: targetPath, moved: false, backupPath: null, error: '转录首帧无法解析，已放弃（原件未改动）' }
  }
  const check = headFromBytes(patched)
  if (!check || check.cwd !== targetPath || check.id !== sessionId) {
    return { ok: false, sessionId, from, to: targetPath, moved: false, backupPath: null, error: '改写后的会话头校验失败（原件未改动）' }
  }

  const root = sessionsRoot(home)
  const oldDir = dirname(found.file)
  const dirName = basename(oldDir)
  const targetDir = join(root, resolveSlugDirName(root, targetPath), dirName)
  if (normalizePath(targetDir) === normalizePath(oldDir)) {
    return { ok: false, sessionId, from, to: targetPath, moved: false, backupPath: null, error: '目标目录与源目录相同，拒绝覆盖' }
  }
  if (existsSync(targetDir)) {
    return { ok: false, sessionId, from, to: targetPath, moved: false, backupPath: null, error: '目标目录已存在同名会话，已放弃' }
  }

  const backupPath = join(home, 'storages', MIGRATION_BACKUP_DIR, `${Date.now()}-${dirName}`)
  mkdirSync(backupPath, { recursive: true })
  copyFileSync(found.file, join(backupPath, 'session.v4.jsonl.zstd'))
  writeFileSync(
    join(backupPath, 'meta.json'),
    JSON.stringify({ sessionId, from, to: targetPath, sourceFile: found.file, at: Date.now() }, null, 2),
  )

  const stage = join(targetDir, `.stage-${process.pid}`)
  try {
    mkdirSync(targetDir, { recursive: true })
    writeFileSync(stage, patched)
    renameSync(stage, join(targetDir, 'session.v4.jsonl.zstd'))
    const written = headFromBytes(readFileSync(join(targetDir, 'session.v4.jsonl.zstd')))
    if (!written || written.id !== sessionId || written.cwd !== targetPath) {
      throw new Error('回读校验失败：写入的会话头与预期不符')
    }
  } catch (error) {
    try {
      if (existsSync(stage)) unlinkSync(stage)
      if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true })
    } catch {
      // 清理失败不影响把错误报出去（备份还在）
    }
    return {
      ok: false,
      sessionId,
      from,
      to: targetPath,
      moved: false,
      backupPath,
      error: `${error instanceof Error ? error.message : String(error)}（原件备份在 ${backupPath}）`,
    }
  }

  try {
    rmSync(oldDir, { recursive: true, force: true })
  } catch (error) {
    // 新文件已经写好并校验通过，旧目录删不掉只会造成重复：把情况说清楚，不回滚
    return {
      ok: true,
      sessionId,
      from,
      to: targetPath,
      moved: true,
      backupPath,
      error: `已迁移，但旧目录未能删除：${error instanceof Error ? error.message : String(error)}`,
    }
  }

  return { ok: true, sessionId, from, to: targetPath, moved: true, backupPath }
}

/**
 * 顺手把 id 补进宿主的成员表。
 * 以前这条路走不通（宿主按 cwd 过滤，追加的 id 会被下一次写入连带抹掉）；
 * 迁移之后会话 cwd 已经等于工作区路径，不再被过滤，所以这次追加是站得住的 —— 但仍属
 * best-effort：宿主内存里还有一份，只有重启后才会读到。
 */
export function addSessionIdsToWorkspace(home: string, workspaceId: string, sessionIds: string[]): { added: string[]; error?: string } {
  const file = workspaceJsonPath(home)
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
    const tables = raw['tables'] as Record<string, Record<string, unknown>> | undefined
    const table = tables?.['workspaces']
    const entry = table?.[workspaceId]
    if (!entry) return { added: [], error: '工作区不存在' }
    const entryRecord = entry as Record<string, unknown>
    const current = Array.isArray(entryRecord['sessionIds'])
      ? (entryRecord['sessionIds'] as unknown[]).filter((x): x is string => typeof x === 'string')
      : []
    const prefixed = current.some((id) => id.startsWith('session-'))
    const existing = new Set(current)
    const added: string[] = []
    for (const id of sessionIds) {
      const storeId = prefixed && !id.startsWith('session-') ? `session-${id}` : id
      if (existing.has(storeId)) continue
      current.push(storeId)
      existing.add(storeId)
      added.push(storeId)
    }
    if (added.length === 0) return { added }
    entryRecord['sessionIds'] = current
    const tmp = `${file}.tmp-${process.pid}`
    writeFileSync(tmp, JSON.stringify(raw, null, 2))
    renameSync(tmp, file)
    return { added }
  } catch (error) {
    return { added: [], error: error instanceof Error ? error.message : String(error) }
  }
}
