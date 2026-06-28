import { useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useStore,
  useNodesState,
  MarkerType,
  type Connection,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react'
import { Plus } from 'lucide-react'
import SwimStepNode from '@/components/nodes/SwimStepNode'
import LaneBackground from '@/components/nodes/LaneBackground'
import DeletableEdge from '@/components/nodes/DeletableEdge'
import ZoomControl from '@/components/shell/ZoomControl'
import ViewHint from './ViewHint'
import { useWorkspace } from '@/store/useWorkspace'
import { reachableFrom } from '@/lib/impact'
import { laneMatchesRole } from '@/store/selectors'

const nodeTypes = { swimStep: SwimStepNode, lane: LaneBackground }
const edgeTypes = { deletable: DeletableEdge }

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
  const readOnly = useWorkspace((s) => s.isReadOnly())
  const setHovered = useWorkspace((s) => s.setHovered)
  const select = useWorkspace((s) => s.select)
  const addSwimNode = useWorkspace((s) => s.addSwimNode)
  const addSwimEdge = useWorkspace((s) => s.addSwimEdge)
  const deleteSwimNode = useWorkspace((s) => s.deleteSwimNode)
  const updateSwimNodePos = useWorkspace((s) => s.updateSwimNodePos)

  const zoom = useStore((s) => s.transform[2])
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const compact = zoom < COMPACT_ZOOM
  const [laneMenu, setLaneMenu] = useState(false)

  const focus = hoveredId || (selected && selected.view === 'swimlane' ? selected.id : null)
  const reach = useMemo(() => reachableFrom(focus, data.swimEdges), [focus, data.swimEdges])
  const laneHit = useMemo(() => {
    const hit: Record<number, boolean> = {}
    if (focus) data.swimNodes.forEach((n) => { if (reach.has(n.id)) hit[n.lane] = true })
    return hit
  }, [focus, reach, data.swimNodes])

  const computedNodes: Node[] = useMemo(() => {
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
      if (!lane) return
      const size = NODE_SIZE[n.kind] ?? DEFAULT_NODE_SIZE
      const roleDim = !laneMatchesRole(lane, roleFilter)
      const focusDim = !!focus && !reach.has(n.id)
      const isSelected = !!selected && selected.view === 'swimlane' && selected.id === n.id
      list.push({
        id: n.id,
        type: 'swimStep',
        position: { x: n.x, y: n.y },
        data: {
          nodeId: n.code ?? n.id,
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
          type: 'deletable',
          data: { from: e.from, to: e.to },
          label: e.branch,
          animated: on,
          style: { stroke, strokeWidth: on ? 2.4 : 1.6 },
          markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 16, height: 16 },
          zIndex: 1,
        }
      })
  }, [data.swimEdges, data.swimNodes, data.lanes, focus, reach])

  // React Flow needs node state for drag/connect interactions; re-seed it from the store.
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([])
  useEffect(() => setRfNodes(computedNodes), [computedNodes, setRfNodes])

  // Delete the selected node with the keyboard (ignoring panel inputs).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      const sel = useWorkspace.getState().selected
      if (useWorkspace.getState().activeView === 'swimlane' && sel?.type === 'swimnode' && !useWorkspace.getState().isReadOnly()) {
        deleteSwimNode(sel.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deleteSwimNode])

  const onEnter: NodeMouseHandler = (_, node) => { if (node.type === 'swimStep') setHovered(node.id) }
  const onLeave: NodeMouseHandler = () => setHovered(null)
  const onClick: NodeMouseHandler = (_, node) => {
    if (node.type === 'swimStep') select({ type: 'swimnode', id: node.id, view: 'swimlane' })
  }
  const onConnect = (c: Connection) => { if (c.source && c.target) addSwimEdge(c.source, c.target) }
  const onNodeDragStop = (_e: unknown, node: Node) => {
    if (node.type === 'swimStep') updateSwimNodePos(node.id, Math.round(node.position.x), Math.round(node.position.y))
  }

  return (
    <>
      <ViewHint>
        {readOnly ? (
          <>Read-only snapshot · hover to see <b className="text-brand">impact zone</b></>
        ) : (
          <>Hover a node to see <b className="text-brand">impact zone</b> · drag to arrange · connect the blue dots to draw arrows · Delete to remove</>
        )}
      </ViewHint>

      {!readOnly && (
        <div className="absolute left-[18px] top-[18px] z-20">
          <button
            onClick={() => setLaneMenu((v) => !v)}
            className="flex h-9 items-center gap-1.5 rounded-[10px] border border-line bg-white px-3 text-[12.5px] font-bold text-brand shadow-card hover:bg-[#eef1ff]"
          >
            <Plus size={15} strokeWidth={2.5} /> Step
          </button>
          {laneMenu && (
            <>
              <div className="fixed inset-0 z-[1]" onClick={() => setLaneMenu(false)} />
              <div className="absolute left-0 top-[42px] z-[2] w-[220px] animate-pop rounded-xl border border-line bg-white p-1.5 shadow-pop">
                <div className="px-2.5 pb-1 pt-1.5 text-[10.5px] font-bold tracking-wide text-faint">ADD STEP TO LANE</div>
                {data.lanes.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => { addSwimNode(l.id); setLaneMenu(false) }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-semibold text-ink hover:bg-[#f4f6f9]"
                  >
                    <span className="h-2.5 w-2.5 flex-none rounded-sm" style={{ background: l.color }} />
                    {l.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <ReactFlow
        nodes={rfNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeMouseEnter={onEnter}
        onNodeMouseLeave={onLeave}
        onNodeClick={onClick}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onPaneClick={() => select(null)}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={!readOnly}
        nodesDraggable={!readOnly}
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
