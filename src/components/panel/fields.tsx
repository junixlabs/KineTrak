import { Plus, X, Check } from 'lucide-react'
import type { Role } from '@/store/types'

const ALL_ROLES: Role[] = ['PM', 'PO', 'BA', 'Dev', 'Tester']

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-[11px] font-bold tracking-wide text-faint">{children}</div>
}

export function TextField({
  value,
  onChange,
  placeholder,
  readOnly,
  big,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  readOnly?: boolean
  big?: boolean
}) {
  return (
    <input
      value={value}
      readOnly={readOnly}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-lg border bg-white outline-none transition-colors read-only:cursor-default read-only:border-transparent read-only:bg-transparent ${
        big ? 'px-2 py-1 text-[17px] font-bold text-ink' : 'px-2.5 py-1.5 text-[13px] text-ink'
      } border-line hover:border-[#cdd5e0] focus:border-brand`}
    />
  )
}

export function TextArea({
  value,
  onChange,
  placeholder,
  readOnly,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  readOnly?: boolean
}) {
  return (
    <textarea
      value={value}
      readOnly={readOnly}
      placeholder={placeholder}
      rows={3}
      onChange={(e) => onChange(e.target.value)}
      className="w-full resize-y rounded-lg border border-line bg-white px-2.5 py-2 text-[13px] leading-[1.5] text-[#3a4048] outline-none transition-colors read-only:cursor-default read-only:resize-none read-only:border-transparent read-only:bg-transparent hover:border-[#cdd5e0] focus:border-brand"
    />
  )
}

export function SelectField({
  value,
  onChange,
  options,
  readOnly,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  readOnly?: boolean
}) {
  return (
    <select
      value={value}
      disabled={readOnly}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[12.5px] font-semibold text-ink outline-none focus:border-brand disabled:cursor-default disabled:opacity-70"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

/** Editable list of short text lines (constraints, validations). */
export function ListEditor({
  items,
  onChange,
  placeholder,
  mono,
  readOnly,
}: {
  items: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  mono?: boolean
  readOnly?: boolean
}) {
  const set = (i: number, v: string) => onChange(items.map((x, j) => (j === i ? v : x)))
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i))
  const add = () => onChange([...items, ''])

  return (
    <div className="flex flex-col gap-1.5">
      {items.map((it, i) => (
        <div key={i} className="flex items-start gap-1.5">
          <span className="mt-2 flex-none font-bold text-brand">›</span>
          <input
            value={it}
            readOnly={readOnly}
            onChange={(e) => set(i, e.target.value)}
            className={`flex-1 rounded-md border border-line bg-white px-2 py-1.5 text-[12px] leading-[1.4] text-[#3a4048] outline-none read-only:border-transparent read-only:bg-transparent focus:border-brand ${
              mono ? 'font-mono' : ''
            }`}
          />
          {!readOnly && (
            <button onClick={() => remove(i)} className="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-md text-faint hover:bg-[#fdecec] hover:text-[#e5484d]">
              <X size={13} />
            </button>
          )}
        </div>
      ))}
      {!readOnly && (
        <button onClick={add} className="flex w-fit items-center gap-1 rounded-md px-1.5 py-1 text-[11.5px] font-semibold text-brand hover:bg-[#eef1ff]">
          <Plus size={12} strokeWidth={2.5} /> {placeholder ?? 'Add line'}
        </button>
      )}
    </div>
  )
}

/** Validation rules as a tickable checklist (criteria + per-item done state). */
export function ChecklistEditor({
  items,
  done,
  onChangeItems,
  onToggle,
  placeholder,
  readOnly,
}: {
  items: string[]
  done: string[]
  onChangeItems: (next: string[]) => void
  onToggle: (text: string, checked: boolean) => void
  placeholder?: string
  readOnly?: boolean
}) {
  const doneSet = new Set(done)
  const set = (i: number, v: string) => onChangeItems(items.map((x, j) => (j === i ? v : x)))
  const remove = (i: number) => onChangeItems(items.filter((_, j) => j !== i))
  const add = () => onChangeItems([...items, ''])
  const checkedCount = items.filter((x) => doneSet.has(x)).length

  return (
    <div className="flex flex-col gap-1.5">
      {items.length > 0 && (
        <div className="text-[11px] font-semibold text-faint">
          {checkedCount}/{items.length} passed
        </div>
      )}
      {items.map((it, i) => {
        const checked = doneSet.has(it)
        return (
          <div key={i} className="flex items-start gap-1.5">
            <button
              onClick={() => it.trim() && onToggle(it, !checked)}
              disabled={readOnly || !it.trim()}
              title={checked ? 'Passed' : 'Mark passed'}
              className="mt-1 flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px] border transition-colors disabled:cursor-default"
              style={{ borderColor: checked ? '#16a34a' : '#cdd5e0', background: checked ? '#16a34a' : '#fff' }}
            >
              {checked && <Check size={12} className="text-white" strokeWidth={3} />}
            </button>
            <input
              value={it}
              readOnly={readOnly}
              onChange={(e) => set(i, e.target.value)}
              className={`flex-1 rounded-md border border-line bg-white px-2 py-1.5 text-[12px] leading-[1.4] outline-none read-only:border-transparent read-only:bg-transparent focus:border-brand ${
                checked ? 'text-faint line-through' : 'text-[#3a4048]'
              }`}
            />
            {!readOnly && (
              <button onClick={() => remove(i)} className="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-md text-faint hover:bg-[#fdecec] hover:text-[#e5484d]">
                <X size={13} />
              </button>
            )}
          </div>
        )
      })}
      {!readOnly && (
        <button onClick={add} className="flex w-fit items-center gap-1 rounded-md px-1.5 py-1 text-[11.5px] font-semibold text-brand hover:bg-[#eef1ff]">
          <Plus size={12} strokeWidth={2.5} /> {placeholder ?? 'Add rule'}
        </button>
      )}
    </div>
  )
}

/** Toggleable role chips (module owners → drives the role filter). */
export function RoleChips({ value, onChange, readOnly }: { value: Role[]; onChange: (next: Role[]) => void; readOnly?: boolean }) {
  const toggle = (r: Role) => (value.includes(r) ? onChange(value.filter((x) => x !== r)) : onChange([...value, r]))
  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL_ROLES.map((r) => {
        const on = value.includes(r)
        return (
          <button
            key={r}
            disabled={readOnly}
            onClick={() => toggle(r)}
            className="rounded-full border px-2.5 py-1 text-[11.5px] font-bold transition-colors disabled:cursor-default"
            style={{
              borderColor: on ? '#2f6fed' : '#e5e8ec',
              background: on ? '#eef1ff' : '#fff',
              color: on ? '#2a4a8f' : '#9aa2ad',
            }}
          >
            {r}
          </button>
        )
      })}
    </div>
  )
}
