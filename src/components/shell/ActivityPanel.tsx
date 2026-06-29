import { useEffect, useMemo, useState } from 'react'
import { Activity as ActivityIcon, Bot, User, MessageSquare } from 'lucide-react'
import { useActivity } from '@/store/useActivity'
import { useWorkspace } from '@/store/useWorkspace'
import { refreshActivity } from '@/store/sync'

const relTime = (ts: number) => {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function ActivityPanel() {
  const items = useActivity((s) => s.items)
  const lastSeenTs = useActivity((s) => s.lastSeenTs)
  const markAllSeen = useActivity((s) => s.markAllSeen)
  const reset = useActivity((s) => s.reset)
  const activeProjectId = useWorkspace((s) => s.activeProjectId)
  const [open, setOpen] = useState(false)

  // Re-sync the feed when the active project changes.
  useEffect(() => {
    reset()
    void refreshActivity()
  }, [activeProjectId, reset])

  const unseen = useMemo(() => items.filter((i) => i.ts > lastSeenTs).length, [items, lastSeenTs])
  const ordered = useMemo(() => [...items].reverse(), [items])

  const toggle = () => {
    setOpen((v) => {
      if (!v) markAllSeen()
      return !v
    })
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        title="Activity — what changed and who"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-muted hover:bg-[#f4f6f9]"
      >
        <ActivityIcon size={16} strokeWidth={2} />
        {unseen > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
            {unseen > 99 ? '99+' : unseen}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-[60] w-[340px] animate-pop rounded-xl border border-line bg-white shadow-pop">
            <div className="flex items-center justify-between border-b border-[#eef0f3] px-3 py-2.5">
              <span className="text-[12.5px] font-bold text-ink">Activity</span>
              <span className="text-[11px] text-faint">{items.length ? `${items.length} events` : 'live'}</span>
            </div>
            <div className="max-h-[420px] overflow-auto py-1">
              {ordered.length === 0 ? (
                <div className="px-3 py-10 text-center text-[12px] text-faint">
                  No activity yet. Edits by you or an agent appear here, live.
                </div>
              ) : (
                ordered.map((it) => {
                  const agent = it.actor.kind === 'agent'
                  const note = it.kind === 'note'
                  return (
                    <div key={it.id} className="flex items-start gap-2.5 px-3 py-2 hover:bg-[#fafbfc]">
                      <span
                        className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full"
                        style={{ background: agent ? '#eef1ff' : '#e7f6ee', color: agent ? '#2f6fed' : '#0f7a44' }}
                      >
                        {note ? <MessageSquare size={13} /> : agent ? <Bot size={13} /> : <User size={13} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className={`text-[12.5px] leading-snug text-ink ${note ? 'italic' : ''}`}>
                          <span className="font-bold">{agent ? it.actor.name : 'You'}</span>{' '}
                          {note ? <>“{it.summary}”</> : it.summary}
                        </div>
                        <div className="mt-0.5 text-[10.5px] text-faint">{relTime(it.ts)}</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
