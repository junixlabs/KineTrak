import { useId, useMemo, useRef, useState } from 'react'
import { GitBranch, Plus, X, Workflow } from 'lucide-react'
import { useWorkspace } from '@/store/useWorkspace'
import { useActivity } from '@/store/useActivity'
import { useToast } from '@/store/useToast'
import { authFetch } from '@/store/api'
import { impactAnswer, dependencyCandidates } from '@/lib/impact'
import { FieldLabel } from './fields'

// The two sections of the feature panel the redesign adds (P-0001, P-0003; drawings picked in
// .uxcli/mockups/owner.impact_shown/a-panel and owner.feature_open/a-picker): what the feature depends
// on and what depends on it, declared by a person or an agent; and, asked for, what changing it
// touches — the same answer an agent gets from compute_impact, in the place the person already looks.

const chip = 'inline-flex max-w-full items-center gap-1 rounded-full bg-[#f1edff] px-[9px] py-[3px] text-[11.5px] font-semibold text-[#5b3ec4]'
const day = (ts: number) => new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

/** Depends on / Needed by, with an empty state, who declared each, remove with undo, and a type-to-find picker. */
export function Dependencies({ featureId, readOnly }: { featureId: string; readOnly: boolean }) {
  const data = useWorkspace((s) => s.currentData())
  const setDependency = useWorkspace((s) => s.setDependency)
  const select = useWorkspace((s) => s.select)
  const view = useWorkspace((s) => s.selected?.view ?? 'mindmap')
  const activity = useActivity((s) => s.items)
  const toast = useToast((s) => s.show)
  const [picking, setPicking] = useState(false)

  const f = data.features.find((x) => x.id === featureId)
  if (!f) return null
  const byId = new Map(data.features.map((x) => [x.id, x]))
  const name = (id: string) => byId.get(id)?.name ?? id
  const deps = (f.dependsOn ?? []).filter((id) => byId.has(id))
  const neededBy = data.features.filter((x) => x.id !== f.id && (x.dependsOn ?? []).includes(f.id))
  // who declared it: the newest activity line that added exactly this edge
  const declared = (id: string) =>
    [...activity].reverse().find((a) => a.targetId === f.id && a.summary.startsWith('added dependency') && a.summary.endsWith(`→ “${name(id)}”`))
  const open = (id: string) => select({ type: 'feature', id, view: view === 'story' ? 'story' : 'mindmap' })
  const remove = (id: string) => {
    setDependency(f.id, id, 'remove')
    toast(`No longer depends on “${name(id)}”`, { label: 'Undo', run: () => setDependency(f.id, id, 'add') })
  }

  return (
    <section className="mt-4" data-uxcli="feature-dependencies" aria-label="Dependencies">
      <FieldLabel>DEPENDS ON</FieldLabel>
      {deps.length ? (
        <ul className="flex flex-col gap-1.5">
          {deps.map((id) => {
            const who = declared(id)
            return (
              <li key={id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className={chip} data-uxcli="dependency-chip">
                  <GitBranch size={12} strokeWidth={2} className="flex-none" />
                  <button onClick={() => open(id)} className="truncate hover:underline" title={`Open “${name(id)}”`}>
                    {name(id)}
                  </button>
                  {!readOnly && (
                    <button onClick={() => remove(id)} aria-label={`Remove the dependency on ${name(id)}`} className="-mr-1 ml-0.5 rounded-full p-0.5 hover:bg-[#e2dafc]">
                      <X size={11} strokeWidth={2.5} />
                    </button>
                  )}
                </span>
                {who && (
                  <span className="text-[11px] text-faint">
                    {who.actor.kind === 'agent' ? 'agent' : 'person'} {who.actor.name} · {day(who.ts)}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-[12px] leading-[1.45] text-muted">
          Nothing declared. {readOnly ? '' : 'Add one here, or an agent declares it over MCP (add_dependency); '}the impact answer below counts only what is declared.
        </p>
      )}
      {!readOnly && (picking ? (
        <DependencyPicker
          featureId={f.id}
          onPick={(id) => {
            setDependency(f.id, id, 'add')
            setPicking(false)
          }}
          onClose={() => setPicking(false)}
        />
      ) : (
        <button
          onClick={() => setPicking(true)}
          data-uxcli="add-dependency"
          className="mt-2 flex items-center gap-1 rounded-lg px-1.5 py-1 text-[12px] font-bold text-brand hover:bg-[#eef1ff]"
        >
          <Plus size={13} strokeWidth={2.5} /> Add dependency
        </button>
      ))}

      <div className="mt-3">
        <FieldLabel>NEEDED BY</FieldLabel>
        {neededBy.length ? (
          <div className="flex flex-wrap gap-1.5">
            {neededBy.map((x) => (
              <button key={x.id} onClick={() => open(x.id)} className={`${chip} hover:bg-[#e2dafc]`} title={`“${x.name}” depends on this feature`}>
                <GitBranch size={12} strokeWidth={2} className="flex-none rotate-180" />
                <span className="truncate">{x.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-muted">No feature has declared that it depends on this one.</p>
        )}
      </div>
    </section>
  )
}

/** Type to find a feature of the board; grouped by module; keyboard first. Never offers a cycle. */
function DependencyPicker({ featureId, onPick, onClose }: { featureId: string; onPick: (id: string) => void; onClose: () => void }) {
  const data = useWorkspace((s) => s.currentData())
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const listId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const moduleName = useMemo(() => new Map(data.modules.map((m) => [m.id, m.name])), [data.modules])
  const order = useMemo(() => new Map(data.modules.map((m, i) => [m.id, i])), [data.modules])
  const options = useMemo(() => {
    const ids = new Set(dependencyCandidates(data, featureId))
    const needle = q.trim().toLowerCase()
    return data.features
      .filter((f) => ids.has(f.id) && (!needle || f.name.toLowerCase().includes(needle) || (moduleName.get(f.moduleId) ?? '').toLowerCase().includes(needle)))
      .sort((a, b) => (order.get(a.moduleId) ?? 0) - (order.get(b.moduleId) ?? 0))
  }, [data, featureId, q, moduleName, order])
  const at = Math.min(active, Math.max(0, options.length - 1))
  const move = (d: number) => {
    const next = (at + d + options.length) % Math.max(1, options.length)
    setActive(next)
    listRef.current?.querySelectorAll('[role=option]')[next]?.scrollIntoView({ block: 'nearest' })
  }

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-line bg-white shadow-pop">
      <input
        autoFocus
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setActive(0)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
          else if (e.key === 'Enter' && options[at]) { e.preventDefault(); onPick(options[at].id) }
          else if (e.key === 'Escape') { e.preventDefault(); onClose() }
        }}
        onBlur={(e) => {
          if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node | null)) onClose()
        }}
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-activedescendant={options[at] ? `${listId}-${options[at].id}` : undefined}
        aria-label="Find the feature this one depends on"
        placeholder="Find a feature…"
        className="w-full border-b border-line px-3 py-2.5 text-[13px] outline-none"
      />
      <div id={listId} ref={listRef} role="listbox" aria-label="Features" className="max-h-[220px] overflow-auto py-1">
        {options.length ? (
          options.map((o, i) => (
            <button
              key={o.id}
              id={`${listId}-${o.id}`}
              role="option"
              aria-selected={i === at}
              tabIndex={-1}
              data-uxcli="dependency-option"
              onMouseEnter={() => setActive(i)}
              onClick={() => onPick(o.id)}
              className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[12.5px] ${i === at ? 'bg-[#eef1ff]' : ''}`}
            >
              <span className="truncate font-semibold text-ink">{o.name}</span>
              <span className="flex-none text-[11px] text-muted">{moduleName.get(o.moduleId) ?? ''}</span>
            </button>
          ))
        ) : (
          <p className="px-3 py-2 text-[12px] text-muted">
            {q ? `No feature matches “${q}”.` : 'No feature can be added: the others are declared already, or depend on this one (that would be a cycle).'}
          </p>
        )}
      </div>
    </div>
  )
}

/** "If you change this": asked for, the answer with the canvas outlining the same items (P-0001). */
export function ImpactAnswer({ featureId }: { featureId: string }) {
  const data = useWorkspace((s) => s.currentData())
  const impactFor = useWorkspace((s) => s.impactFor)
  const showImpact = useWorkspace((s) => s.showImpact)
  const setView = useWorkspace((s) => s.setView)
  const select = useWorkspace((s) => s.select)
  const view = useWorkspace((s) => s.selected?.view ?? 'mindmap')
  const projectId = useWorkspace((s) => s.activeProjectId)
  const live = useWorkspace((s) => s.syncStatus === 'live' && !s.shareMode)
  const shown = impactFor === featureId
  const a = useMemo(() => (shown ? impactAnswer(data, featureId) : null), [shown, data, featureId])

  const ask = () => {
    if (shown) return showImpact(null)
    showImpact(featureId)
    // P-0002: a person's question counts in the same log as an agent's compute_impact call
    if (live && projectId)
      authFetch(`/api/projects/${encodeURIComponent(projectId)}/impact-query`, { method: 'POST' }).catch(() => {})
  }

  const byId = new Map(data.features.map((f) => [f.id, f]))
  const moduleName = new Map(data.modules.map((m) => [m.id, m.name]))
  const nodeLabel = new Map(data.swimNodes.map((n) => [n.id, n.label]))
  const laneName = new Map(data.lanes.map((l) => [l.id, l.name]))
  const open = (id: string) => select({ type: 'feature', id, view: view === 'story' ? 'story' : 'mindmap' })
  const group = (label: string, ids: string[]) =>
    ids.length ? (
      <li>
        <div className="text-[11px] font-bold text-muted">{label}</div>
        <div className="mt-1 flex flex-col gap-1">
          {ids.map((id) => (
            <button key={id} onClick={() => open(id)} className="flex items-baseline justify-between gap-2 rounded-md px-1.5 py-1 text-left hover:bg-[#f4f6f9]">
              <span className="truncate text-[12.5px] font-semibold text-ink">{byId.get(id)?.name ?? id}</span>
              <span className="flex-none text-[11px] text-muted">{moduleName.get(byId.get(id)?.moduleId ?? '') ?? ''}</span>
            </button>
          ))}
        </div>
      </li>
    ) : null

  return (
    <section className="mt-4">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel>IF YOU CHANGE THIS</FieldLabel>
        <button
          onClick={ask}
          data-uxcli="ask-impact"
          aria-expanded={shown}
          className="-mt-1.5 rounded-lg border border-line bg-white px-2.5 py-1 text-[12px] font-bold text-brand hover:bg-[#eef1ff]"
        >
          {shown ? 'Hide' : 'Show what it touches'}
        </button>
      </div>
      {a && (
        <div data-uxcli="impact-answer" aria-live="polite" className="mt-1 rounded-xl border border-[#f3c9cb] bg-[#fffafa] p-3">
          <p className="text-[13.5px] font-bold leading-snug text-ink">{a.sentence}</p>
          <ul className="mt-2 flex flex-col gap-2.5">
            {group('Depends on it directly', a.direct)}
            {group('Depends on it through another feature', a.indirect)}
            {group('Linked to a step after it in the workflow', a.viaWorkflow)}
            {a.steps.length > 0 && (
              <li>
                <div className="text-[11px] font-bold text-muted">Workflow steps after it</div>
                <p className="mt-1 px-1.5 text-[12px] leading-[1.5] text-ink">{a.steps.map((id) => nodeLabel.get(id) ?? id).join(' → ')}</p>
                {a.impact.affectedLanes.length > 0 && (
                  <p className="mt-0.5 px-1.5 text-[11px] text-muted">Lanes: {a.impact.affectedLanes.map((l) => laneName.get(l) ?? l).join(' · ')}</p>
                )}
              </li>
            )}
          </ul>
          {a.impact.entryNodes.length > 0 && (
            <button
              onClick={() => {
                setView('swimlane')
                select({ type: 'swimnode', id: a.impact.entryNodes[0], view: 'swimlane' })
              }}
              className="mt-2.5 flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[12px] font-bold text-brand hover:bg-[#eef1ff]"
            >
              <Workflow size={13} strokeWidth={2.2} /> Show the steps in Swimlane
            </button>
          )}
          <p className="mt-2 text-[11px] leading-[1.45] text-muted">
            From the dependencies and swimlane links on this board — what an agent's compute_impact returns. Nothing outside this project.
          </p>
        </div>
      )}
    </section>
  )
}
