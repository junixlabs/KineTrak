import { Handle, Position } from '@xyflow/react'
import { Boxes, Globe } from 'lucide-react'

export interface OrgSystemData {
  label: string
  /** Set when the node represents one of the org's projects. */
  projectName?: string
  meta?: string
  external: boolean
  focused: boolean
  editable: boolean
}

/** A system card on an org board: one of the org's projects (brand accent,
 *  click-through) or an external/third-party system (neutral, dashed). */
export default function OrgSystemNode({ data }: { data: OrgSystemData }) {
  const handleCls = data.editable ? '!h-2 !w-2 !border-2 !border-white !bg-brand' : '!opacity-0'
  const accent = data.external ? '#5b6470' : '#2f6fed'

  return (
    <div
      className="relative flex w-[240px] items-center gap-2.5 rounded-xl border bg-white px-3.5 py-2.5 transition-[box-shadow,border-color] duration-200"
      style={{
        borderColor: data.focused ? '#2f6fed' : '#e5e8ec',
        borderStyle: data.external ? 'dashed' : 'solid',
        boxShadow: data.focused ? '0 0 0 3px rgba(47,111,237,.16), 0 8px 20px rgba(47,111,237,.18)' : '0 1px 3px rgba(20,24,31,.10)',
        cursor: 'pointer',
      }}
    >
      <Handle type="target" position={Position.Left} className={handleCls} isConnectable={data.editable} />
      <span
        className="flex h-8 w-8 flex-none items-center justify-center rounded-lg"
        style={{ background: data.external ? '#f1f3f6' : '#eef1ff', color: accent }}
      >
        {data.external ? <Globe size={16} /> : <Boxes size={16} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold text-ink">{data.label}</span>
        <span className="block truncate text-[10.5px] text-faint">{data.external ? 'External system' : data.meta ?? 'Project'}</span>
      </span>
      <Handle type="source" position={Position.Right} className={handleCls} isConnectable={data.editable} />
    </div>
  )
}
