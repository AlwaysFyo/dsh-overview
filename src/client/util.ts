/** 展示工具：相对时间 / 数字缩写 / 命中高亮 */

export function fmtRelative(ms: number | null, now = Date.now()): string {
  if (ms === null) return '—'
  const diff = now - ms
  if (diff < 0) return '刚刚'
  const min = Math.floor(diff / 60_000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} 天前`
  const date = new Date(ms)
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

/**
 * 数据新鲜度的粗粒度文案：刚刚 / 几分钟前 / 几小时前 / 几天前。
 * 与 fmtRelative 的区别：不落具体时刻——「最近活动 · 昨天 22:41」这种精确表述
 * 放在摘要位太重，这里的档位只需要回答「停了多久」。
 */
export function freshnessLabel(ms: number | null, now = Date.now()): string {
  if (ms == null) return '—'
  const d = now - ms
  if (d < 60_000) return '刚刚'
  if (d < 3600_000) return '几分钟前'
  if (d < 24 * 3600_000) return '几小时前'
  return '几天前'
}
