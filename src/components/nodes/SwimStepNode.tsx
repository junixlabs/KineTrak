import { Handle, Position } from '@xyflow/react'
import { nodeStatusColor } from '@/theme/tokens'
import type { NodeKind, NodeStatus } from '@/store/types'

export interface SwimStepData {
  nodeId: string
  label: string
  kind: NodeKind
  status: NodeStatus
  dim: boolean
  focused: boolean
  compact: boolean
  width: number
  height: number
}

export default function SwimStepNode({ data }: { data: SwimStepData }) {
  const terminal = data.kind === 'start' || data.kind === 'end'
  const decision = data.kind === 'decision'
  const statusColor = nodeStatusColor[data.status]

  const base =
    'flex items-center gap-2 rounded-xl border px-3 transition-[opacity,box-shadow,border-color] duration-200'
  const bg = terminal ? '#14181f' : '#ffffff'
  const textColor = terminal ? '#ffffff' : '#14181f'
  const borderColor = data.focused ? '#2f6fed' : decision ? '#7c5cff' : terminal ? '#14181f' : '#e5e8ec'

  return (
    <div
      className={base}
      style={{
        width: data.width,
        height: data.height,
        background: bg,
        borderColor,
        opacity: data.dim ? 0.28 : 1,
        boxShadow: data.focused
          ? '0 0 0 3px rgba(47,111,237,.16), 0 8px 20px rgba(47,111,237,.18)'
          : '0 1px 3px rgba(20,24,31,.10)',
        cursor: 'pointer',
      }}
    >
      <Handle type="target" position={Position.Left} className="!opacity-0" isConnectable={false} />

      <span
        className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-md font-mono text-[12px] font-bold"
        style={{
          background: terminal ? 'rgba(255,255,255,.16)' : decision ? '#efeaff' : '#eef1ff',
          color: terminal ? '#fff' : decision ? '#7c5cff' : '#3a4fc4',
        }}
      >
        {data.nodeId}
      </span>

      {!data.compact && (
        <span className="flex-1 text-[12px] font-semibold leading-tight" style={{ color: textColor }}>
          {data.label}
        </span>
      )}
      {data.compact && <span className="flex-1" />}

      <span className="h-2 w-2 flex-none rounded-full" style={{ background: statusColor }} />

      <Handle type="source" position={Position.Right} className="!opacity-0" isConnectable={false} />
    </div>
  )
}
