import { useEffect, useRef, useState } from 'react'
import { Link2, Download, Upload, Copy, Check, Trash2, Loader2 } from 'lucide-react'
import { useWorkspace } from '@/store/useWorkspace'
import { useToast } from '@/store/useToast'
import { authFetch } from '@/store/api'

export default function ShareMenu() {
  const project = useWorkspace((s) => s.activeProject())
  const importProjectData = useWorkspace((s) => s.importProjectData)
  const show = useToast((s) => s.show)
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const shareUrl = token ? `${window.location.origin}/share/${token}` : null

  // Load the project's current share token when the menu opens.
  useEffect(() => {
    if (!open || !project) return
    void authFetch(`/api/projects/${project.id}/share`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setToken(d?.token ?? null))
      .catch(() => setToken(null))
  }, [open, project])

  const createLink = async () => {
    if (!project) return
    setBusy(true)
    try {
      const r = await authFetch(`/api/projects/${project.id}/share`, { method: 'POST' })
      const d = await r.json()
      if (!r.ok) throw new Error()
      setToken(d.token)
      await navigator.clipboard.writeText(`${window.location.origin}/share/${d.token}`).catch(() => {})
      show('Read-only link created & copied')
    } catch {
      show('Could not create link')
    } finally {
      setBusy(false)
    }
  }

  const copyLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
      show('Link copied')
    } catch {
      show('Could not copy')
    }
  }

  const revokeLink = async () => {
    if (!project || !confirm('Revoke this link? Anyone holding it loses access.')) return
    try {
      await authFetch(`/api/projects/${project.id}/share`, { method: 'DELETE' })
      setToken(null)
      show('Link revoked')
    } catch {
      show('Could not revoke')
    }
  }

  const exportJson = () => {
    if (!project) return
    const payload = JSON.stringify({ kinetrak: 1, name: project.name, data: project.data, snapshots: project.snapshots }, null, 2)
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/[^\w-]+/g, '_')}.kinetrak.json`
    a.click()
    URL.revokeObjectURL(url)
    show('Project exported')
    setOpen(false)
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const id = importProjectData(await file.text())
    show(id ? 'Project imported' : 'Invalid project file')
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-[34px] rounded-[9px] bg-brand px-[15px] text-[13px] font-bold text-white shadow-[0_2px_6px_rgba(47,111,237,.30)] hover:bg-brand-dark"
      >
        Share
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-[60] w-[320px] animate-pop rounded-xl border border-line bg-white p-1.5 shadow-pop">
            <div className="px-2.5 pb-1 pt-2 text-[10.5px] font-bold tracking-wide text-faint">READ-ONLY SHARE LINK</div>

            {shareUrl ? (
              <div className="px-2 pb-1.5">
                <div className="flex items-center gap-1.5 rounded-lg border border-line bg-[#fbfcfd] px-2.5 py-1.5">
                  <Link2 size={14} className="flex-none text-brand" />
                  <span className="flex-1 truncate font-mono text-[11px] text-muted">{shareUrl}</span>
                  <button onClick={copyLink} title="Copy" className="flex h-7 w-7 flex-none items-center justify-center rounded-md text-faint hover:bg-[#eef1ff] hover:text-brand">
                    {copied ? <Check size={14} className="text-[#16a34a]" /> : <Copy size={14} />}
                  </button>
                  <button onClick={revokeLink} title="Revoke" className="flex h-7 w-7 flex-none items-center justify-center rounded-md text-faint hover:bg-[#fdecec] hover:text-[#e5484d]">
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="px-0.5 pt-1.5 text-[11px] leading-snug text-faint">Anyone with this link sees a live, read-only view — no account needed.</p>
              </div>
            ) : (
              <Item
                icon={busy ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />}
                title="Create read-only link"
                sub="Live present view — no login required"
                onClick={createLink}
              />
            )}

            <div className="mt-1 border-t border-[#eef0f3] pt-1">
              <Item icon={<Download size={15} />} title="Export project (JSON)" sub="Download a portable copy" onClick={exportJson} />
              <Item icon={<Upload size={15} />} title="Import project (JSON)" sub="Create a project from a file" onClick={() => fileRef.current?.click()} />
              <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Item({ icon, title, sub, onClick }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-[#f4f6f9]">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#eef1ff] text-brand">{icon}</span>
      <span className="flex flex-1 flex-col">
        <span className="text-[12.5px] font-bold text-ink">{title}</span>
        <span className="text-[11px] text-faint">{sub}</span>
      </span>
    </button>
  )
}
