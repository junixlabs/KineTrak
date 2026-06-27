import { useDraggable } from '@dnd-kit/core'
import { featureStatusMeta } from '@/theme/tokens'
import type { Feature } from '@/store/types'

interface StoryCardProps {
  feature: Feature
  selected: boolean
  dim: boolean
  disabled: boolean
  onClick: () => void
}

export default function StoryCard({ feature, selected, dim, disabled, onClick }: StoryCardProps) {
  const meta = featureStatusMeta[feature.status]
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: feature.id, disabled })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      data-pan-ignore
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
      <span
        className="self-start rounded-full px-2 py-0.5 text-[10px] font-bold"
        style={{ color: meta.color, background: meta.bg }}
      >
        {meta.label}
      </span>
    </div>
  )
}
