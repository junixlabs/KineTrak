import { Handle, Position } from '@xyflow/react'
import { LineChart } from 'lucide-react'

export interface MindRootData {
  moduleCount: number
  featureCount: number
}

export default function MindRootNode({ data }: { data: MindRootData }) {
  return (
    <div className="flex h-[68px] w-[188px] items-center gap-2.5 rounded-[17px] bg-gradient-to-br from-brand to-brand-light px-4 shadow-[0_8px_22px_rgba(47,111,237,.30)]">
      <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[10px] bg-white/20">
        <LineChart size={19} className="text-white" strokeWidth={2.4} />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-extrabold tracking-tight text-white">KineTrak Platform</span>
        <span className="text-[10.5px] font-semibold text-white/80">
          {data.moduleCount} modules · {data.featureCount} features
        </span>
      </div>
      <Handle id="right" type="source" position={Position.Right} className="!opacity-0" isConnectable={false} />
      <Handle id="left" type="source" position={Position.Left} className="!opacity-0" isConnectable={false} />
    </div>
  )
}
