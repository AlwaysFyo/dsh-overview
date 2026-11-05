/**
 * 渲染端偏好（localStorage）。
 *
 * 为什么不用宿主配置：宿主级配置要写 storages/workspace.json 之类的宿主文件，
 * 而本插件的硬边界是「对宿主数据零写入」。纯界面开关放 localStorage，
 * 同源同 profile 下与宿主配置一样持久，且不会因为插件卸载留下脏配置。
 * 需要跨用户/企业强制时，走 bundle patch 的 config（见 README）。
 */
export const PREFS_EVENT = 'dshw-prefs'

export interface Prefs {
  /** 左侧栏入口格子：apply 时才注册 slot，所以改动需要刷新页面 */
  sidebarEntry: boolean
  /** 正文检索（读转录文件），关掉后搜索只匹配项目/会话/待办 */
  contentSearch: boolean
}

const KEYS: Record<keyof Prefs, string> = {
  sidebarEntry: 'dshw-sidebar-entry',
  contentSearch: 'dshw-content-search',
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function readPref<K extends keyof Prefs>(key: K): boolean {
  const raw = storage()?.getItem(KEYS[key])
  return raw === '0' ? false : true
}

export function writePref<K extends keyof Prefs>(key: K, value: boolean): void {
  try {
    storage()?.setItem(KEYS[key], value ? '1' : '0')
  } catch {
    /* 隐私模式写不进去就只影响本次会话 */
  }
  try {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(PREFS_EVENT))
  } catch {
    /* ignore */
  }
}

export function subscribePrefs(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(PREFS_EVENT, fn)
  return () => window.removeEventListener(PREFS_EVENT, fn)
}
