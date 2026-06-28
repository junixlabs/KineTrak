import { useState } from 'react'
import { ChevronDown, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { useWorkspace } from '@/store/useWorkspace'
import type { ProjectTemplate } from '@/store/types'

export default function ProjectSwitcher() {
  const orgs = useWorkspace((s) => s.orgs)
  const projects = useWorkspace((s) => s.projects)
  const activeProject = useWorkspace((s) => s.activeProject())
  const switchProject = useWorkspace((s) => s.switchProject)
  const createProject = useWorkspace((s) => s.createProject)
  const renameProject = useWorkspace((s) => s.renameProject)
  const deleteProject = useWorkspace((s) => s.deleteProject)
  const createOrg = useWorkspace((s) => s.createOrg)
  const renameOrg = useWorkspace((s) => s.renameOrg)
  const deleteOrg = useWorkspace((s) => s.deleteOrg)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<{ kind: 'org' | 'project'; id: string } | null>(null)
  const [editVal, setEditVal] = useState('')
  const [creating, setCreating] = useState<{ orgId: string } | null>(null)
  const [newName, setNewName] = useState('')
  const [template, setTemplate] = useState<ProjectTemplate>('sample')

  const startEdit = (kind: 'org' | 'project', id: string, val: string) => {
    setEditing({ kind, id })
    setEditVal(val)
  }
  const commitEdit = () => {
    if (!editing) return
    const v = editVal.trim()
    if (v) editing.kind === 'org' ? renameOrg(editing.id, v) : renameProject(editing.id, v)
    setEditing(null)
  }
  const startCreate = (orgId: string) => {
    setCreating({ orgId })
    setNewName('')
    setTemplate('sample')
  }
  const commitCreate = () => {
    if (!creating) return
    createProject(creating.orgId, newName, template)
    setCreating(null)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 items-center gap-[7px] rounded-lg border border-line bg-white px-[11px] hover:bg-[#f4f6f9]"
      >
        <span className="h-[7px] w-[7px] rounded-full bg-[#16a34a] shadow-[0_0_0_3px_#e7f6ee]" />
        <span className="max-w-[180px] truncate text-[13px] font-semibold text-ink">
          {activeProject?.name ?? 'No project'}
        </span>
        <ChevronDown size={11} className="text-faint" strokeWidth={2.4} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-[38px] z-[60] max-h-[70vh] w-[324px] animate-pop overflow-auto rounded-xl border border-line bg-white p-1.5 shadow-pop">
            <div className="flex items-center justify-between px-2.5 pb-1.5 pt-2">
              <span className="text-[10.5px] font-bold tracking-wide text-faint">ORG &amp; PROJECT</span>
              <button
                onClick={() => createOrg('New org')}
                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-bold text-brand hover:bg-[#eef1ff]"
              >
                <Plus size={12} strokeWidth={2.5} /> Org
              </button>
            </div>

            {orgs.map((org) => (
              <div key={org.id} className="mb-1">
                {/* Org row */}
                <div className="group flex items-center gap-1 px-1.5 py-1">
                  {editing?.kind === 'org' && editing.id === org.id ? (
                    <EditRow value={editVal} onChange={setEditVal} onCommit={commitEdit} onCancel={() => setEditing(null)} />
                  ) : (
                    <>
                      <span className="flex-1 truncate text-[11px] font-bold uppercase tracking-wide text-muted">{org.name}</span>
                      <RowBtn title="Rename org" onClick={() => startEdit('org', org.id, org.name)}><Pencil size={12} /></RowBtn>
                      <RowBtn
                        title="Delete org"
                        danger
                        onClick={() => {
                          if (confirm(`Delete org "${org.name}" and all its projects?`)) deleteOrg(org.id)
                        }}
                      >
                        <Trash2 size={12} />
                      </RowBtn>
                    </>
                  )}
                </div>

                {/* Projects in org */}
                {projects
                  .filter((p) => p.orgId === org.id)
                  .map((p) => {
                    const active = p.id === activeProject?.id
                    return (
                      <div
                        key={p.id}
                        className="group flex items-center gap-1 rounded-lg pr-1"
                        style={{ background: active ? '#f4f6f9' : 'transparent' }}
                      >
                        {editing?.kind === 'project' && editing.id === p.id ? (
                          <div className="flex-1 px-1.5 py-1">
                            <EditRow value={editVal} onChange={setEditVal} onCommit={commitEdit} onCancel={() => setEditing(null)} />
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                switchProject(p.id)
                                setOpen(false)
                              }}
                              className="flex flex-1 items-center gap-2 px-2.5 py-2 text-left hover:bg-[#f4f6f9]"
                            >
                              <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: active ? '#16a34a' : '#c7cdd6' }} />
                              <span className="flex-1 truncate text-[12.5px] font-semibold text-ink">{p.name}</span>
                              {active && <Check size={14} className="text-brand" strokeWidth={2.5} />}
                            </button>
                            <RowBtn title="Rename project" onClick={() => startEdit('project', p.id, p.name)}><Pencil size={12} /></RowBtn>
                            <RowBtn
                              title="Delete project"
                              danger
                              onClick={() => {
                                if (confirm(`Delete project "${p.name}"?`)) deleteProject(p.id)
                              }}
                            >
                              <Trash2 size={12} />
                            </RowBtn>
                          </>
                        )}
                      </div>
                    )
                  })}

                {/* Create project in this org */}
                {creating?.orgId === org.id ? (
                  <div className="mx-1 mt-1 rounded-lg border border-line bg-[#fbfcfd] p-2">
                    <input
                      autoFocus
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && commitCreate()}
                      placeholder="Project name…"
                      className="mb-2 h-8 w-full rounded-md border border-line px-2.5 text-[12.5px] outline-none focus:border-brand"
                    />
                    <div className="mb-2 flex gap-1.5">
                      {(['sample', 'blank'] as ProjectTemplate[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTemplate(t)}
                          className="flex-1 rounded-md border px-2 py-1.5 text-[11.5px] font-semibold"
                          style={{
                            borderColor: template === t ? '#2f6fed' : '#e5e8ec',
                            background: template === t ? '#eef1ff' : '#fff',
                            color: template === t ? '#2f6fed' : '#5b6470',
                          }}
                        >
                          {t === 'sample' ? 'Sample data' : 'Blank'}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={commitCreate} className="flex-1 rounded-md bg-brand py-1.5 text-[12px] font-bold text-white hover:bg-brand-dark">
                        Create
                      </button>
                      <button onClick={() => setCreating(null)} className="rounded-md border border-line px-3 py-1.5 text-[12px] font-semibold text-muted hover:bg-[#f4f6f9]">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => startCreate(org.id)}
                    className="mt-0.5 flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-brand hover:bg-[#eef1ff]"
                  >
                    <Plus size={13} strokeWidth={2.5} /> New project
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function RowBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex h-7 w-7 flex-none items-center justify-center rounded-md text-faint opacity-0 group-hover:opacity-100 ${
        danger ? 'hover:bg-[#fdecec] hover:text-[#e5484d]' : 'hover:bg-[#eef1ff] hover:text-brand'
      }`}
    >
      {children}
    </button>
  )
}

function EditRow({
  value,
  onChange,
  onCommit,
  onCancel,
}: {
  value: string
  onChange: (v: string) => void
  onCommit: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex flex-1 items-center gap-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onCommit()
          if (e.key === 'Escape') onCancel()
        }}
        className="h-7 flex-1 rounded-md border border-brand px-2 text-[12.5px] outline-none"
      />
      <button onClick={onCommit} className="flex h-7 w-7 items-center justify-center rounded-md text-brand hover:bg-[#eef1ff]"><Check size={14} strokeWidth={2.5} /></button>
      <button onClick={onCancel} className="flex h-7 w-7 items-center justify-center rounded-md text-faint hover:bg-[#f4f6f9]"><X size={14} /></button>
    </div>
  )
}
