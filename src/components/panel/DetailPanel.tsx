import { X, Check, Link2, ChevronRight } from 'lucide-react'
import { useWorkspace } from '@/store/useWorkspace'
import { featureStatusMeta, featureStatusOrder, nodeStatusColor, hexA } from '@/theme/tokens'
import type { CrossLink, FeatureStatus, Module, NodeStatus, Selection } from '@/store/types'

const NODE_STATUS: { key: NodeStatus; label: string }[] = [
  { key: 'todo', label: 'Chưa làm' },
  { key: 'progress', label: 'Đang xử lý' },
  { key: 'done', label: 'Hoàn thành' },
  { key: 'blocked', label: 'Bị chặn' },
]

export default function DetailPanel() {
  const selected = useWorkspace((s) => s.selected)
  const data = useWorkspace((s) => s.currentData())
  const readOnly = useWorkspace((s) => s.isReadOnly())
  const clearSelection = useWorkspace((s) => s.clearSelection)
  const setView = useWorkspace((s) => s.setView)
  const select = useWorkspace((s) => s.select)

  if (!selected) return null

  const goLink = (l: CrossLink) => {
    setView(l.view)
    if (l.targetId) {
      const sel: Selection =
        l.view === 'swimlane'
          ? { type: 'swimnode', id: l.targetId, view: l.view }
          : { type: 'feature', id: l.targetId, view: l.view }
      select(sel)
    } else {
      select(null)
    }
  }

  let body: PanelContent | null = null
  if (selected.type === 'feature') body = featurePanel(selected, data)
  else if (selected.type === 'module') body = modulePanel(selected, data)
  else if (selected.type === 'swimnode') body = swimPanel(selected, data)
  if (!body) return null

  return (
    <div className="absolute bottom-0 right-0 top-0 z-30 flex w-[384px] animate-panelIn flex-col border-l border-line bg-white shadow-panel">
      {/* Header */}
      <div className="flex flex-none items-center justify-between px-4 pt-3.5">
        <span className="text-[11px] font-bold tracking-wide text-faint">{body.crumb}</span>
        <button
          onClick={clearSelection}
          className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#f4f6f9] text-muted hover:bg-[#e9edf2]"
        >
          <X size={14} strokeWidth={2.2} />
        </button>
      </div>

      <div className="flex flex-none items-start gap-2.5 px-4 pt-2.5">
        <span className="mt-0.5 flex h-[30px] w-[30px] flex-none items-center justify-center rounded-lg bg-[#eef1ff] font-mono text-[14px] font-bold text-[#3a4fc4]">
          {body.idChip}
        </span>
        <div className="flex-1">
          <div className="text-[17px] font-bold leading-tight text-ink">{body.title}</div>
          <span
            className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10.5px] font-bold"
            style={{ color: body.kindColor, background: body.kindBg }}
          >
            {body.kindLabel}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* Status editor */}
        {body.status && (
          <>
            <div className="mb-2 text-[11px] font-bold tracking-wide text-faint">TRẠNG THÁI</div>
            <div className="flex flex-wrap gap-1.5">
              {body.status.options.map((o) => {
                const active = o.key === body!.status!.current
                return (
                  <button
                    key={o.key}
                    disabled={readOnly}
                    onClick={() => body!.status!.onPick(o.key)}
                    className="flex h-9 items-center justify-center gap-[5px] rounded-lg border text-[10.5px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      flex: '1 1 calc(50% - 3px)',
                      borderColor: active ? o.color : '#e5e8ec',
                      background: active ? hexA(o.color, 0.12) : '#fff',
                      color: active ? o.color : '#5b6470',
                    }}
                  >
                    <span className="h-[7px] w-[7px] flex-none rounded-full" style={{ background: o.color }} />
                    {o.label}
                  </button>
                )
              })}
            </div>
            <div className="mt-2.5 flex items-center gap-[7px] rounded-lg bg-[#eaf6f0] px-2.5 py-2">
              <span className="h-[7px] w-[7px] flex-none animate-pulse2 rounded-full bg-[#16a34a]" />
              <span className="text-[11.5px] font-semibold text-[#0f7a44]">
                Đồng bộ tức thì tới mọi View (SSOT)
              </span>
            </div>
            <div className="my-4 h-px bg-[#eef0f3]" />
          </>
        )}

        {/* Owner + lane/module */}
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <div className="mb-1.5 text-[10.5px] font-bold text-faint">PHỤ TRÁCH</div>
            <div className="flex items-center gap-[7px]">
              <span
                className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full text-[9.5px] font-bold text-white"
                style={{ background: body.ownerColor }}
              >
                {body.ownerInit}
              </span>
              <span className="text-[12.5px] font-semibold text-ink">{body.owner}</span>
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-[10.5px] font-bold text-faint">{body.contextLabel}</div>
            <div className="pt-0.5 text-[12.5px] font-semibold text-ink">{body.context}</div>
          </div>
        </div>

        {/* Description */}
        {body.desc && (
          <div className="mt-4">
            <div className="mb-[7px] text-[11px] font-bold tracking-wide text-faint">MÔ TẢ</div>
            <div className="text-[13px] leading-[1.55] text-[#3a4048]">{body.desc}</div>
          </div>
        )}

        {/* Constraints */}
        {body.constraints && body.constraints.length > 0 && (
          <div className="mt-4">
            <div className="mb-[7px] text-[11px] font-bold tracking-wide text-faint">
              RÀNG BUỘC API / KỸ THUẬT
            </div>
            {body.constraints.map((c, i) => (
              <div key={i} className="mb-1.5 flex items-start gap-2">
                <span className="mt-px flex-none font-bold text-brand">›</span>
                <span className="font-mono text-[12px] leading-[1.45] text-[#3a4048]">{c}</span>
              </div>
            ))}
          </div>
        )}

        {/* Validations */}
        {body.validations && body.validations.length > 0 && (
          <div className="mt-3.5">
            <div className="mb-[7px] text-[11px] font-bold tracking-wide text-faint">QUY TẮC VALIDATE</div>
            {body.validations.map((v, i) => (
              <div key={i} className="mb-1.5 flex items-start gap-2">
                <Check size={14} className="mt-px flex-none text-[#16a34a]" strokeWidth={2.4} />
                <span className="text-[12.5px] leading-[1.45] text-[#3a4048]">{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Cross-links */}
        {body.crossLinks && body.crossLinks.length > 0 && (
          <div className="mt-4">
            <div className="mb-[7px] text-[11px] font-bold tracking-wide text-faint">
              LIÊN KẾT CHÉO · DYNAMIC LINKING
            </div>
            {body.crossLinks.map((l, i) => (
              <button
                key={i}
                onClick={() => goLink(l)}
                className="mb-1.5 flex w-full items-center gap-2 rounded-lg border border-line bg-[#fbfcfd] px-[11px] py-[9px] text-left hover:border-[#c9d8ff] hover:bg-[#f1f5ff]"
              >
                <Link2 size={14} className="flex-none text-brand" strokeWidth={1.8} />
                <span className="flex-1 text-[12px] font-semibold text-[#2a4a8f]">{l.label}</span>
                <ChevronRight size={13} className="flex-none text-faint" strokeWidth={2} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Panel content builders ──────────────────────────────────────────────────

interface PanelContent {
  crumb: string
  idChip: string
  title: string
  kindLabel: string
  kindColor: string
  kindBg: string
  owner: string
  ownerInit: string
  ownerColor: string
  contextLabel: string
  context: string
  desc?: string
  constraints?: string[]
  validations?: string[]
  crossLinks?: CrossLink[]
  status?: {
    current: string
    options: { key: string; label: string; color: string }[]
    onPick: (key: string) => void
  }
}

/** Owner display is derived from the data model's module.owners — no side table to drift. */
function moduleOwner(m: Module): { owner: string; init: string; color: string } {
  return { owner: m.owners.join(' · '), init: m.owners[0] ?? '?', color: m.color }
}

function featurePanel(sel: Selection & { type: 'feature' }, data: ReturnType<typeof storeData>): PanelContent | null {
  const f = data.features.find((x) => x.id === sel.id)
  if (!f) return null
  const m = data.modules.find((x) => x.id === f.moduleId)
  if (!m) return null // orphan feature — degrade gracefully instead of crashing
  const owners = moduleOwner(m)
  return {
    crumb: `${sel.view === 'story' ? 'Story Map' : 'Mindmap'} · ${m.name}`,
    idChip: f.id.replace('f', 'F'),
    title: f.name,
    kindLabel: 'Tính năng',
    kindColor: '#3a4fc4',
    kindBg: '#eef1ff',
    owner: owners.owner,
    ownerInit: owners.init,
    ownerColor: owners.color,
    contextLabel: 'MODULE',
    context: m.name,
    desc:
      f.desc ||
      `"${f.name}" thuộc module ${m.name}. Nhãn trạng thái gắn trực tiếp trên node và đồng bộ tới Story Map theo cơ chế SSOT.`,
    constraints: f.constraints,
    crossLinks: f.crossLinks ?? [{ view: 'story', label: `Story Map · ${f.name}`, targetId: f.id }],
    status: {
      current: f.status,
      options: featureStatusOrder.map((k) => ({ key: k, label: featureStatusMeta[k].label, color: featureStatusMeta[k].color })),
      onPick: (k) => useWorkspace.getState().setFeatureStatus(f.id, k as FeatureStatus),
    },
  }
}

function modulePanel(sel: Selection & { type: 'module' }, data: ReturnType<typeof storeData>): PanelContent | null {
  const m = data.modules.find((x) => x.id === sel.id)
  if (!m) return null
  const owners = moduleOwner(m)
  const fs = data.features.filter((f) => f.moduleId === m.id)
  return {
    crumb: 'Mindmap · Module',
    idChip: m.id.replace('m', 'M'),
    title: m.name,
    kindLabel: 'Module',
    kindColor: '#0f7a44',
    kindBg: '#e7f6ee',
    owner: owners.owner,
    ownerInit: owners.init,
    ownerColor: owners.color,
    contextLabel: 'SỐ TÍNH NĂNG',
    context: `${fs.length} tính năng`,
    desc: `Module "${m.name}" gồm ${fs.length} tính năng. Bấm một tính năng con để xem chi tiết và chỉnh trạng thái.`,
    crossLinks: [{ view: 'story', label: `Story Map · cột ${m.backbone.name}` }],
  }
}

function swimPanel(sel: Selection & { type: 'swimnode' }, data: ReturnType<typeof storeData>): PanelContent | null {
  const n = data.swimNodes.find((x) => x.id === sel.id)
  if (!n) return null
  const lane = data.lanes.find((l) => l.id === n.lane)
  return {
    crumb: 'Swimlane Workflow',
    idChip: n.id,
    title: n.label,
    kindLabel: n.kind === 'decision' ? 'Điểm quyết định' : n.kind === 'start' ? 'Điểm bắt đầu' : n.kind === 'end' ? 'Điểm kết thúc' : 'Bước xử lý',
    kindColor: '#2f6fed',
    kindBg: '#e9f1ff',
    owner: n.owner || '—',
    ownerInit: n.ownerInit || '?',
    ownerColor: n.ownerColor || '#9aa2ad',
    contextLabel: 'PHÂN LÀN',
    context: lane?.name ?? '—',
    desc: n.desc,
    constraints: n.constraints,
    validations: n.validations,
    crossLinks: n.crossLinks,
    status: {
      current: n.status,
      options: NODE_STATUS.map((s) => ({ key: s.key, label: s.label, color: nodeStatusColor[s.key] })),
      onPick: (k) => useWorkspace.getState().setSwimStatus(n.id, k as NodeStatus),
    },
  }
}

// Type helper for builder signatures.
function storeData() {
  return useWorkspace.getState().currentData()
}
