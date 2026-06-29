import { X, Link2, ChevronRight, Trash2 } from 'lucide-react'
import { useWorkspace } from '@/store/useWorkspace'
import { featureStatusMeta, featureStatusOrder, nodeStatusColor, hexA } from '@/theme/tokens'
import { FieldLabel, TextField, TextArea, SelectField, ListEditor, ChecklistEditor, RoleChips } from './fields'
import type { CrossLink, FeatureStatus, NodeKind, NodeStatus, Selection } from '@/store/types'

const NODE_STATUS: { key: NodeStatus; label: string }[] = [
  { key: 'todo', label: 'To do' },
  { key: 'progress', label: 'In progress' },
  { key: 'done', label: 'Done' },
  { key: 'blocked', label: 'Blocked' },
]
const NODE_KINDS: { value: NodeKind; label: string }[] = [
  { value: 'start', label: 'Start' },
  { value: 'process', label: 'Process' },
  { value: 'decision', label: 'Decision' },
  { value: 'end', label: 'End' },
]

const initials = (s: string) =>
  s
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'

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
    } else select(null)
  }

  let body: React.ReactNode = null
  if (selected.type === 'feature') body = <FeatureEditor id={selected.id} view={selected.view} readOnly={readOnly} goLink={goLink} />
  else if (selected.type === 'module') body = <ModuleEditor id={selected.id} readOnly={readOnly} />
  else if (selected.type === 'swimnode') body = <SwimEditor id={selected.id} readOnly={readOnly} goLink={goLink} />
  // Selection points at an entity that no longer exists (e.g. deleted) -> nothing to show.
  if (!data || body === null) return null

  return (
    <div className="absolute bottom-0 right-0 top-0 z-30 flex w-[384px] animate-panelIn flex-col border-l border-line bg-white shadow-panel">
      <div className="flex flex-none items-center justify-end px-4 pt-3">
        <button
          onClick={clearSelection}
          className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#f4f6f9] text-muted hover:bg-[#e9edf2]"
        >
          <X size={14} strokeWidth={2.2} />
        </button>
      </div>
      <div className="flex-1 overflow-auto px-4 pb-5">{body}</div>
    </div>
  )
}

// ── Shared bits ──────────────────────────────────────────────────────────────

