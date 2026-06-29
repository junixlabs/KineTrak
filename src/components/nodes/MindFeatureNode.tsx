import { Handle, Position } from '@xyflow/react'
import { featureStatusMeta } from '@/theme/tokens'
import type { FeatureStatus } from '@/store/types'

export interface MindFeatureData {
  name: string
  status: FeatureStatus
  dim: boolean
  selected: boolean
  recent?: boolean
}

export default function MindFeatureNode({ data }: { data: MindFeatureData }) {
  const meta = featureStatusMeta[data.status]
  return (
    <div
      className="relative flex h-[46px] w-[256px] items-center gap-[9px] rounded-[10px] border bg-white px-3 transition-[opacity,box-shadow,border-color] duration-200"
      style={{
        borderColor: data.selected ? '#2f6fed' : data.recent ? '#f59e0b' : '#e5e8ec',
        boxShadow: data.selected
          ? '0 0 0 3px rgba(47,111,237,.14), 0 6px 16px rgba(47,111,237,.18)'
          : data.recent
            ? '0 0 0 3px rgba(245,158,11,.20), 0 4px 12px rgba(245,158,11,.18)'
            : '0 1px 2px rgba(20,24,31,.07)',
        opacity: data.dim ? 0.3 : 1,
      }}
    >
      {data.recent && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber" />}
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
