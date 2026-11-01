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

/** Windows 大小写不敏感；统一成小写 + 正斜杠比较键 */
export function normalizePath(p: string): string {
  const back = p.replace(/\//g, '\\').trim()
  const noTrail = back.replace(/\\+$/, '')
  return process.platform === 'win32' ? noTrail.toLowerCase() : noTrail
}
