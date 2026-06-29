import { useMemo, useRef, useState } from 'react'
import {
  LineChart,
  Search,
  Home as HomeIcon,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Network,
  LayoutGrid,
  Workflow,
  UserPlus,
  Sparkles,
  Gift,
  Bell,
  Upload,
  Plug,
  LogOut,
} from 'lucide-react'
import { useWorkspace } from '@/store/useWorkspace'
import { useToast } from '@/store/useToast'
import { logout } from '@/store/auth'
import type { ProjectTemplate } from '@/store/types'

const fmtDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Home() {
  const orgs = useWorkspace((s) => s.orgs)
  const projects = useWorkspace((s) => s.projects)
  const openProject = useWorkspace((s) => s.openProject)
  const createProject = useWorkspace((s) => s.createProject)
  const renameProject = useWorkspace((s) => s.renameProject)
  const deleteProject = useWorkspace((s) => s.deleteProject)
  const createOrg = useWorkspace((s) => s.createOrg)
  const renameOrg = useWorkspace((s) => s.renameOrg)
  const deleteOrg = useWorkspace((s) => s.deleteOrg)
  const importProjectData = useWorkspace((s) => s.importProjectData)
  const goConnect = useWorkspace((s) => s.goConnect)
  const resetAll = useWorkspace((s) => s.resetAll)
  const currentUser = useWorkspace((s) => s.currentUser)
  const show = useToast((s) => s.show)
  const initials = (currentUser?.name || currentUser?.email || 'ME').slice(0, 2).toUpperCase()

  const [query, setQuery] = useState('')
  const [avatarOpen, setAvatarOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      show('Link copied to clipboard')
    } catch {
      show('Could not copy link')
    }
  }
  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const id = importProjectData(await f.text())
    show(id ? 'Project imported' : 'Invalid project file')
    setAvatarOpen(false)
  }
  const [nav, setNav] = useState<'home' | 'recent'>('home')
  const [orgFilter, setOrgFilter] = useState<string | null>(null)
  const [editOrg, setEditOrg] = useState<{ id: string; val: string } | null>(null)
  const [editProj, setEditProj] = useState<{ id: string; val: string } | null>(null)

  const create = (template: ProjectTemplate) => {
    let orgId = orgFilter ?? orgs[0]?.id
    if (!orgId) orgId = createOrg('My workspace')
    createProject(orgId, '', template)
  }

  const visible = useMemo(() => {
    let list = projects
    if (orgFilter) list = list.filter((p) => p.orgId === orgFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    if (nav === 'recent') list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return list
  }, [projects, orgFilter, query, nav])

  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* Sidebar */}
      <aside className="flex w-[260px] flex-none flex-col border-r border-line bg-[#fbfcfd]">
        <div className="flex items-center gap-2.5 px-4 py-3.5">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-gradient-to-br from-brand to-brand-light shadow-[0_2px_6px_rgba(47,111,237,.35)]">
            <LineChart size={17} className="text-white" strokeWidth={2.4} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-extrabold tracking-tight">KineTrak</span>
            <span className="mt-0.5 text-[8.5px] font-bold tracking-[2px] text-faint">PLATFORM</span>
          </div>
        </div>

        <div className="px-3">
          <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-2.5">
            <Search size={14} className="text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title"
              className="h-9 flex-1 bg-transparent text-[13px] outline-none"
            />
          </div>
        </div>

        <nav className="mt-3 px-3">
          <SideItem active={nav === 'home'} onClick={() => setNav('home')} icon={<HomeIcon size={17} />} label="Home" />
          <SideItem active={nav === 'recent'} onClick={() => setNav('recent')} icon={<Clock size={17} />} label="Recent" />
        </nav>

        <div className="mt-4 flex items-center justify-between px-4 pb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wide text-faint">Spaces</span>
          <button onClick={() => createOrg('New space')} className="flex h-6 w-6 items-center justify-center rounded-md text-faint hover:bg-[#eef1ff] hover:text-brand" title="New space">
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-3">
          <button
            onClick={() => setOrgFilter(null)}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold hover:bg-[#f1f3f6]"
            style={{ background: orgFilter === null ? '#eef1ff' : 'transparent', color: orgFilter === null ? '#2a4a8f' : '#14181f' }}
          >
            All projects
          </button>
          {orgs.map((org) => (
            <div key={org.id} className="group flex items-center gap-1">
              {editOrg?.id === org.id ? (
                <InlineEdit
                  value={editOrg.val}
                  onChange={(v) => setEditOrg({ id: org.id, val: v })}
                  onCommit={() => {
                    if (editOrg.val.trim()) renameOrg(org.id, editOrg.val.trim())
                    setEditOrg(null)
                  }}
                  onCancel={() => setEditOrg(null)}
                />
              ) : (
                <>
                  <button
                    onClick={() => setOrgFilter(org.id)}
                    className="flex flex-1 items-center gap-2 truncate rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold hover:bg-[#f1f3f6]"
                    style={{ background: orgFilter === org.id ? '#eef1ff' : 'transparent', color: orgFilter === org.id ? '#2a4a8f' : '#14181f' }}
                  >
                    <span className="flex h-5 w-5 flex-none items-center justify-center rounded-md bg-brand/15 text-[11px] font-bold text-brand">
                      {org.name[0]?.toUpperCase()}
                    </span>
                    <span className="truncate">{org.name}</span>
                  </button>
                  <IconBtn title="Rename space" onClick={() => setEditOrg({ id: org.id, val: org.name })}><Pencil size={12} /></IconBtn>
                  <IconBtn title="Delete space" danger onClick={() => confirm(`Delete space "${org.name}" and all its projects?`) && deleteOrg(org.id)}><Trash2 size={12} /></IconBtn>
                </>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Main column: top header + scrollable content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 flex-none items-center gap-3 border-b border-line bg-white px-6">
          <span className="text-[15px] font-extrabold tracking-tight text-ink">Workspace</span>
          <span className="rounded-md bg-[#eef1ff] px-2 py-0.5 text-[11px] font-bold text-brand">Free</span>
          <div className="flex-1" />
          <button onClick={goConnect} className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-ink hover:bg-[#f4f6f9]">
            <Plug size={15} strokeWidth={2} /> Connect agent
          </button>
          <button onClick={copyLink} className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-ink hover:bg-[#f4f6f9]">
            <UserPlus size={15} strokeWidth={2} /> Invite members
          </button>
          <button
            onClick={() => show('All features are included on the local Free plan')}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-[13px] font-bold text-white shadow-[0_2px_6px_rgba(47,111,237,.30)] hover:bg-brand-dark"
          >
            <Sparkles size={15} strokeWidth={2} /> Upgrade
          </button>
          <button onClick={() => show('KineTrak is up to date')} title="What's new" className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-muted hover:bg-[#f4f6f9]">
            <Gift size={16} strokeWidth={2} />
          </button>
          <button onClick={() => show('No new notifications')} title="Notifications" className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-muted hover:bg-[#f4f6f9]">
            <Bell size={16} strokeWidth={2} />
          </button>
          <div className="relative">
            <button onClick={() => setAvatarOpen((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-full bg-grape text-[12px] font-bold text-white hover:opacity-90">
              {initials}
            </button>
            {avatarOpen && (
              <>
                <div className="fixed inset-0 z-[55]" onClick={() => setAvatarOpen(false)} />
                <div className="absolute right-0 top-11 z-[60] w-[230px] animate-pop rounded-xl border border-line bg-white p-1.5 shadow-pop">
                  <div className="px-2.5 pb-1.5 pt-2">
                    <div className="truncate text-[12.5px] font-bold text-ink">{currentUser?.name ?? 'Local workspace'}</div>
                    <div className="truncate text-[11px] text-faint">{currentUser?.email ?? 'Stored in this browser'}</div>
                  </div>
                  <button onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-semibold text-ink hover:bg-[#f4f6f9]">
                    <Upload size={14} className="text-muted" /> Import project…
                  </button>
                  {currentUser ? (
                    <button
                      onClick={() => { setAvatarOpen(false); void logout() }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-semibold text-ink hover:bg-[#f4f6f9]"
                    >
                      <LogOut size={14} className="text-muted" /> Sign out
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (confirm('Reset all data? This removes every org and project in this browser.')) {
                          resetAll()
                          show('All data reset')
                        }
                        setAvatarOpen(false)
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-semibold text-[#e5484d] hover:bg-[#fdecec]"
                    >
                      <Trash2 size={14} /> Reset all data
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1180px] px-8 py-7">
          {/* Templates */}
          <div className="mb-8">
            <h2 className="mb-3 text-[15px] font-bold text-ink">Start a new project</h2>
            <div className="flex gap-3">
              <TemplateCard label="Blank board" sub="Empty scaffold" onClick={() => create('blank')} accent="#2f6fed">
                <Plus size={26} className="text-brand" strokeWidth={2} />
              </TemplateCard>
              <TemplateCard label="Sample data" sub="KineTrak demo" onClick={() => create('sample')} accent="#7c5cff">
                <div className="flex gap-1.5">
                  <Network size={18} className="text-brand" />
                  <LayoutGrid size={18} className="text-grape" />
                  <Workflow size={18} className="text-teal" />
                </div>
              </TemplateCard>
            </div>
          </div>

          {/* Projects */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-ink">Projects {orgFilter && <span className="text-faint">· {orgs.find((o) => o.id === orgFilter)?.name}</span>}</h2>
            <button onClick={() => create('blank')} className="flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-[13px] font-bold text-white shadow-[0_2px_6px_rgba(47,111,237,.30)] hover:bg-brand-dark">
              <Plus size={15} strokeWidth={2.5} /> Create new
            </button>
          </div>

          {visible.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line py-16 text-center text-[13px] text-faint">
              No projects yet. Start one above.
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
              {visible.map((p) => {
                const mods = p.data.modules.length
                const feats = p.data.features.length
                const org = orgs.find((o) => o.id === p.orgId)
                const accent = p.data.modules[0]?.color ?? '#2f6fed'
                return (
                  <div key={p.id} className="group overflow-hidden rounded-xl border border-line bg-white shadow-card transition-shadow hover:shadow-pop">
                    <button onClick={() => openProject(p.id)} className="block w-full text-left">
                      <div className="relative h-[96px] overflow-hidden" style={{ background: `linear-gradient(135deg, ${accent}1a, ${accent}33)` }}>
                        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-70">
                          <Network size={20} style={{ color: accent }} />
                          <LayoutGrid size={20} style={{ color: accent }} />
                          <Workflow size={20} style={{ color: accent }} />
                        </div>
                      </div>
                    </button>
                    <div className="flex items-start gap-1 p-3">
                      <button onClick={() => openProject(p.id)} className="flex-1 text-left">
                        {editProj?.id === p.id ? (
                          <InlineEdit
                            value={editProj.val}
                            onChange={(v) => setEditProj({ id: p.id, val: v })}
                            onCommit={() => {
                              if (editProj.val.trim()) renameProject(p.id, editProj.val.trim())
                              setEditProj(null)
                            }}
                            onCancel={() => setEditProj(null)}
                          />
                        ) : (
                          <div className="truncate text-[13.5px] font-bold text-ink">{p.name}</div>
                        )}
                        <div className="mt-0.5 text-[11px] text-faint">
                          {org?.name} · {mods} modules · {feats} features
                        </div>
                        <div className="mt-1 font-mono text-[10.5px] text-faint">Created {fmtDate(p.createdAt)}</div>
                      </button>
                      <div className="flex flex-none flex-col gap-0.5">
                        <IconBtn title="Rename" onClick={() => setEditProj({ id: p.id, val: p.name })}><Pencil size={12} /></IconBtn>
                        <IconBtn title="Delete" danger onClick={() => confirm(`Delete project "${p.name}"?`) && deleteProject(p.id)}><Trash2 size={12} /></IconBtn>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  )
}

function SideItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-semibold hover:bg-[#f1f3f6]"
      style={{ background: active ? '#eef1ff' : 'transparent', color: active ? '#2a4a8f' : '#14181f' }}
    >
      <span style={{ color: active ? '#2f6fed' : '#5b6470' }}>{icon}</span>
      {label}
    </button>
  )
}

function TemplateCard({ label, sub, onClick, accent, children }: { label: string; sub: string; onClick: () => void; accent: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="w-[170px] overflow-hidden rounded-xl border border-line bg-white text-left shadow-card transition-shadow hover:shadow-pop">
      <div className="flex h-[92px] items-center justify-center" style={{ background: `${accent}0f` }}>{children}</div>
      <div className="px-3 py-2.5">
        <div className="text-[13px] font-bold text-ink">{label}</div>
        <div className="text-[11px] text-faint">{sub}</div>
      </div>
    </button>
  )
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={`flex h-7 w-7 flex-none items-center justify-center rounded-md text-faint opacity-0 group-hover:opacity-100 ${
        danger ? 'hover:bg-[#fdecec] hover:text-[#e5484d]' : 'hover:bg-[#eef1ff] hover:text-brand'
      }`}
    >
      {children}
    </button>
  )
}

function InlineEdit({ value, onChange, onCommit, onCancel }: { value: string; onChange: (v: string) => void; onCommit: () => void; onCancel: () => void }) {
  return (
    <div className="flex flex-1 items-center gap-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Enter') onCommit(); if (e.key === 'Escape') onCancel() }}
        className="h-7 flex-1 rounded-md border border-brand px-2 text-[13px] outline-none"
      />
      <button onClick={(e) => { e.stopPropagation(); onCommit() }} className="flex h-7 w-7 items-center justify-center rounded-md text-brand hover:bg-[#eef1ff]"><Check size={14} strokeWidth={2.5} /></button>
      <button onClick={(e) => { e.stopPropagation(); onCancel() }} className="flex h-7 w-7 items-center justify-center rounded-md text-faint hover:bg-[#f4f6f9]"><X size={14} /></button>
    </div>
  )
}
