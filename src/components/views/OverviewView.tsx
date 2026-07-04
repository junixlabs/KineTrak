import { useMemo } from 'react'
import { Triangle, Clock, CheckCircle2, HelpCircle, FileCode2, GitBranch, Link2, FileText, ChevronRight } from 'lucide-react'
import { useWorkspace } from '@/store/useWorkspace'
import { featureStatusMeta, featureStatusOrder, nodeStatusColor } from '@/theme/tokens'
import { deriveOverview, type Gap } from '@/lib/overview'
import { DEFAULT_IMPACT_THRESHOLD } from '@/lib/impact'
import type { AlertKind, NodeStatus } from '@/store/types'

const ALERT_META: Record<AlertKind, { c: string; bg: string; label: string; Icon: typeof Triangle }> = {
  impact: { c: '#e5484d', bg: '#fdecec', label: 'Impact', Icon: Triangle },
  outdated: { c: '#f59e0b', bg: '#fef3e2', label: 'Outdated', Icon: Clock },
  dod: { c: '#2f6fed', bg: '#e9f1ff', label: 'Def. of Done', Icon: CheckCircle2 },
  question: { c: '#7c5cff', bg: '#f1edff', label: 'Decision', Icon: HelpCircle },
}
const NODE_ORDER: NodeStatus[] = ['todo', 'progress', 'done', 'blocked']
const nodeLabel: Record<NodeStatus, string> = { todo: 'To do', progress: 'In progress', done: 'Done', blocked: 'Blocked' }

function Bar({ segments, total }: { segments: { color: string; n: number }[]; total: number }) {
  if (!total) return <div className="h-2 rounded-full bg-[#eef0f3]" />
  return (
    <div className="flex h-2 overflow-hidden rounded-full bg-[#eef0f3]">
      {segments.map((s, i) => (s.n ? <div key={i} style={{ width: `${(s.n / total) * 100}%`, background: s.color }} /> : null))}
    </div>
  )
}

function Card({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="mb-3 text-[12px] font-bold uppercase tracking-wide text-faint">{title}</div>
      {children}
    </div>
  )
}

