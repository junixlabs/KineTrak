import { useDraggable } from '@dnd-kit/core'
import { featureStatusMeta, featureStatusOrder } from '@/theme/tokens'
import { useWorkspace } from '@/store/useWorkspace'
import type { Feature } from '@/shared/types'

interface StoryCardProps {
  feature: Feature
  selected: boolean
  dim: boolean
  disabled: boolean
  onClick: () => void
}

export default function StoryCard({ feature, selected, dim, disabled, onClick }: StoryCardProps) {
  const meta = featureStatusMeta[feature.status]
  const setFeatureStatus = useWorkspace((s) => s.setFeatureStatus)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: feature.id, disabled })

  // One click on the status pill cycles status — the Dev/Tester daily loop, no panel needed.
  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    const i = featureStatusOrder.indexOf(feature.status)
    setFeatureStatus(feature.id, featureStatusOrder[(i + 1) % featureStatusOrder.length])
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className="flex cursor-pointer flex-col gap-2 rounded-[10px] border bg-white p-[10px_11px] transition-[box-shadow,border-color,transform] hover:-translate-y-px hover:shadow-[0_5px_16px_rgba(20,24,31,.13)]"
      style={{
        borderColor: selected ? '#2f6fed' : '#e5e8ec',
        borderLeft: `3px solid ${meta.color}`,
        boxShadow: selected
          ? '0 0 0 3px rgba(47,111,237,.14), 0 6px 16px rgba(47,111,237,.18)'
          : '0 1px 2px rgba(20,24,31,.06)',
        opacity: isDragging ? 0.4 : dim ? 0.35 : 1,
        touchAction: 'none',
      }}
    >
      <div className="flex items-start gap-[7px]">
        <span className="mt-1 h-2 w-2 flex-none rounded-full" style={{ background: meta.color }} />
        <span className="flex-1 text-[12.5px] font-bold leading-[1.25] text-ink">{feature.name}</span>
      </div>
      <button
        onClick={cycleStatus}
        onPointerDown={(e) => e.stopPropagation()}
        disabled={disabled}
        title={disabled ? meta.label : 'Click to change status'}
        className="self-start rounded-full px-2 py-0.5 text-[10px] font-bold transition-transform enabled:hover:scale-[1.06] enabled:cursor-pointer disabled:cursor-default"
        style={{ color: meta.color, background: meta.bg }}
      >
        {meta.label}
      </button>
    </div>
  )
}
