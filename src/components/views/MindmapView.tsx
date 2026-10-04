import { useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useStore,
  type Edge,
  type Node,
  type NodeMouseHandler,
  MarkerType,
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
import { impactAnswer } from '@/lib/impact'
import type { Selection } from '@/store/types'

const nodeTypes = { mindRoot: MindRootNode, mindModule: MindModuleNode, mindFeature: MindFeatureNode }
/** Width of the detail panel (DetailPanel.tsx w-[384px]), which sits over the canvas's right edge. */
const PANEL = 384

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
  const impactFor = useWorkspace((s) => s.impactFor)

  const zoom = useStore((s) => s.transform[2])
  const { zoomIn, zoomOut, fitView, getNode, flowToScreenPosition, setCenter, getZoom } = useReactFlow()

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
  const selFeature = selected && selected.view === 'mindmap' && selected.type === 'feature' ? selected.id : null

  // the selected feature's declared dependencies, both ways — drawn only while it is selected (P-0003)
  const depEdges = useMemo(() => {
    if (!selFeature) return [] as { from: string; to: string }[]
    const out: { from: string; to: string }[] = []
    for (const f of data.features) for (const d of f.dependsOn ?? []) if (f.id === selFeature || d === selFeature) out.push({ from: f.id, to: d })
    return out
  }, [selFeature, data.features])
  // what the change touches, while its answer is open in the panel (P-0001)
  const touched = useMemo(() => {
    if (!impactFor || impactFor !== selFeature) return new Set<string>()
    const a = impactAnswer(data, impactFor)
    return new Set([...a.direct, ...a.indirect, ...a.viaWorkflow])
  }, [impactFor, selFeature, data])
  const related = useMemo(() => new Set([...depEdges.flatMap((e) => [e.from, e.to]), ...touched]), [depEdges, touched])
  // the same features as a stable key: an edit elsewhere on the board rebuilds the set, not the key
  const relatedKey = [...related].sort().join('|')
  // open the modules those features sit in, so the lines and outlines have something to land on
  useEffect(() => {
    if (!relatedKey) return
    const ids = new Set(relatedKey.split('|'))
    const mods = data.features.filter((f) => ids.has(f.id)).map((f) => f.moduleId)
    setExpanded((prev) => (mods.every((m) => prev.has(m)) ? prev : new Set([...prev, ...mods])))
  }, [relatedKey, data.features])
  // the panel opens beside the selected feature, never over it; with dependencies or an impact answer
  // shown, the feature and everything related are framed in the part of the canvas the panel leaves
  useEffect(() => {
    if (!selFeature) return
    const t = setTimeout(() => {
      if (relatedKey) {
        fitView({ nodes: [selFeature, ...relatedKey.split('|')].map((id) => ({ id })), padding: { top: '72px', bottom: '72px', left: '48px', right: `${PANEL + 48}px` }, maxZoom: 1.1, duration: 300 })
        return
      }
      const n = getNode(selFeature)
      const pane = document.querySelector('.kt-canvas')?.getBoundingClientRect()
      if (!n || !pane) return
      const w = n.measured?.width ?? 256, h = n.measured?.height ?? 46
      const right = flowToScreenPosition({ x: n.position.x + w, y: n.position.y }).x - pane.left
      if (right <= pane.width - PANEL - 24) return
      const z = getZoom()
      setCenter(n.position.x + w / 2 + PANEL / 2 / z, n.position.y + h / 2, { zoom: z, duration: 300 })
    }, 120)
    return () => clearTimeout(t)
  }, [selFeature, relatedKey, fitView, getNode, flowToScreenPosition, setCenter, getZoom])

  const focusSet = useMemo(() => {
    const set = new Set<string>()
    if (!focus) return set
    const f = data.features.find((x) => x.id === focus)
    const m = data.modules.find((x) => x.id === focus)
    if (f) {
      set.add(f.id)
      set.add(f.moduleId)
      for (const id of related) set.add(id)
      for (const id of related) { const x = data.features.find((y) => y.id === id); if (x) set.add(x.moduleId) }
    } else if (m) {
      set.add(m.id)
      data.features.filter((x) => x.moduleId === m.id).forEach((x) => set.add(x.id))
    }
    return set
  }, [focus, data, related])

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
        data: { id: f.id, name: f.name, status: f.status, dim: roleDim || focusDim, selected: isSelected, recent: recent.has(f.id), hit: touched.has(f.id) },
        draggable: false,
      })
    })
    return list
  }, [data, layout, moduleById, roleFilter, focus, focusSet, expanded, selected, recent, touched])

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
      // A sub-feature hangs off its parent feature, not the module.
      const source = layout.parent[f.id] ?? f.moduleId
      list.push({
        id: `${source}-${f.id}`,
        source,
        target: f.id,
        sourceHandle: left ? 'out-left' : 'out-right',
        targetHandle: left ? 'in-right' : 'in-left',
        style: { stroke: on ? '#2f6fed' : '#d6dbe2', strokeWidth: on ? 2.2 : 1.4 },
      })
    })
    // dependency lines of the selected feature: dashed purple, from the feature to what it depends on
    const shown = new Set(data.features.filter((f) => expanded.has(f.moduleId)).map((f) => f.id))
    const sideOf = (id: string) => layout.side[data.features.find((f) => f.id === id)?.moduleId ?? '']
    for (const e of depEdges) {
      if (!shown.has(e.from) || !shown.has(e.to)) continue
      list.push({
        id: `dep-${e.from}-${e.to}`,
        source: e.from,
        target: e.to,
        // each end on the side that faces the centre of the map, so the line does not loop round a node
        sourceHandle: sideOf(e.from) === 'left' ? 'out-right' : 'out-left',
        targetHandle: sideOf(e.to) === 'left' ? 'in-right' : 'in-left',
        // under the nodes, arrow at the feature depended on; the panel names both ends in words
        markerEnd: { type: MarkerType.ArrowClosed, color: '#7c5cff', width: 16, height: 16 },
        style: { stroke: '#7c5cff', strokeWidth: 2, strokeDasharray: '6 4' },
      })
    }
    return list
  }, [data, layout, focusSet, expanded, depEdges])

  const onEnter: NodeMouseHandler = (_, node) => {
    if (node.id !== 'root') setHovered(node.id)
  }
  const onLeave: NodeMouseHandler = () => setHovered(null)
  const onClick: NodeMouseHandler = (_, node) => {
    if (node.type === 'mindFeature') select({ type: 'feature', id: node.id, view: 'mindmap' } as Selection)
    else if (node.type === 'mindModule') {
      const opening = !expanded.has(node.id)
      toggleExpand(node.id)
      select({ type: 'module', id: node.id, view: 'mindmap' } as Selection)
      // the features it reveals land where they can be seen and clicked, beside the panel it opens
      if (opening) {
        const ids = [node.id, ...data.features.filter((f) => f.moduleId === node.id).map((f) => f.id)]
        setTimeout(() => fitView({ nodes: ids.map((id) => ({ id })), padding: { top: '72px', bottom: '72px', left: '48px', right: `${PANEL + 48}px` }, maxZoom: getZoom(), duration: 300 }), 80)
      }
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
