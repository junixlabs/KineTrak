import { useState } from 'react'
import { Clock, ChevronDown, Plus, Trash2, Check } from 'lucide-react'
import { useWorkspace } from '@/store/useWorkspace'

export default function SnapshotMenu() {
  const project = useWorkspace((s) => s.activeProject())
  const activeSnapshotId = useWorkspace((s) => s.activeSnapshotId)
  const snapMenuOpen = useWorkspace((s) => s.snapMenuOpen)
  const toggleSnapMenu = useWorkspace((s) => s.toggleSnapMenu)
  const setSnapshot = useWorkspace((s) => s.setSnapshot)
  const createSnapshot = useWorkspace((s) => s.createSnapshot)
  const deleteSnapshot = useWorkspace((s) => s.deleteSnapshot)
  const [newName, setNewName] = useState('')

  const snapshots = project?.snapshots ?? []
  const current = activeSnapshotId ? snapshots.find((s) => s.id === activeSnapshotId) : null
  const label = current ? current.name : 'Live'

  const save = () => {
    createSnapshot(newName)
    setNewName('')
  }

  return (
    <div className="relative">
      <button
        onClick={() => toggleSnapMenu()}
        className="flex h-8 items-center gap-2 rounded-lg border border-line bg-white px-[11px] hover:bg-[#f4f6f9]"
      >
        <Clock size={13} className="text-muted" strokeWidth={2} />
        <span className="max-w-[160px] truncate text-[12.5px] font-semibold text-muted">{label}</span>
        <ChevronDown size={11} className="text-faint" strokeWidth={2.4} />
      </button>

      {snapMenuOpen && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => toggleSnapMenu(false)} />
          <div className="absolute left-0 top-[38px] z-[60] w-[290px] animate-pop rounded-xl border border-line bg-white p-1.5 shadow-pop">
            <div className="px-2.5 pb-1.5 pt-2 text-[10.5px] font-bold tracking-wide text-faint">
              SNAPSHOT &amp; VERSION CONTROL
            </div>

            {/* Live */}
            <button
              onClick={() => setSnapshot(null)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] text-left hover:bg-[#f4f6f9]"
              style={{ background: !activeSnapshotId ? '#f4f6f9' : 'transparent' }}
            >
              <span className="h-2 w-2 flex-none rounded-full bg-[#16a34a]" />
              <span className="flex flex-1 flex-col gap-px">
                <span className="text-[12.5px] font-semibold text-ink">Bản hiện tại (Live)</span>
                <span className="font-mono text-[11px] text-faint">đang chỉnh sửa</span>
              </span>
              {!activeSnapshotId && <Check size={14} className="text-brand" strokeWidth={2.5} />}
            </button>

            {/* Stored snapshots */}
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className="group flex items-center gap-1 rounded-lg pr-1 hover:bg-[#f4f6f9]"
                style={{ background: snap.id === activeSnapshotId ? '#f4f6f9' : 'transparent' }}
              >
                <button onClick={() => setSnapshot(snap.id)} className="flex flex-1 items-center gap-2.5 px-2.5 py-[9px] text-left">
                  <span className="h-2 w-2 flex-none rounded-full" style={{ background: snap.dot }} />
                  <span className="flex flex-1 flex-col gap-px">
                    <span className="text-[12.5px] font-semibold text-ink">{snap.name}</span>
                    <span className="font-mono text-[11px] text-faint">{snap.date}</span>
                  </span>
                  <span className="rounded-full px-[7px] py-0.5 text-[10px] font-bold" style={{ color: snap.tagColor, background: snap.tagBg }}>
                    {snap.tag}
                  </span>
                </button>
                <button
                  onClick={() => deleteSnapshot(snap.id)}
                  className="flex h-7 w-7 flex-none items-center justify-center rounded-md text-faint opacity-0 hover:bg-[#fdecec] hover:text-[#e5484d] group-hover:opacity-100"
                  title="Xoá snapshot"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            {snapshots.length === 0 && (
              <div className="px-2.5 py-2 text-[11.5px] text-faint">Chưa có snapshot nào.</div>
            )}

            {/* Create */}
            <div className="mt-1 flex items-center gap-1.5 border-t border-[#eef0f3] p-1.5 pt-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && save()}
                placeholder="Tên snapshot…"
                className="h-8 flex-1 rounded-lg border border-line px-2.5 text-[12.5px] outline-none focus:border-brand"
              />
              <button
                onClick={save}
                className="flex h-8 items-center gap-1 rounded-lg bg-brand px-2.5 text-[12px] font-bold text-white hover:bg-brand-dark"
              >
                <Plus size={13} strokeWidth={2.5} /> Tạo
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
