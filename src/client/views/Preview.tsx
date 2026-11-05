import { useEffect, useState } from '../react.ts'
import { previewSession, type PreviewMessage } from '../api.ts'
import { highlightTitle } from '../SearchHit.ts'
import { fmtRelative } from '../util.ts'

/**
 * 只读预览抽屉（P3-a）。
 *
 * 直接读转录文件、不激活会话、不调模型——所以它可以在归档会话上工作，
 * 也不会把「看一眼」变成「占一个会话」。query 为空时展示最近几条。
 */
export function PreviewDrawer({
  sessionId,
  sessionTitle,
  query,
  onClose,
}: {
  sessionId: string
  sessionTitle: string | null
  query: string
  onClose: () => void
}) {
  const [messages, setMessages] = useState<PreviewMessage[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setMessages(null)
    setError(null)
    previewSession(sessionId, query, controller.signal).then(
      (r) => setMessages(r.messages),
      (e) => {
        if (controller.signal.aborted) return
        setError(String((e as Error)?.message ?? e))
      },
    )
    return () => controller.abort()
  }, [sessionId, query])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="wb-overlay" role="dialog" aria-modal="true" aria-label="会话只读预览" onClick={onClose}>
      <div className="wb-drawer" onClick={(e) => e.stopPropagation()}>
        <header className="wb-drawer-head">
          <div>
            <div className="wb-drawer-title">{sessionTitle ?? '(无标题会话)'}</div>
            <div className="wb-drawer-sub mono">
              {query ? `含「${query}」的上下文` : '最近对话'} · 只读，不激活会话
            </div>
          </div>
          <button type="button" className="wb-ghost-btn" onClick={onClose} aria-label="关闭预览">
            关闭
          </button>
        </header>
        <div className="wb-drawer-body">
          {error && <div className="wb-side-empty">预览失败：{error}</div>}
          {!error && messages === null && <div className="wb-side-empty">读取转录…</div>}
          {!error && messages?.length === 0 && <div className="wb-side-empty">该会话没有可展示的对话正文。</div>}
          {messages?.map((m) => (
            <div className={`wb-msg wb-msg-${m.role}${m.hit ? ' is-hit' : ''}`} key={m.seq}>
              <div className="wb-msg-head">
                <span className="who">{m.role === 'user' ? '用户' : '助手'}</span>
                <span className="when num">{fmtRelative(m.time)}</span>
              </div>
              <div className="wb-msg-body">
                {query
                  ? highlightTitle(m.text, query).map((part, i) =>
                      part.hit ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>,
                    )
                  : m.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
