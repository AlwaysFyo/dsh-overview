import { useState } from '../react.ts'
import type { WorkbenchState } from '../../model/types.ts'
import { deleteSessionsBatch } from '../api.ts'
import { fmtRelative } from '../util.ts'

/**
 * 全局诊断抽屉（P3-b）。
 *
 * 三件事，按「能不能修、由谁修」分层：
 *  1. 投影缓存缺失/无标题 —— 宿主所有，我们只负责指出；修复动作是「打开会话」，
 *     让宿主按自己的路径重建缓存（插件不写宿主缓存，这是硬边界）。
 *  2. 未归属会话 —— 转录存在但不在任何工作区的成员表里（子代理、被手工搬过的目录）。
 *     可以归档或永久删除，删除走批量契约，失败项可重试。
 *  3. 归档缓存残留 —— 只在计数上曝光，等宿主清理。
 */
export function DiagnosticsDrawer({
  state,
  onOpenSession,
  getWorkspaces,
  onChanged,
  onClose,
}: {
  state: WorkbenchState
  onOpenSession?: (sessionId: string) => void
  getWorkspaces?: () => {
    archiveSession?: (id: string, options?: { stopActivity?: boolean }) => Promise<unknown>
  } | null
  onChanged?: () => void
  onClose: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const { cacheIssues, unclaimed, staleArchiveRecords } = state.diagnostics
  // 「成员表没登记」分两类：工作区还在的（打开一次就能回来，不许批量删）与彻底无主的（清理对象）
  const orphans = unclaimed.filter((s) => !s.pathRegistered)
  const unlisted = unclaimed.filter((s) => s.pathRegistered)
  const unclaimedBytes = orphans.reduce((sum, s) => sum + (s.sizeBytes ?? 0), 0)

  const removeUnclaimed = (ids: readonly string[]) => {
    if (ids.length === 0) return
    if (!confirm(`永久删除 ${ids.length} 个未归属会话的转录文件？（不可恢复）`)) return
    setBusy(true)
    setNote(null)
    deleteSessionsBatch(ids).then(
      (r) => {
        setBusy(false)
        const parts = [`成功 ${r.succeeded.length}`, `跳过 ${r.skipped.length}`, `失败 ${r.failures.length}`]
        setNote(`批量删除：${parts.join(' · ')}${r.remaining.length > 0 ? `（可重试 ${r.remaining.length} 项）` : ''}`)
        onChanged?.()
      },
      (e) => {
        setBusy(false)
        setNote(`删除失败：${String((e as Error)?.message ?? e)}`)
      },
    )
  }

  const archive = (id: string) => {
    const ws = getWorkspaces?.()
    if (!ws?.archiveSession) {
      setNote('归档服务不可用（当前环境没有宿主 workspaces 服务）')
      return
    }
    setBusy(true)
    ws.archiveSession(id, { stopActivity: true }).then(
      () => {
        setBusy(false)
        setNote('已归档')
        onChanged?.()
      },
      (e) => {
        setBusy(false)
        setNote(`归档失败：${String((e as Error)?.message ?? e)}`)
      },
    )
  }

  return (
    <div className="wb-overlay" role="dialog" aria-modal="true" aria-label="数据诊断" onClick={onClose}>
      <div className="wb-drawer" onClick={(e) => e.stopPropagation()}>
        <header className="wb-drawer-head">
          <div>
            <div className="wb-drawer-title">数据诊断</div>
            <div className="wb-drawer-sub">
              缓存由宿主维护 · 删除不可恢复 · 数据 {fmtRelative(state.generatedAt)}更新
            </div>
          </div>
          <button type="button" className="wb-ghost-btn" onClick={onClose} aria-label="关闭诊断">
            关闭
          </button>
        </header>
        <div className="wb-drawer-body">
          {note && <div className="wb-note">{note}</div>}

          <section className="wb-diag">
            <h4>
              投影缓存异常<span className="cnt num">{cacheIssues.length}</span>
            </h4>
            {cacheIssues.length === 0 ? (
              <div className="wb-side-empty">没有发现缺失或无标题的投影记录。</div>
            ) : (
              <>
                <p className="wb-diag-hint">
                  这些会话的投影缓存缺失或不含标题。缓存由宿主写入，插件只读——点「打开会话」让宿主按自己的路径重建。
                </p>
                <ul className="wb-diag-list">
                  {cacheIssues.slice(0, 30).map((issue) => (
                    <li key={issue.sessionId}>
                      <span className={`wb-tag ${issue.kind === 'no-record' ? 'is-warn' : ''}`}>
                        {issue.kind === 'no-record' ? '无记录' : '无标题'}
                      </span>
                      <span className="t">{issue.title ?? '(无标题)'}</span>
                      <span className="p mono">{issue.cwd ?? '—'}</span>
                      <button
                        type="button"
                        className="wb-ghost-btn"
                        disabled={busy || !onOpenSession}
                        onClick={() => onOpenSession?.(issue.sessionId)}
                      >
                        打开会话
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="wb-diag">
            <h4>
              无主转录<span className="cnt num">{orphans.length}</span>
            </h4>
            {orphans.length === 0 ? (
              <div className="wb-side-empty">没有找不到归属的转录文件。</div>
            ) : (
              <>
                <p className="wb-diag-hint">
                  转录存在，但既不在任何工作区成员表里、cwd 也没有对应的工作区（多为子代理产物，或目录被手工删/搬过）。
                  磁盘占用约 {(unclaimedBytes / 1024 / 1024).toFixed(1)} MB。
                </p>
                <div className="wb-diag-actions">
                  <button
                    type="button"
                    className="wb-ghost-btn wb-danger"
                    disabled={busy}
                    onClick={() => removeUnclaimed(orphans.map((s) => s.sessionId))}
                  >
                    清理全部（{orphans.length}）
                  </button>
                </div>
                <ul className="wb-diag-list">
                  {orphans.slice(0, 30).map((s) => (
                    <li key={s.sessionId}>
                      <span className={`wb-tag ${s.origin === 'subagent' ? 'is-sub' : ''}`}>{s.origin ?? '未知'}</span>
                      <span className="t">{s.title ?? '(无标题)'}</span>
                      <span className="p mono">{(s.sizeBytes ?? 0) / 1024 > 1024 ? `${((s.sizeBytes ?? 0) / 1024 / 1024).toFixed(1)} MB` : `${Math.round((s.sizeBytes ?? 0) / 1024)} KB`}</span>
                      <span className="when num">{fmtRelative(s.createdAt)}</span>
                      <button type="button" className="wb-ghost-btn" disabled={busy} onClick={() => archive(s.sessionId)}>
                        归档
                      </button>
                      <button
                        type="button"
                        className="wb-ghost-btn wb-danger"
                        disabled={busy}
                        onClick={() => removeUnclaimed([s.sessionId])}
                      >
                        删除
                      </button>
                    </li>
                  ))}
                </ul>
                {orphans.length > 30 && (
                  <p className="wb-diag-hint">列表只显示前 30 条；清理动作覆盖全部 {orphans.length} 条。</p>
                )}
              </>
            )}
          </section>

          {unlisted.length > 0 && (
            <section className="wb-diag">
              <h4>
                未登记但目录仍在<span className="cnt num">{unlisted.length}</span>
              </h4>
              <p className="wb-diag-hint">
                这些会话的 cwd 仍是一个已注册工作区，只是成员表里没有记录——打开一次宿主就会重新登记。
                所以这里只提供「打开会话」，不提供删除。
              </p>
              <ul className="wb-diag-list">
                {unlisted.slice(0, 30).map((s) => (
                  <li key={s.sessionId}>
                    <span className="wb-tag">{s.origin ?? '未知'}</span>
                    <span className="t">{s.title ?? '(无标题)'}</span>
                    <span className="p mono">{s.cwd ?? '—'}</span>
                    <button
                      type="button"
                      className="wb-ghost-btn"
                      disabled={busy || !onOpenSession}
                      onClick={() => onOpenSession?.(s.sessionId)}
                    >
                      打开会话
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="wb-diag">
            <h4>
              归档缓存残留<span className="cnt num">{staleArchiveRecords}</span>
            </h4>
            <p className="wb-diag-hint">
              归档缓存里有、但既不在宿主的归档集合、也没有转录文件的记录。它们会让已删除的会话以「无标题」幽灵行回来；
              删除会话时插件会自动清理对应记录，其余等宿主自己收敛。
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
