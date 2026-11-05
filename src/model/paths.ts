import { join } from 'node:path'
import { homedir } from 'node:os'

/** 解析 DSH home（默认 ~/.dsh，可用 DSH_HOME 覆盖，与 browser-dock 同规则） */
export function dshHome(env: NodeJS.ProcessEnv = process.env): string {
  return env['DSH_HOME'] || join(homedir(), '.dsh')
}

export function workspaceJsonPath(home: string): string {
  return join(home, 'storages', 'workspace.json')
}

export function projcacheDir(home: string): string {
  return join(home, 'storages', 'session_projcache', 'sessions')
}

export function archiveDir(home: string): string {
  return join(home, 'storages', 'session_projcache_archive_manager_v2', 'sessions')
}

export function sessionsRoot(home: string): string {
  return join(home, 'sessions')
}

/**
 * 会话 id 的两种写法：宿主在 workspace.json 的 sessionIds 与 global.archivedSessionIds
 * 里带 'session-' 前缀，而转录文件头里的 id 不带（本机实测两种写法同时存在）。
 * 关联时必须双向匹配，否则改名/归档后的会话会「查不到」。
 */
export function sessionIdVariants(id: string): string[] {
  return id.startsWith('session-') ? [id, id.slice('session-'.length)] : [id, `session-${id}`]
}

/** Windows 大小写不敏感；统一成小写 + 正斜杠比较键 */
export function normalizePath(p: string): string {
  const back = p.replace(/\//g, '\\').trim()
  const noTrail = back.replace(/\\+$/, '')
  return process.platform === 'win32' ? noTrail.toLowerCase() : noTrail
}
