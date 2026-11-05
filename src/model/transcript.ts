import { zstdCompressSync, zstdDecompressSync } from 'node:zlib'
import { zstdFrameEnd } from './sources.ts'

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
export function rewriteHeadLine(bytes: Buffer, patch: (head: Record<string, unknown>) => void): Buffer | null {
  if (bytes.length < 4 || bytes.readUInt32LE(0) !== 0xfd2fb528) return null
  const end = zstdFrameEnd(bytes, 0)
  if (end === null || end === -1) return null
  const frame = bytes.subarray(0, end)
  let text: string
  try {
    text = zstdDecompressSync(frame).toString('utf8')
  } catch {
    return null
  }
  const newlineAt = text.indexOf('\n')
  const firstLine = newlineAt === -1 ? text : text.slice(0, newlineAt)
  const rest = newlineAt === -1 ? '' : text.slice(newlineAt)
  let head: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(firstLine)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
    head = parsed as Record<string, unknown>
  } catch {
    return null
  }
  if (head.type !== 'session') return null
  patch(head)
  // 保留原有键顺序：只改已存在的字段，不引入新键
  const rebuilt = zstdCompressSync(Buffer.from(JSON.stringify(head) + rest, 'utf8'))
  return Buffer.concat([rebuilt, bytes.subarray(end)])
}

/** 从转录字节里读出会话头（只要首帧首行），失败返回 null */
export function headFromBytes(bytes: Buffer): Record<string, unknown> | null {
  if (bytes.length < 4 || bytes.readUInt32LE(0) !== 0xfd2fb528) return null
  const end = zstdFrameEnd(bytes, 0)
  if (end === null || end === -1) return null
  try {
    const text = zstdDecompressSync(bytes.subarray(0, end)).toString('utf8')
    const firstLine = text.split('\n', 1)[0] ?? ''
    const parsed: unknown = JSON.parse(firstLine)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}
