import { useMemo } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useStore,
  MarkerType,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react'
import SwimStepNode from '@/components/nodes/SwimStepNode'
import LaneBackground from '@/components/nodes/LaneBackground'
import ZoomControl from '@/components/shell/ZoomControl'
import ViewHint from './ViewHint'
import { useWorkspace } from '@/store/useWorkspace'
import { reachableFrom } from '@/lib/impact'
import { laneMatchesRole } from '@/store/selectors'

const nodeTypes = { swimStep: SwimStepNode, lane: LaneBackground }

const LANE_WIDTH = 1860
const COMPACT_ZOOM = 0.5

const NODE_SIZE: Record<string, { w: number; h: number }> = {
  start: { w: 178, h: 46 },
  end: { w: 150, h: 46 },
  decision: { w: 182, h: 66 },
  process: { w: 170, h: 58 },
}
const DEFAULT_NODE_SIZE = { w: 170, h: 58 }

function SwimlaneInner() {
  const data = useWorkspace((s) => s.currentData())
  const hoveredId = useWorkspace((s) => s.hoveredId)
  const selected = useWorkspace((s) => s.selected)
  const roleFilter = useWorkspace((s) => s.roleFilter)
  const setHovered = useWorkspace((s) => s.setHovered)
  const select = useWorkspace((s) => s.select)

  const zoom = useStore((s) => s.transform[2])
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const compact = zoom < COMPACT_ZOOM

  const focus = hoveredId || (selected && selected.view === 'swimlane' ? selected.id : null)
  const reach = useMemo(() => reachableFrom(focus, data.swimEdges), [focus, data.swimEdges])

  // Which lanes contain a reachable node (for dimming whole bands).
  const laneHit = useMemo(() => {
    const hit: Record<number, boolean> = {}
    if (focus) data.swimNodes.forEach((n) => { if (reach.has(n.id)) hit[n.lane] = true })
    return hit
  }, [focus, reach, data.swimNodes])

  const nodes: Node[] = useMemo(() => {
    const list: Node[] = []

    data.lanes.forEach((lane) => {
      const roleDim = !laneMatchesRole(lane, roleFilter)
      const focusDim = !!focus && !laneHit[lane.id]
      list.push({
        id: `lane-${lane.id}`,
        type: 'lane',
        position: { x: 0, y: lane.y },
        data: { name: lane.name, sub: lane.sub, color: lane.color, width: LANE_WIDTH, height: lane.h, dim: roleDim || focusDim },
        draggable: false,
        selectable: false,
        zIndex: 0,
      })
    })

    data.swimNodes.forEach((n) => {
      const lane = data.lanes.find((l) => l.id === n.lane)
      if (!lane) return // node references a missing lane — skip rather than crash
      const size = NODE_SIZE[n.kind] ?? DEFAULT_NODE_SIZE
      const roleDim = !laneMatchesRole(lane, roleFilter)
      const focusDim = !!focus && !reach.has(n.id)
      const isSelected = !!selected && selected.view === 'swimlane' && selected.id === n.id
      list.push({
        id: n.id,
        type: 'swimStep',
        position: { x: n.x, y: n.y },
        data: {
          nodeId: n.id,
          label: n.label,
          kind: n.kind,
          status: n.status,
          dim: roleDim || focusDim,
          focused: isSelected || (!!focus && n.id === focus),
          compact,
          width: size.w,
          height: size.h,
        },
        zIndex: 1,
      })
    })
    return list
  }, [data, roleFilter, focus, reach, laneHit, selected, compact])

  const edges: Edge[] = useMemo(() => {
    const laneIds = new Set(data.lanes.map((l) => l.id))
    const present = new Set(data.swimNodes.filter((n) => laneIds.has(n.lane)).map((n) => n.id))
    return data.swimEdges
      .filter((e) => present.has(e.from) && present.has(e.to))
      .map((e) => {
        const on = !!focus && reach.has(e.from) && reach.has(e.to)
        const dim = !!focus && !on
        const stroke = on ? '#2f6fed' : dim ? '#e3e6ea' : '#b6bdc8'
        return {
          id: `${e.from}-${e.to}`,
          source: e.from,
          target: e.to,
          label: e.branch,
          labelStyle: { fontSize: 11, fontWeight: 700, fill: '#5b6470' },
          labelBgStyle: { fill: '#eef1f5' },
          labelBgPadding: [6, 3] as [number, number],
          labelBgBorderRadius: 6,
          animated: on,
          style: { stroke, strokeWidth: on ? 2.4 : 1.6 },
          markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 16, height: 16 },
          zIndex: 1,
        }
      })
  }, [data.swimNodes, data.lanes, data.swimEdges, focus, reach])

  const onEnter: NodeMouseHandler = (_, node) => { if (node.type === 'swimStep') setHovered(node.id) }
  const onLeave: NodeMouseHandler = () => setHovered(null)
  const onClick: NodeMouseHandler = (_, node) => {
    if (node.type === 'swimStep') select({ type: 'swimnode', id: node.id, view: 'swimlane' })
  }

  return (
    <>
      <ViewHint>
        Rê chuột vào một bước để xem <b className="text-brand">vùng tác động</b> · bấm để mở chi tiết
      </ViewHint>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeMouseEnter={onEnter}
        onNodeMouseLeave={onLeave}
        onNodeClick={onClick}
        onPaneClick={() => select(null)}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        nodesDraggable={false}
        elementsSelectable
        className="!bg-transparent"
      />
      <ZoomControl
        zoomPercent={Math.round(zoom * 100)}
        onMinus={() => zoomOut()}
        onPlus={() => zoomIn()}
        onFit={() => fitView({ padding: 0.15 })}
      />
    </>
  )
}

export default function SwimlaneView() {
  return (
    <ReactFlowProvider>
      <SwimlaneInner />
    </ReactFlowProvider>
  )
}
