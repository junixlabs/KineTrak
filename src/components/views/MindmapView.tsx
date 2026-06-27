import { useMemo } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useStore,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react'
import MindRootNode from '@/components/nodes/MindRootNode'
import MindModuleNode from '@/components/nodes/MindModuleNode'
import MindFeatureNode from '@/components/nodes/MindFeatureNode'
import ZoomControl from '@/components/shell/ZoomControl'
import ViewHint from '@/components/views/ViewHint'
import { useWorkspace } from '@/store/useWorkspace'
import { moduleProgress, moduleMatchesRole } from '@/store/selectors'
import type { Selection } from '@/store/types'

const nodeTypes = { mindRoot: MindRootNode, mindModule: MindModuleNode, mindFeature: MindFeatureNode }

// Layout geometry (ported from the prototype).
const fc = (j: number) => 56 + j * 52
const mc = (i: number) => fc(3 * i + 1)
const ROOT_Y = (mc(0) + mc(1) + mc(2) + mc(3)) / 4 - 34

/** Below this zoom, collapse to modules-only (semantic zoom). */
const FEATURE_ZOOM = 0.55

function MindmapInner() {
  const data = useWorkspace((s) => s.currentData())
  const hoveredId = useWorkspace((s) => s.hoveredId)
  const selected = useWorkspace((s) => s.selected)
  const roleFilter = useWorkspace((s) => s.roleFilter)
  const setHovered = useWorkspace((s) => s.setHovered)
  const select = useWorkspace((s) => s.select)

  const zoom = useStore((s) => s.transform[2])
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const showFeatures = zoom >= FEATURE_ZOOM

  const focus = hoveredId || (selected && selected.view === 'mindmap' ? selected.id : null)

  const focusSet = useMemo(() => {
    const set = new Set<string>()
    if (!focus) return set
    const f = data.features.find((x) => x.id === focus)
    const m = data.modules.find((x) => x.id === focus)
    if (f) {
      set.add(f.id)
      set.add(f.moduleId)
    } else if (m) {
      set.add(m.id)
      data.features.filter((x) => x.moduleId === m.id).forEach((x) => set.add(x.id))
    }
    return set
  }, [focus, data])

  const nodes: Node[] = useMemo(() => {
    const list: Node[] = [
      {
        id: 'root',
        type: 'mindRoot',
        position: { x: 40, y: ROOT_Y },
        data: { moduleCount: data.modules.length, featureCount: data.features.length },
        draggable: false,
        selectable: false,
      },
    ]

    data.modules.forEach((m, i) => {
      const prog = moduleProgress(m.id, data.features)
      const roleDim = !moduleMatchesRole(m, roleFilter)
      const focusDim = !!focus && !focusSet.has(m.id)
      list.push({
        id: m.id,
        type: 'mindModule',
        position: { x: 292, y: mc(i) - 28 },
        data: { name: m.name, color: m.color, ...prog, dim: roleDim || focusDim, highlight: focusSet.has(m.id) },
        draggable: false,
      })
    })

    if (showFeatures) {
      data.features.forEach((f, j) => {
        const m = data.modules.find((x) => x.id === f.moduleId)!
        const roleDim = !moduleMatchesRole(m, roleFilter)
        const focusDim = !!focus && !focusSet.has(f.id)
        const isSelected = !!selected && selected.view === 'mindmap' && selected.id === f.id
        list.push({
          id: f.id,
          type: 'mindFeature',
          position: { x: 596, y: fc(j) - 22 },
          data: { name: f.name, status: f.status, dim: roleDim || focusDim, selected: isSelected },
          draggable: false,
        })
      })
    }
    return list
  }, [data, roleFilter, focus, focusSet, showFeatures, selected])

  const edges: Edge[] = useMemo(() => {
    const list: Edge[] = []
    data.modules.forEach((m) => {
      const on = focusSet.has(m.id)
      list.push({ id: `root-${m.id}`, source: 'root', target: m.id, style: { stroke: on ? '#2f6fed' : '#c7cdd6', strokeWidth: on ? 2.4 : 1.6 } })
    })
    if (showFeatures) {
      data.features.forEach((f) => {
        const on = focusSet.has(f.id)
        list.push({ id: `${f.moduleId}-${f.id}`, source: f.moduleId, target: f.id, style: { stroke: on ? '#2f6fed' : '#d6dbe2', strokeWidth: on ? 2.2 : 1.4 } })
      })
    }
    return list
  }, [data, focusSet, showFeatures])

  const onEnter: NodeMouseHandler = (_, node) => {
    if (node.id !== 'root') setHovered(node.id)
  }
  const onLeave: NodeMouseHandler = () => setHovered(null)
  const onClick: NodeMouseHandler = (_, node) => {
    if (node.type === 'mindFeature') select({ type: 'feature', id: node.id, view: 'mindmap' } as Selection)
    else if (node.type === 'mindModule') select({ type: 'module', id: node.id, view: 'mindmap' } as Selection)
  }

  return (
    <>
      <ViewHint>
        Bấm tính năng để mở chi tiết · nhãn trạng thái <b className="text-brand">đồng bộ mọi View</b>
        {!showFeatures && <> · <b className="text-brand">phóng to</b> để hiện tính năng</>}
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
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        edgesFocusable={false}
        className="!bg-transparent"
      />
      <ZoomControl
        zoomPercent={Math.round(zoom * 100)}
        onMinus={() => zoomOut()}
        onPlus={() => zoomIn()}
        onFit={() => fitView({ padding: 0.2 })}
      />
    </>
  )
}

export default function MindmapView() {
  return (
    <ReactFlowProvider>
      <MindmapInner />
    </ReactFlowProvider>
  )
}
