import { useState } from 'react'
import { Users, ChevronDown, Check } from 'lucide-react'
import { useWorkspace } from '@/store/useWorkspace'
import type { Role } from '@/store/types'

const ROLES: Role[] = ['PM', 'PO', 'BA', 'Dev', 'Tester']

export default function RoleFilter() {
  const roleFilter = useWorkspace((s) => s.roleFilter)
  const setRoleFilter = useWorkspace((s) => s.setRoleFilter)
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 items-center gap-2 rounded-lg border px-[11px] hover:bg-[#f4f6f9]"
        style={{
          borderColor: roleFilter ? '#c9d8ff' : '#e5e8ec',
          background: roleFilter ? '#f1f5ff' : '#fff',
        }}
      >
        <Users size={13} strokeWidth={2} style={{ color: roleFilter ? '#2f6fed' : '#5b6470' }} />
        <span
          className="text-[12.5px] font-semibold"
          style={{ color: roleFilter ? '#2f6fed' : '#5b6470' }}
        >
          {roleFilter ? `Role: ${roleFilter}` : 'All roles'}
        </span>
        <ChevronDown size={11} className="text-faint" strokeWidth={2.4} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-[38px] z-[60] w-[200px] animate-pop rounded-xl border border-line bg-white p-1.5 shadow-pop">
            <div className="px-2.5 pb-1.5 pt-2 text-[10.5px] font-bold tracking-wide text-faint">
              FILTER BY ROLE
            </div>
            <button
              onClick={() => {
                setRoleFilter(null)
                setOpen(false)
              }}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12.5px] font-semibold text-ink hover:bg-[#f4f6f9]"
            >
              All roles
              {!roleFilter && <Check size={14} className="text-brand" strokeWidth={2.5} />}
            </button>
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRoleFilter(r)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12.5px] font-semibold text-ink hover:bg-[#f4f6f9]"
              >
                {r}
                {roleFilter === r && <Check size={14} className="text-brand" strokeWidth={2.5} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
