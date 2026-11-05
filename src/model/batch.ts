/**
 * 批量操作契约（P3-c）。
 *
 * 为什么不是简单的 Promise.all：这些操作会改宿主状态（删除转录、归档记账），
 * 一次失败不应该拖垮整批，而失败的项必须能被用户原样重试。
 * 所以结果里 succeeded / skipped / failures / remaining 分开记：
 *  - skipped：宿主判定无需操作（例如已经删掉的）
 *  - failures：真的失败，带原因
 *  - remaining：只包含失败项，直接回传给下一次调用即可重试
 */
export interface BatchFailure {
  id: string
  error: string
}

export interface BatchResult {
  requested: number
  succeeded: string[]
  skipped: string[]
  failures: BatchFailure[]
  remaining: string[]
  /** 批量结束后重建快照失败（操作本身可能已成功） */
  refreshError?: string
}

export type BatchOutcome = 'ok' | 'skip'

/** 串行执行；单条失败继续，不并发（宿主 fs/状态操作并发没有收益，只有竞态） */
export async function runSerialBatch(
  ids: readonly string[],
  run: (id: string) => Promise<BatchOutcome | void>,
  onProgress?: (done: number, total: number) => void,
): Promise<BatchResult> {
  const succeeded: string[] = []
  const skipped: string[] = []
  const failures: BatchFailure[] = []
  let done = 0
  for (const id of ids) {
    try {
      const outcome = await run(id)
      if (outcome === 'skip') skipped.push(id)
      else succeeded.push(id)
    } catch (err) {
      failures.push({ id, error: (err as Error)?.message ?? String(err) })
    }
    done += 1
    onProgress?.(done, ids.length)
  }
  return {
    requested: ids.length,
    succeeded,
    skipped,
    failures,
    remaining: failures.map((f) => f.id),
  }
}
