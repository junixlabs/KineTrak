import { useEffect, useRef, useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import { ChevronRight } from 'lucide-react'
import StoryCard from './StoryCard'
import ViewHint from './ViewHint'
import ZoomControl from '@/components/shell/ZoomControl'
import { useWorkspace } from '@/store/useWorkspace'
import { releaseProgress, cellFeatures, moduleMatchesRole } from '@/store/selectors'

function ReleaseRow({
  releaseId,
  children,
}: {
  releaseId: string
  children: (isOver: boolean) => React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: releaseId })
  return (
    <div
      ref={setNodeRef}
      className="mb-3 grid items-stretch gap-3 rounded-xl transition-colors"
      style={{
        gridTemplateColumns: '148px repeat(4, minmax(0,1fr))',
        outline: isOver ? '2px dashed #2f6fed' : '2px dashed transparent',
        outlineOffset: 4,
        background: isOver ? 'rgba(47,111,237,.04)' : 'transparent',
      }}
    >
      {children(isOver)}
    </div>
  )
}

export default function StoryMapView() {
  const data = useWorkspace((s) => s.currentData())
  const selected = useWorkspace((s) => s.selected)
  const roleFilter = useWorkspace((s) => s.roleFilter)
  const readOnly = useWorkspace((s) => s.isReadOnly())
  const select = useWorkspace((s) => s.select)
  const moveFeatureToRelease = useWorkspace((s) => s.moveFeatureToRelease)
  const [scale, setScale] = useState(1)
  const clampScale = (v: number) => Math.min(1.4, Math.max(0.6, +v.toFixed(2)))

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const onDragEnd = (e: DragEndEvent) => {
    if (e.over && typeof e.active.id === 'string' && typeof e.over.id === 'string') {
      moveFeatureToRelease(e.active.id, e.over.id)
    }
  }

  // ── Grab-to-pan on empty canvas (skips cards / controls so it never fights DnD) ──
  const scrollRef = useRef<HTMLDivElement>(null)
  const pan = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const [grabbing, setGrabbing] = useState(false)

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('[data-pan-ignore], button, a')) return
    const el = scrollRef.current
    if (!el) return
    pan.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop }
    setGrabbing(true)
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      /* pointer may already be released (e.g. synthetic events) — panning still works */
    }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const el = scrollRef.current
    if (!pan.current || !el) return
    el.scrollLeft = pan.current.left - (e.clientX - pan.current.x)
    el.scrollTop = pan.current.top - (e.clientY - pan.current.y)
  }
  const endPan = (e: React.PointerEvent) => {
    if (!pan.current) return
    pan.current = null
    setGrabbing(false)
    try {
      scrollRef.current?.releasePointerCapture(e.pointerId)
    } catch {
      /* no-op */
    }
  }

  // Ctrl/⌘ + wheel = zoom (plain wheel still scrolls). Non-passive so preventDefault works.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      setScale((s) => clampScale(s - Math.sign(e.deltaY) * 0.1))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <div
      ref={scrollRef}
      className={`absolute inset-0 overflow-auto ${grabbing ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
    >
      <ViewHint>
        Trục ngang = hành trình · trục dọc = release · kéo thẻ đổi release · kéo nền để di chuyển ·{' '}
        <b className="text-brand">đồng bộ realtime</b>
      </ViewHint>

      <div
        className="min-w-[1000px] origin-top-left px-7 pb-11 pt-16 transition-transform"
        style={{ transform: `scale(${scale})` }}
      >
        {/* Backbone header */}
        <div className="mb-3.5 grid gap-3" style={{ gridTemplateColumns: '148px repeat(4, minmax(0,1fr))' }}>
          <div className="flex items-end px-1 pb-2 text-[10px] font-bold leading-[1.4] tracking-wide text-faint">
            RELEASE ↓<br />HÀNH TRÌNH →
          </div>
          {data.modules.map((m, i) => (
            <div key={m.id} className="relative rounded-[10px] border border-line bg-white p-[11px_13px]">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-md bg-[#eef1ff] font-mono text-[11px] font-bold text-[#3a4fc4]">
                  {i + 1}
                </span>
                <span className="text-[13px] font-bold text-ink">{m.backbone.name}</span>
              </div>
              <div className="mt-[5px] pl-7 text-[11px] text-faint">{m.backbone.sub}</div>
              {i < data.modules.length - 1 && (
                <div className="absolute -right-[19px] top-1/2 z-[2] -translate-y-1/2 rounded-full bg-app p-px">
                  <ChevronRight size={16} className="text-[#b6bdc8]" strokeWidth={2.4} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Release rows */}
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          {data.releases.map((r) => {
            const prog = releaseProgress(r.id, data.features)
            return (
              <ReleaseRow key={r.id} releaseId={r.id}>
                {() => (
                  <>
                    <div
                      className="flex flex-col gap-1.5 rounded-[10px] border p-3"
                      style={{ background: r.bg, borderColor: r.bdr }}
                    >
                      <span className="text-[13px] font-extrabold" style={{ color: r.color }}>
                        {r.name}
                      </span>
                      <span className="font-mono text-[10.5px] font-semibold text-muted">{r.tag}</span>
                      <div className="mt-auto">
                        <span className="text-[10px] font-bold text-muted">
                          {prog.done}/{prog.total} hoàn thành
                        </span>
                        <div className="mt-[5px] h-1 overflow-hidden rounded-sm bg-[rgba(20,24,31,.08)]">
                          <div
                            className="h-full rounded-sm transition-[width] duration-300"
                            style={{ width: `${prog.ratio}%`, background: r.color }}
                          />
                        </div>
                      </div>
                    </div>

                    {data.modules.map((m) => {
                      const cards = cellFeatures(m.id, r.id, data.features)
                      const dim = !moduleMatchesRole(m, roleFilter)
                      return (
                        <div key={m.id} className="flex flex-col gap-2">
                          {cards.map((f) => (
                            <StoryCard
                              key={f.id}
                              feature={f}
                              dim={dim}
                              disabled={readOnly}
                              selected={!!selected && selected.id === f.id}
                              onClick={() => select({ type: 'feature', id: f.id, view: 'story' })}
                            />
                          ))}
                          {cards.length === 0 && (
                            <div className="flex min-h-[56px] items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-[#dfe3e9] text-[18px] font-light text-[#c2c8d0]">
                              +
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </>
                )}
              </ReleaseRow>
            )
          })}
        </DndContext>
      </div>

      <ZoomControl
        zoomPercent={Math.round(scale * 100)}
        onMinus={() => setScale((s) => clampScale(s - 0.1))}
        onPlus={() => setScale((s) => clampScale(s + 0.1))}
        onFit={() => setScale(1)}
      />
    </div>
  )
}
