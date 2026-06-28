import { useRef, useState } from 'react'
import { Link2, Download, Upload } from 'lucide-react'
import { useWorkspace } from '@/store/useWorkspace'
import { useToast } from '@/store/useToast'

export default function ShareMenu() {
  const project = useWorkspace((s) => s.activeProject())
  const importProjectData = useWorkspace((s) => s.importProjectData)
  const show = useToast((s) => s.show)
  const [open, setOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      show('Link copied to clipboard')
    } catch {
      show('Could not copy link')
    }
    setOpen(false)
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
    const text = await file.text()
    const id = importProjectData(text)
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
          <div className="absolute right-0 top-11 z-[60] w-[280px] animate-pop rounded-xl border border-line bg-white p-1.5 shadow-pop">
            <div className="px-2.5 pb-1.5 pt-2 text-[10.5px] font-bold tracking-wide text-faint">SHARE · EXPORT</div>
            <Item icon={<Link2 size={15} />} title="Copy link" sub="Open this workspace in your browser" onClick={copyLink} />
            <Item icon={<Download size={15} />} title="Export project (JSON)" sub="Download a portable copy" onClick={exportJson} />
            <Item icon={<Upload size={15} />} title="Import project (JSON)" sub="Create a project from a file" onClick={() => fileRef.current?.click()} />
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
            <div className="mt-1 border-t border-[#eef0f3] px-2.5 pb-1.5 pt-2 text-[11px] leading-snug text-faint">
              Data is stored locally in this browser. Export to share with teammates.
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