export default function OverviewView() {
  const data = useWorkspace((s) => s.currentData())
  const setView = useWorkspace((s) => s.setView)
  const select = useWorkspace((s) => s.select)
  const openOrgBoard = useWorkspace((s) => s.openOrgBoard)
  // Present mode & share links are stakeholder-facing: show the status rollups
  // (the executive summary) but hide the internal source-of-truth hygiene gaps.
  const presenting = useWorkspace((s) => s.present || s.isReadOnly())
  const ov = useMemo(() => deriveOverview(data, data.settings?.impactThreshold ?? DEFAULT_IMPACT_THRESHOLD), [data])

  const goGap = (g: Gap) =>
    g.kind === 'feature'
      ? (setView('mindmap'), select({ type: 'feature', id: g.id, view: 'mindmap' }))
      : (setView('swimlane'), select({ type: 'swimnode', id: g.id, view: 'swimlane' }))

  const GapList = ({ items, empty }: { items: Gap[]; empty: string }) =>
    items.length === 0 ? (
      <div className="flex items-center gap-1.5 text-[12px] text-[#16a34a]"><CheckCircle2 size={13} /> {empty}</div>
    ) : (
      <div className="flex flex-col gap-1">
        {items.slice(0, 8).map((g) => (
          <button key={g.kind + g.id} onClick={() => goGap(g)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[#f4f6f9]">
            <span className="flex-1 truncate text-[12.5px] text-ink">{g.label}</span>
            <ChevronRight size={13} className="flex-none text-faint" />
          </button>
        ))}
        {items.length > 8 && <div className="px-2 text-[11px] text-faint">+{items.length - 8} more</div>}
      </div>
    )

  return (
    <div className="h-full overflow-auto bg-[#f6f8fb] px-6 py-5">
      <div className="mx-auto max-w-[980px]">
        <h1 className="mb-4 text-[19px] font-bold text-ink">Overview</h1>

        {/* ── Status rollups + alert counters ─────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Card title={`Features · ${ov.features.total}`}>
            <Bar total={ov.features.total} segments={featureStatusOrder.map((k) => ({ color: featureStatusMeta[k].color, n: ov.features[k] }))} />
            <div className="mt-3 grid grid-cols-2 gap-y-1.5">
              {featureStatusOrder.map((k) => (
                <div key={k} className="flex items-center gap-1.5 text-[12px] text-muted">
                  <span className="h-2 w-2 rounded-full" style={{ background: featureStatusMeta[k].color }} />
                  {featureStatusMeta[k].label} <span className="font-semibold text-ink">{ov.features[k]}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title={`Swim steps · ${ov.steps.total}`}>
            <Bar total={ov.steps.total} segments={NODE_ORDER.map((k) => ({ color: nodeStatusColor[k], n: ov.steps[k] }))} />
            <div className="mt-3 grid grid-cols-2 gap-y-1.5">
              {NODE_ORDER.map((k) => (
                <div key={k} className="flex items-center gap-1.5 text-[12px] text-muted">
                  <span className="h-2 w-2 rounded-full" style={{ background: nodeStatusColor[k] }} />
                  {nodeLabel[k]} <span className="font-semibold text-ink">{ov.steps[k]}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title={`Live alerts · ${ov.alerts.total}`}>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ALERT_META) as AlertKind[]).map((k) => {
                const m = ALERT_META[k]
                return (
                  <div key={k} className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={{ background: m.bg }}>
                    <m.Icon size={14} style={{ color: m.c }} />
                    <span className="text-[12px] font-semibold" style={{ color: m.c }}>{m.label}</span>
                    <span className="ml-auto text-[13px] font-bold" style={{ color: m.c }}>{ov.alerts[k]}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* ── Alert triage queue ──────────────────────────────────────────── */}
        {ov.alerts.list.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-faint">Needs attention</div>
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              {ov.alerts.list.map((a) => {
                const m = ALERT_META[a.kind]
                return (
                  <button key={a.id} onClick={() => { if (a.action.view === 'orgboard') openOrgBoard(a.action.boardId, a.action.edge ? { type: 'edge', ...a.action.edge } : undefined); else { setView(a.action.view); select(a.action.selection) } }} className="flex w-full items-start gap-3 border-b border-[#f3f5f7] px-4 py-3 text-left last:border-0 hover:bg-[#f9fbfd]">
                    <span className="mt-0.5 flex-none rounded-md px-1.5 py-0.5 text-[9.5px] font-bold" style={{ color: m.c, background: m.bg }}>{m.label}</span>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-ink">{a.title}</div>
                      <div className="text-[12px] leading-[1.45] text-muted">{a.detail}</div>
                    </div>
                    <ChevronRight size={14} className="mt-1 flex-none text-faint" />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── SSOT fidelity (semantic completeness, not structural) ──────────
            Internal hygiene — hidden while presenting or on a share link. */}
        {!presenting && (
        <div className="mt-5">
          <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-faint">Source-of-truth fidelity</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Card title={<span className="flex items-center gap-1.5"><FileCode2 size={13} /> Committed features without code</span> }>
              <GapList items={ov.fidelity.featuresWithoutCode} empty="Every committed feature links to code" />
            </Card>
            <Card title={<span className="flex items-center gap-1.5"><CheckCircle2 size={13} /> Unmet acceptance criteria</span> }>
              <GapList items={ov.fidelity.unmetAcceptance} empty="All committed features meet their criteria" />
            </Card>
            <Card title={<span className="flex items-center gap-1.5"><Link2 size={13} /> Steps not linked to a feature</span> }>
              <GapList items={ov.fidelity.stepsWithoutFeature} empty="Every step traces to a feature" />
            </Card>
            <Card title={<span className="flex items-center gap-1.5"><GitBranch size={13} /> Drifted from code (outdated)</span> }>
              <GapList items={ov.fidelity.staleNodes} empty="No node is flagged outdated" />
            </Card>
            <Card title={<span className="flex items-center gap-1.5"><FileText size={13} /> Descriptions to compact</span> }>
              <GapList items={ov.fidelity.bloatedDescriptions} empty="All descriptions are within budget" />
            </Card>
          </div>
        </div>
        )}

        <div className="mt-4 text-[11px] text-faint">Derived live from the board — no code is read or stored here.</div>
      </div>
    </div>
  )
}
