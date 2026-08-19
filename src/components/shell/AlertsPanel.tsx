import { useMemo } from 'react'
import { Triangle, Sparkles, ChevronRight, X } from 'lucide-react'
import { useWorkspace } from '@/store/useWorkspace'
import type { AlertKind } from '@/store/types'
import { deriveAllAlerts, DEFAULT_IMPACT_THRESHOLD, hasAlertTarget, isDismissibleAlertKind } from '@/lib/impact'

const KIND_META: Record<AlertKind, { c: string; bg: string; label: string }> = {
  impact: { c: '#e5484d', bg: '#fdecec', label: 'IMPACT' },
  outdated: { c: '#f59e0b', bg: '#fef3e2', label: 'OUTDATED' },
  dod: { c: '#2f6fed', bg: '#e9f1ff', label: 'DEF. OF DONE' },
  question: { c: '#7c5cff', bg: '#f1edff', label: 'DECISION' },
  friction: { c: '#0b7a70', bg: '#e6f6f4', label: 'TOOLING' },
}

export default function AlertsPanel() {
  const data = useWorkspace((s) => s.currentData())
  const alertsOpen = useWorkspace((s) => s.alertsOpen)
  const toggleAlerts = useWorkspace((s) => s.toggleAlerts)
  const setView = useWorkspace((s) => s.setView)
  const select = useWorkspace((s) => s.select)
  const openOrgBoard = useWorkspace((s) => s.openOrgBoard)
  const dismissAlert = useWorkspace((s) => s.dismissAlert)
  const readOnly = useWorkspace((s) => s.isReadOnly())

  const orgBoards = useWorkspace((s) => s.orgBoards)
  const projects = useWorkspace((s) => s.projects)
  const activeProjectId = useWorkspace((s) => s.activeProjectId)

  // Impact alerts are computed live from the board (plus cross-project org-board
  // alerts); other kinds come from the board's own alert list.
  const alerts = useMemo(() => {
    const threshold = data.settings?.impactThreshold ?? DEFAULT_IMPACT_THRESHOLD
    const org = activeProjectId ? { orgBoards, projects, projectId: activeProjectId } : undefined
    return deriveAllAlerts(data, threshold, org)
  }, [data, orgBoards, projects, activeProjectId])

  // cm:edge contract -> src/store/useWorkspace.ts — dismissAlert returns early on !editable() and on
  // a non-dismissible kind, so both checks must hold here or the × is a dead control.
  const canDismiss = (kind: AlertKind) => isDismissibleAlertKind(kind) && !readOnly

  return (
    <div className="relative">
      <button
        onClick={() => toggleAlerts()}
        className="relative flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-line bg-white hover:bg-[#f4f6f9]"
      >
        <Triangle size={17} strokeWidth={1.9} className="text-muted" />
        <span className="absolute -right-[5px] -top-[5px] flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-white bg-[#e5484d] px-1 text-[10px] font-bold text-white">
          {alerts.length}
        </span>
      </button>

      {alertsOpen && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => toggleAlerts(false)} />
          <div className="absolute right-0 top-11 z-[60] w-[392px] animate-pop overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
            <div className="flex items-center gap-[9px] border-b border-[#eef0f3] px-4 py-3.5">
              <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-light">
                <Sparkles size={15} className="text-white" />
              </span>
              <div className="flex-1">
                <div className="text-[13.5px] font-bold text-ink">Impact Warning AI</div>
                <div className="text-[11px] text-faint">Outdated · impact · acceptance · decisions · tooling</div>
              </div>
            </div>
            <div className="max-h-[440px] overflow-auto">
              {alerts.map((a) => {
                const m = KIND_META[a.kind]
                return (
                  <div key={a.id} className="flex border-b border-[#f3f5f7] last:border-0">
                    <div className="w-[3px] flex-none" style={{ background: m.c }} />
                    <div className="flex-1 px-3.5 py-3">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span
                          className="rounded-[5px] px-[7px] py-0.5 text-[9.5px] font-bold tracking-wide"
                          style={{ color: m.c, background: m.bg }}
                        >
                          {m.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10.5px] text-faint">{a.time}</span>
                          {canDismiss(a.kind) && (
                            <button
                              onClick={() => confirm('Dismiss this report? Its text is deleted and cannot be recovered.') && dismissAlert(a.id)}
                              title="Dismiss"
                              aria-label="Dismiss alert"
                              className="flex h-[24px] w-[24px] items-center justify-center rounded-[5px] text-faint hover:bg-[#f1f3f6] hover:text-ink"
                            >
                              <X size={12} strokeWidth={2.2} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mb-[3px] text-[13px] font-bold text-ink">{a.title}</div>
                      <div className="max-h-[128px] overflow-auto whitespace-pre-line text-[12px] leading-[1.5] text-muted">{a.detail}</div>
                      <div className="mt-[9px] flex items-center justify-between gap-2">
                        <div className="flex gap-[5px]">
                          {a.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-[#eef1ff] px-[7px] py-0.5 text-[10.5px] font-bold text-[#2a4a8f]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        {hasAlertTarget(a) && (
                          <button
                            onClick={() => {
                              if (a.action.view === 'orgboard') {
                                // Cross-project alert — jump to the org board, focusing the edge.
                                openOrgBoard(a.action.boardId, a.action.edge ? { type: 'edge', ...a.action.edge } : undefined)
                                toggleAlerts(false)
                              } else {
                                setView(a.action.view)
                                select(a.action.selection)
                              }
                            }}
                            className="flex h-[26px] items-center gap-[5px] rounded-[7px] border border-[#d3deff] bg-[#f1f5ff] px-2.5 text-[11.5px] font-bold text-brand hover:bg-[#e3ecff]"
                          >
                            {a.actionLabel}
                            <ChevronRight size={12} strokeWidth={2} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
