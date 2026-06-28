import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'
import { useWorkspace } from '@/store/useWorkspace'

/** Bezier edge with an inline branch label and a hover delete button. */
export default function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  label,
  data,
}: EdgeProps) {
  const deleteSwimEdge = useWorkspace((s) => s.deleteSwimEdge)
  const readOnly = useWorkspace((s) => s.isReadOnly())
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
  const d = data as { from?: string; to?: string } | undefined

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className="group/edge nodrag nopan absolute flex items-center gap-1"
          style={{ transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'all' }}
        >
          {label && (
            <span className="rounded-md bg-app px-1.5 py-0.5 text-[11px] font-bold text-muted">{label}</span>
          )}
          {!readOnly && d?.from && d?.to && (
            <button
              title="Delete arrow"
              onClick={() => deleteSwimEdge(d.from!, d.to!)}
              className="flex h-5 w-5 items-center justify-center rounded-full border border-line bg-white text-[12px] font-bold leading-none text-faint opacity-0 shadow-card transition-opacity hover:bg-[#fdecec] hover:text-[#e5484d] group-hover/edge:opacity-100"
            >
              ×
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
