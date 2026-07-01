import { Handle, Position } from '@xyflow/react'
import { Plus, ChevronRight } from 'lucide-react'
import { useWorkspace } from '@/store/useWorkspace'

export interface MindModuleData {
  id: string
  name: string
  color: string
  done: number
  total: number
  ratio: number
  dim: boolean
  highlight: boolean
  recent?: boolean
  expanded: boolean
}

export default function MindModuleNode({ data }: { data: MindModuleData }) {
  const addFeature = useWorkspace((s) => s.addFeature)
  const editable = useWorkspace((s) => !s.isReadOnly() && !s.present)
  const firstRelease = useWorkspace((s) => s.currentData().releases[0]?.id)

  return (
    <div
      className="group relative flex h-[56px] w-[216px] flex-col justify-center gap-[7px] overflow-hidden rounded-[13px] border bg-white pl-[18px] pr-3.5 transition-[opacity,box-shadow,border-color] duration-200"
      style={{
        borderColor: data.highlight ? data.color : data.recent ? '#f59e0b' : '#e5e8ec',
        boxShadow: data.recent
          ? '0 0 0 3px rgba(245,158,11,.20), 0 4px 12px rgba(245,158,11,.18)'
          : data.highlight
            ? '0 6px 18px rgba(20,24,31,.12)'
            : '0 1px 2px rgba(20,24,31,.07)',
        opacity: data.dim ? 0.3 : 1,
      }}
    >
      {data.recent && <span className="absolute -right-1 -top-1 z-10 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber" />}
      <span className="absolute bottom-0 left-0 top-0 w-1" style={{ background: data.color }} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold leading-tight text-ink">{data.name}</span>
        <span className="flex flex-none items-center gap-1 font-mono text-[10px] font-bold text-faint">
          {data.done}/{data.total}
          {data.total > 0 && (
            <ChevronRight
              size={13}
              strokeWidth={2.75}
              className="transition-transform duration-200"
              style={{ transform: data.expanded ? 'rotate(90deg)' : 'none', color: data.expanded ? data.color : undefined }}
            />
          )}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-sm bg-[#eef0f3]">
        <div className="h-full rounded-sm transition-[width] duration-300" style={{ width: `${data.ratio}%`, background: data.color }} />
      </div>

      {editable && firstRelease && (
        <button
          title="Add feature"
          onClick={(e) => {
            e.stopPropagation()
            addFeature(data.id, firstRelease)
          }}
          className="absolute -right-2.5 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-brand opacity-0 shadow-card transition-opacity hover:bg-[#eef1ff] group-hover:opacity-100"
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      )}

      <Handle id="in-left" type="target" position={Position.Left} className="!opacity-0" isConnectable={false} />
      <Handle id="in-right" type="target" position={Position.Right} className="!opacity-0" isConnectable={false} />
      <Handle id="out-right" type="source" position={Position.Right} className="!opacity-0" isConnectable={false} />
      <Handle id="out-left" type="source" position={Position.Left} className="!opacity-0" isConnectable={false} />
    </div>
  )
}
