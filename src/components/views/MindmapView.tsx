import { useMemo, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useStore,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react'
import { Plus } from 'lucide-react'
import MindRootNode from '@/components/nodes/MindRootNode'
import MindModuleNode from '@/components/nodes/MindModuleNode'
import MindFeatureNode from '@/components/nodes/MindFeatureNode'
import ZoomControl from '@/components/shell/ZoomControl'
import ViewHint from '@/components/views/ViewHint'
import { useWorkspace } from '@/store/useWorkspace'
import { useActivity } from '@/store/useActivity'
import { moduleProgress, moduleMatchesRole } from '@/store/selectors'
import { computeMindmapLayout } from '@/lib/layout'
import type { Selection } from '@/store/types'

const nodeTypes = { mindRoot: MindRootNode, mindModule: MindModuleNode, mindFeature: MindFeatureNode }

function MindmapInner() {
  const data = useWorkspace((s) => s.currentData())
  const hoveredId = useWorkspace((s) => s.hoveredId)
  const selected = useWorkspace((s) => s.selected)
  const roleFilter = useWorkspace((s) => s.roleFilter)
  const setHovered = useWorkspace((s) => s.setHovered)
  const select = useWorkspace((s) => s.select)
  const addModule = useWorkspace((s) => s.addModule)
  const readOnly = useWorkspace((s) => s.isReadOnly())
  const present = useWorkspace((s) => s.present)

  const zoom = useStore((s) => s.transform[2])
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  // Which modules are expanded to reveal their features. Collapsed by default so
  // large projects fit; the map height tracks visible rows, not total features.
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const actItems = useActivity((s) => s.items)
  const actSeen = useActivity((s) => s.lastSeenTs)
  const recent = useMemo(
    () => new Set(actItems.filter((i) => i.ts > actSeen && i.targetId).map((i) => i.targetId!)),
    [actItems, actSeen],
  )

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

  const layout = useMemo(() => computeMindmapLayout(data.modules, data.features, expanded), [data, expanded])
  const moduleById = useMemo(() => new Map(data.modules.map((m) => [m.id, m])), [data.modules])

  const nodes: Node[] = useMemo(() => {
    const list: Node[] = [
      {
        id: 'root',
        type: 'mindRoot',
        position: layout.root,
        data: { moduleCount: data.modules.length, featureCount: data.features.length },
        draggable: false,
        selectable: false,
      },
    ]

    data.modules.forEach((m) => {
      const prog = moduleProgress(m.id, data.features)
      const roleDim = !moduleMatchesRole(m, roleFilter)
      const focusDim = !!focus && !focusSet.has(m.id)
      list.push({
        id: m.id,
        type: 'mindModule',
        position: layout.modules[m.id],
        data: { id: m.id, name: m.name, color: m.color, ...prog, dim: roleDim || focusDim, highlight: focusSet.has(m.id), recent: recent.has(m.id), expanded: expanded.has(m.id) },
        draggable: false,
      })
    })

    data.features.forEach((f) => {
      if (!expanded.has(f.moduleId)) return // only expanded modules reveal features
      const m = moduleById.get(f.moduleId)
      if (!m) return // orphan feature (module missing) — skip rather than crash
      const roleDim = !moduleMatchesRole(m, roleFilter)
      const focusDim = !!focus && !focusSet.has(f.id)
      const isSelected = !!selected && selected.view === 'mindmap' && selected.id === f.id
      list.push({
        id: f.id,
        type: 'mindFeature',
        position: layout.features[f.id],
        data: { name: f.name, status: f.status, dim: roleDim || focusDim, selected: isSelected, recent: recent.has(f.id) },
        draggable: false,
      })
    })
    return list
  }, [data, layout, moduleById, roleFilter, focus, focusSet, expanded, selected, recent])

  const edges: Edge[] = useMemo(() => {
    const list: Edge[] = []
    data.modules.forEach((m) => {
      const on = focusSet.has(m.id)
      const left = layout.side[m.id] === 'left'
      list.push({
        id: `root-${m.id}`,
        source: 'root',
        target: m.id,
        sourceHandle: left ? 'left' : 'right',
        targetHandle: left ? 'in-right' : 'in-left',
        style: { stroke: on ? '#2f6fed' : '#c7cdd6', strokeWidth: on ? 2.4 : 1.6 },
      })
    })
    const moduleIds = new Set(data.modules.map((m) => m.id))
    data.features.forEach((f) => {
      if (!expanded.has(f.moduleId)) return // feature hidden while its module is collapsed
      if (!moduleIds.has(f.moduleId)) return // orphan feature — no edge to a missing module
      const on = focusSet.has(f.id)
      const left = layout.side[f.moduleId] === 'left'
      list.push({
        id: `${f.moduleId}-${f.id}`,
        source: f.moduleId,
        target: f.id,
        sourceHandle: left ? 'out-left' : 'out-right',
        targetHandle: left ? 'in-right' : 'in-left',
        style: { stroke: on ? '#2f6fed' : '#d6dbe2', strokeWidth: on ? 2.2 : 1.4 },
      })
    })
    return list
  }, [data, layout, focusSet, expanded])

  const onEnter: NodeMouseHandler = (_, node) => {
    if (node.id !== 'root') setHovered(node.id)
  }
  const onLeave: NodeMouseHandler = () => setHovered(null)
  const onClick: NodeMouseHandler = (_, node) => {
    if (node.type === 'mindFeature') select({ type: 'feature', id: node.id, view: 'mindmap' } as Selection)
    else if (node.type === 'mindModule') {
      toggleExpand(node.id)
      select({ type: 'module', id: node.id, view: 'mindmap' } as Selection)
    }
  }

  return (
    <>
      {!present && (
        <ViewHint>
          <b className="text-brand">Click a module</b> to expand its features · click a feature for details · status labels <b className="text-brand">sync across all views</b>
        </ViewHint>
      )}
      {!readOnly && !present && (
        <button
          onClick={() => addModule()}
          className="absolute left-[18px] top-[18px] z-20 flex h-9 items-center gap-1.5 rounded-[10px] border border-line bg-white px-3 text-[12.5px] font-bold text-brand shadow-card hover:bg-[#eef1ff]"
        >
          <Plus size={15} strokeWidth={2.5} /> Module
        </button>
      )}
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
        minZoom={0.15}
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
