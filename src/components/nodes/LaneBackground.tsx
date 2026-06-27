export interface LaneData {
  name: string
  sub: string
  color: string
  width: number
  height: number
  dim: boolean
}

/** Full-width swimlane band rendered behind the step nodes. */
export default function LaneBackground({ data }: { data: LaneData }) {
  return (
    <div
      className="pointer-events-none relative transition-opacity duration-200"
      style={{ width: data.width, height: data.height, opacity: data.dim ? 0.45 : 1 }}
    >
      <div
        className="absolute inset-0 border-y"
        style={{ background: hexA(data.color, data.dim ? 0.012 : 0.05), borderColor: 'rgba(20,24,31,.05)' }}
      />
      <div className="absolute left-4 top-0 flex h-full w-[152px] items-center gap-2.5">
        <span className="h-[34px] w-1 flex-none rounded-sm" style={{ background: data.color }} />
        <span className="flex flex-col gap-px">
          <span className="text-[12px] font-bold text-ink">{data.name}</span>
          <span className="font-mono text-[10.5px] text-faint">{data.sub}</span>
        </span>
      </div>
    </div>
  )
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