function Crumb({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[11px] font-bold tracking-wide text-faint">{children}</div>
}
function IdChip({ code, label, color, bg }: { code: string; label: string; color: string; bg: string }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="flex h-[30px] min-w-[30px] flex-none items-center justify-center rounded-lg px-1.5 font-mono text-[13px] font-bold" style={{ color, background: bg }}>
        {code}
      </span>
      <span className="rounded-full px-2 py-0.5 text-[10.5px] font-bold" style={{ color, background: bg }}>
        {label}
      </span>
    </div>
  )
}
function Divider() {
  return <div className="my-4 h-px bg-[#eef0f3]" />
}
function SsotNote() {
  return (
    <div className="mt-2.5 flex items-center gap-[7px] rounded-lg bg-[#eaf6f0] px-2.5 py-2">
      <span className="h-[7px] w-[7px] flex-none animate-pulse2 rounded-full bg-[#16a34a]" />
      <span className="text-[11.5px] font-semibold text-[#0f7a44]">Synced instantly to every view (SSOT)</span>
    </div>
  )
}
function DeleteButton({ onDelete, label }: { onDelete: () => void; label: string }) {
  return (
    <button
      onClick={() => {
        if (confirm(`Delete ${label}?`)) onDelete()
      }}
      className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#f3c9cb] bg-[#fdecec] py-2 text-[12.5px] font-bold text-[#e5484d] hover:bg-[#fbdedf]"
    >
      <Trash2 size={14} /> Delete {label}
    </button>
  )
}
function StatusGrid<T extends string>({
  current,
  options,
  onPick,
  readOnly,
}: {
  current: T
  options: { key: T; label: string; color: string }[]
  onPick: (k: T) => void
  readOnly?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.key === current
        return (
          <button
            key={o.key}
            disabled={readOnly}
            onClick={() => onPick(o.key)}
            className="flex h-9 items-center justify-center gap-[5px] rounded-lg border text-[10.5px] font-bold transition-all disabled:cursor-default"
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
  )
}
function CrossLinks({ links, onGo }: { links: CrossLink[]; onGo: (l: CrossLink) => void }) {
  if (!links.length) return null
  return (
    <div className="mt-4">
      <FieldLabel>CROSS-LINKS · DYNAMIC LINKING</FieldLabel>
      {links.map((l, i) => (
        <button
          key={i}
          onClick={() => onGo(l)}
          className="mb-1.5 flex w-full items-center gap-2 rounded-lg border border-line bg-[#fbfcfd] px-[11px] py-[9px] text-left hover:border-[#c9d8ff] hover:bg-[#f1f5ff]"
        >
          <Link2 size={14} className="flex-none text-brand" strokeWidth={1.8} />
          <span className="flex-1 text-[12px] font-semibold text-[#2a4a8f]">{l.label}</span>
          <ChevronRight size={13} className="flex-none text-faint" strokeWidth={2} />
        </button>
      ))}
    </div>
  )
}

// ── Feature editor ───────────────────────────────────────────────────────────

function FeatureEditor({ id, view, readOnly, goLink }: { id: string; view: string; readOnly: boolean; goLink: (l: CrossLink) => void }) {
  const data = useWorkspace((s) => s.currentData())
  const updateFeature = useWorkspace((s) => s.updateFeature)
  const deleteFeature = useWorkspace((s) => s.deleteFeature)
  const f = data.features.find((x) => x.id === id)
  if (!f) return null
  const m = data.modules.find((x) => x.id === f.moduleId)
  const idx = data.features.indexOf(f)

  return (
    <>
      <Crumb>{view === 'story' ? 'Story Map' : 'Mindmap'} · {m?.name ?? '—'}</Crumb>
      <IdChip code={`F${idx + 1}`} label="Feature" color="#3a4fc4" bg="#eef1ff" />
      <TextField value={f.name} onChange={(v) => updateFeature(id, { name: v })} readOnly={readOnly} placeholder="Feature name" big />

      <div className="mt-4">
        <FieldLabel>STATUS</FieldLabel>
        <StatusGrid
          current={f.status}
          readOnly={readOnly}
          options={featureStatusOrder.map((k) => ({ key: k, label: featureStatusMeta[k].label, color: featureStatusMeta[k].color }))}
          onPick={(k: FeatureStatus) => updateFeature(id, { status: k })}
        />
        {!readOnly && <SsotNote />}
      </div>

      <Divider />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>MODULE</FieldLabel>
          <SelectField value={f.moduleId} readOnly={readOnly} onChange={(v) => updateFeature(id, { moduleId: v })} options={data.modules.map((m) => ({ value: m.id, label: m.name }))} />
        </div>
        <div>
          <FieldLabel>RELEASE</FieldLabel>
          <SelectField value={f.releaseId} readOnly={readOnly} onChange={(v) => updateFeature(id, { releaseId: v })} options={data.releases.map((r) => ({ value: r.id, label: r.name }))} />
        </div>
      </div>

      <div className="mt-4">
        <FieldLabel>DESCRIPTION</FieldLabel>
        <TextArea value={f.desc ?? ''} readOnly={readOnly} onChange={(v) => updateFeature(id, { desc: v })} placeholder="Feature description…" />
      </div>
      <div className="mt-4">
        <FieldLabel>API / TECHNICAL CONSTRAINTS</FieldLabel>
        <ListEditor items={f.constraints ?? []} readOnly={readOnly} mono onChange={(next) => updateFeature(id, { constraints: next })} placeholder="Add constraint" />
      </div>
      <div className="mt-4">
        <FieldLabel>VALIDATION CHECKLIST</FieldLabel>
        <ChecklistEditor
          items={f.validations ?? []}
          done={f.validationsDone ?? []}
          readOnly={readOnly}
          onChangeItems={(next) => updateFeature(id, { validations: next })}
          onToggle={(text, checked) => {
            const cur = f.validationsDone ?? []
            updateFeature(id, { validationsDone: checked ? [...new Set([...cur, text])] : cur.filter((t) => t !== text) })
          }}
        />
      </div>

      <CrossLinks links={f.crossLinks ?? []} onGo={goLink} />
      {!readOnly && <DeleteButton label="feature" onDelete={() => deleteFeature(id)} />}
    </>
  )
}

// ── Module editor ────────────────────────────────────────────────────────────

function ModuleEditor({ id, readOnly }: { id: string; readOnly: boolean }) {
  const data = useWorkspace((s) => s.currentData())
  const updateModule = useWorkspace((s) => s.updateModule)
  const deleteModule = useWorkspace((s) => s.deleteModule)
  const m = data.modules.find((x) => x.id === id)
  if (!m) return null
  const idx = data.modules.indexOf(m)
  const featureCount = data.features.filter((f) => f.moduleId === id).length

  return (
    <>
      <Crumb>Mindmap · Module</Crumb>
      <IdChip code={`M${idx + 1}`} label="Module" color="#0f7a44" bg="#e7f6ee" />
      <TextField value={m.name} onChange={(v) => updateModule(id, { name: v })} readOnly={readOnly} placeholder="Module name" big />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>STORY MAP COLUMN</FieldLabel>
          <TextField value={m.backbone.name} readOnly={readOnly} onChange={(v) => updateModule(id, { backbone: { ...m.backbone, name: v } })} placeholder="Column name" />
        </div>
        <div>
          <FieldLabel>COLUMN SUBTITLE</FieldLabel>
          <TextField value={m.backbone.sub} readOnly={readOnly} onChange={(v) => updateModule(id, { backbone: { ...m.backbone, sub: v } })} placeholder="Subtitle" />
        </div>
      </div>

      <div className="mt-4">
        <FieldLabel>OWNER ROLES (role filter)</FieldLabel>
        <RoleChips value={m.owners} readOnly={readOnly} onChange={(next) => updateModule(id, { owners: next })} />
      </div>

      <Divider />
      <div className="text-[12.5px] text-muted">
        This module has <b className="text-ink">{featureCount}</b> features. Click a child feature to edit its details.
      </div>
      {!readOnly && <DeleteButton label="module (and its features)" onDelete={() => deleteModule(id)} />}
    </>
  )
}

// ── Swimlane node editor ─────────────────────────────────────────────────────

function SwimEditor({ id, readOnly, goLink }: { id: string; readOnly: boolean; goLink: (l: CrossLink) => void }) {
  const data = useWorkspace((s) => s.currentData())
  const updateSwimNode = useWorkspace((s) => s.updateSwimNode)
  const deleteSwimNode = useWorkspace((s) => s.deleteSwimNode)
  const n = data.swimNodes.find((x) => x.id === id)
  if (!n) return null
  const lane = data.lanes.find((l) => l.id === n.lane)

  return (
    <>
      <Crumb>Swimlane Workflow</Crumb>
      <IdChip code={n.code ?? '•'} label="Process step" color="#2f6fed" bg="#e9f1ff" />
      <TextField value={n.label} onChange={(v) => updateSwimNode(id, { label: v })} readOnly={readOnly} placeholder="Step name" big />

      <div className="mt-4">
        <FieldLabel>STATUS</FieldLabel>
        <StatusGrid
          current={n.status}
          readOnly={readOnly}
          options={NODE_STATUS.map((s) => ({ key: s.key, label: s.label, color: nodeStatusColor[s.key] }))}
          onPick={(k: NodeStatus) => updateSwimNode(id, { status: k })}
        />
        {!readOnly && <SsotNote />}
      </div>

      <Divider />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>LANE</FieldLabel>
          <SelectField value={String(n.lane)} readOnly={readOnly} onChange={(v) => updateSwimNode(id, { lane: Number(v) })} options={data.lanes.map((l) => ({ value: String(l.id), label: l.name }))} />
        </div>
        <div>
          <FieldLabel>STEP TYPE</FieldLabel>
          <SelectField value={n.kind} readOnly={readOnly} onChange={(v) => updateSwimNode(id, { kind: v as NodeKind })} options={NODE_KINDS.map((k) => ({ value: k.value, label: k.label }))} />
        </div>
      </div>

      <div className="mt-4">
        <FieldLabel>OWNER</FieldLabel>
        <TextField value={n.owner ?? ''} readOnly={readOnly} onChange={(v) => updateSwimNode(id, { owner: v, ownerInit: initials(v), ownerColor: n.ownerColor ?? '#6e8bff' })} placeholder="Person / team" />
      </div>
      <div className="mt-4">
        <FieldLabel>DESCRIPTION</FieldLabel>
        <TextArea value={n.desc ?? ''} readOnly={readOnly} onChange={(v) => updateSwimNode(id, { desc: v })} placeholder="Step description…" />
      </div>
      <div className="mt-4">
        <FieldLabel>API / TECHNICAL CONSTRAINTS</FieldLabel>
        <ListEditor items={n.constraints ?? []} readOnly={readOnly} mono onChange={(next) => updateSwimNode(id, { constraints: next })} placeholder="Add constraint" />
      </div>
      <div className="mt-4">
        <FieldLabel>VALIDATION CHECKLIST</FieldLabel>
        <ChecklistEditor
          items={n.validations ?? []}
          done={n.validationsDone ?? []}
          readOnly={readOnly}
          onChangeItems={(next) => updateSwimNode(id, { validations: next })}
          onToggle={(text, checked) => {
            const cur = n.validationsDone ?? []
            updateSwimNode(id, { validationsDone: checked ? [...new Set([...cur, text])] : cur.filter((t) => t !== text) })
          }}
        />
      </div>

      <CrossLinks links={n.crossLinks ?? []} onGo={goLink} />
      <div className="mt-2 text-[11px] text-faint">Current lane: {lane?.name ?? '—'}</div>
      {!readOnly && <DeleteButton label="step (and its edges)" onDelete={() => deleteSwimNode(id)} />}
    </>
  )
}
