import { Handle, Position } from '@xyflow/react'
import { featureStatusMeta } from '@/theme/tokens'
import type { FeatureStatus } from '@/store/types'

export interface MindFeatureData {
  name: string
  status: FeatureStatus
  dim: boolean
  selected: boolean
}

export default function MindFeatureNode({ data }: { data: MindFeatureData }) {
  const meta = featureStatusMeta[data.status]
  return (
    <div
      className="flex h-[46px] w-[256px] items-center gap-[9px] rounded-[10px] border bg-white px-3 transition-[opacity,box-shadow,border-color] duration-200"
      style={{
        borderColor: data.selected ? '#2f6fed' : '#e5e8ec',
        boxShadow: data.selected
          ? '0 0 0 3px rgba(47,111,237,.14), 0 6px 16px rgba(47,111,237,.18)'
          : '0 1px 2px rgba(20,24,31,.07)',
        opacity: data.dim ? 0.3 : 1,
      }}
    >
      <span className="h-2 w-2 flex-none rounded-full" style={{ background: meta.color }} />
      <span className="flex-1 text-[12.5px] font-semibold leading-tight text-ink">{data.name}</span>
      <span
        className="flex-none whitespace-nowrap rounded-full px-[7px] py-0.5 text-[10px] font-bold"
        style={{ color: meta.color, background: meta.bg }}
      >
        {meta.label}
      </span>
      <Handle id="in-left" type="target" position={Position.Left} className="!opacity-0" isConnectable={false} />
      <Handle id="in-right" type="target" position={Position.Right} className="!opacity-0" isConnectable={false} />
    </div>
  )
}
