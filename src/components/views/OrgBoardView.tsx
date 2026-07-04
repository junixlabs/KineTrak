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
import { ArrowLeft, Boxes, Globe, Plus, Trash2, ExternalLink, Anchor, Play, Share2, X } from 'lucide-react'
import OrgSystemNode from '@/components/nodes/OrgSystemNode'
import ZoomControl from '@/components/shell/ZoomControl'
import ViewHint from './ViewHint'
import { useWorkspace } from '@/store/useWorkspace'
import { useToast } from '@/store/useToast'
import { authFetch } from '@/store/api'
import type { OrgBoardEdgeKind, OrgBoardSel } from '@/store/types'

const nodeTypes = { orgSystem: OrgSystemNode }

const EDGE_KIND_COLOR: Record<OrgBoardEdgeKind, string> = {
  api: '#2f6fed',
  event: '#7c5cff',
  data: '#0d9488',
  other: '#5b6470',
}
const EDGE_KINDS: OrgBoardEdgeKind[] = ['api', 'event', 'data', 'other']

type Sel = OrgBoardSel | null

function OrgBoardInner() {
  const board = useWorkspace((s) => s.activeOrgBoard())
  const orgs = useWorkspace((s) => s.orgs)
  const projects = useWorkspace((s) => s.projects)
  const shareMode = useWorkspace((s) => s.shareMode)
  const present = useWorkspace((s) => s.present)
  const setPresent = useWorkspace((s) => s.setPresent)
  const syncStatus = useWorkspace((s) => s.syncStatus)
  const showToast = useToast((s) => s.show)
  const goHome = useWorkspace((s) => s.goHome)
  const openProject = useWorkspace((s) => s.openProject)
  const selectEntity = useWorkspace((s) => s.select)
  const consumeOrgBoardSel = useWorkspace((s) => s.consumeOrgBoardSel)
  const renameOrgBoard = useWorkspace((s) => s.renameOrgBoard)
  const addOrgBoardNode = useWorkspace((s) => s.addOrgBoardNode)
  const updateOrgBoardNode = useWorkspace((s) => s.updateOrgBoardNode)
  const deleteOrgBoardNode = useWorkspace((s) => s.deleteOrgBoardNode)
  const addOrgBoardEdge = useWorkspace((s) => s.addOrgBoardEdge)
  const updateOrgBoardEdge = useWorkspace((s) => s.updateOrgBoardEdge)
  const deleteOrgBoardEdge = useWorkspace((s) => s.deleteOrgBoardEdge)

  const editable = !shareMode && !present
  const [sel, setSel] = useState<Sel>(null)
  const [addMenu, setAddMenu] = useState(false)
  const [nameEdit, setNameEdit] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(null)

  // Esc leaves present mode (mirrors PresentMode's behavior).
  useEffect(() => {
    if (!present) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPresent(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [present, setPresent])

  const zoom = useStore((s) => s.transform[2])
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  // The open board disappeared (deleted elsewhere / stale persisted screen).
  useEffect(() => {
    if (!board) goHome()
  }, [board, goHome])

  // Deep-link selection (alert action / feature panel) — consumed once on mount.
  useEffect(() => {
    const s0 = consumeOrgBoardSel()
    if (s0) setSel(s0)
  }, [consumeOrgBoardSel])

  const org = orgs.find((o) => o.id === board?.orgId)
  const projById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])
  const onBoard = new Set((board?.nodes ?? []).map((n) => n.projectId).filter(Boolean))
  const addable = projects.filter((p) => p.orgId === board?.orgId && !onBoard.has(p.id))

  const computedNodes: Node[] = useMemo(
    () =>
      (board?.nodes ?? []).map((n) => {
        const proj = n.projectId ? projById.get(n.projectId) : undefined
        return {
          id: n.id,
          type: 'orgSystem',
          position: { x: n.x, y: n.y },
          data: {
            label: proj?.name ?? n.label,
            projectName: proj?.name,
            meta: proj ? `${proj.data.modules.length} modules · ${proj.data.features.length} features` : undefined,
            external: !proj,
            focused: sel?.type === 'node' && sel.id === n.id,
            editable,
          },
        }
      }),
    [board?.nodes, projById, sel, editable],
  )

  const edges: Edge[] = useMemo(
    () =>
      (board?.edges ?? []).map((e) => {
        const focused = sel?.type === 'edge' && sel.from === e.from && sel.to === e.to
        // Stale contract overrides the kind color — amber demands attention.
        const stroke = e.codeStale ? '#f59e0b' : focused ? '#2f6fed' : EDGE_KIND_COLOR[e.kind ?? 'other'] + (focused ? '' : 'aa')
        return {
          id: `${e.from}-${e.to}`,
          source: e.from,
          target: e.to,
          label: e.codeStale ? `⚠ ${e.label ?? ''}`.trim() : e.label,
          animated: focused,
          style: { stroke, strokeWidth: focused ? 2.4 : 1.6 },
          labelStyle: { fontSize: 11, fontWeight: 700, fill: '#14181f' },
          labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
          markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 16, height: 16 },
        }
      }),
    [board?.edges, sel],
  )

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([])
  useEffect(() => {
    setRfNodes((prev) => {
      const byId = new Map(prev.map((n) => [n.id, n]))
      return computedNodes.map((cn) => {
        const old = byId.get(cn.id)
        return old ? { ...old, ...cn } : cn
      })
    })
  }, [computedNodes, setRfNodes])

  // Keyboard delete for the current selection (ignoring panel inputs).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      if (!editable) return
      setSel((cur) => {
        if (cur?.type === 'node') deleteOrgBoardNode(cur.id)
        else if (cur?.type === 'edge') deleteOrgBoardEdge(cur.from, cur.to)
        return null
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editable, deleteOrgBoardNode, deleteOrgBoardEdge])

  if (!board) return null

  const selNode = sel?.type === 'node' ? board.nodes.find((n) => n.id === sel.id) : undefined
  const selEdge = sel?.type === 'edge' ? board.edges.find((e) => e.from === sel.from && e.to === sel.to) : undefined
  const selProject = selNode?.projectId ? projById.get(selNode.projectId) : undefined

  const onNodeClick: NodeMouseHandler = (_, node) => setSel({ type: 'node', id: node.id })
  const onEdgeClick = (_: unknown, edge: Edge) => setSel({ type: 'edge', from: edge.source, to: edge.target })
  const onConnect = (c: Connection) => {
    if (editable && c.source && c.target) addOrgBoardEdge(c.source, c.target)
  }
  const onNodeDragStop = (_e: unknown, node: Node) => {
    if (editable) updateOrgBoardNode(node.id, { x: Math.round(node.position.x), y: Math.round(node.position.y) })
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Slim board header — this screen sits outside the project workspace. */}
      <header className="flex h-14 flex-none items-center gap-3 border-b border-line bg-white px-4">
        {!shareMode && !present && (
          <button onClick={goHome} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted hover:bg-[#f4f6f9]" title="Back to Home">
            <ArrowLeft size={16} />
          </button>
        )}
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-gradient-to-br from-brand to-brand-light">
          <Boxes size={16} className="text-white" />
        </span>
        {nameEdit !== null ? (
          <input
            autoFocus
            value={nameEdit}
            onChange={(e) => setNameEdit(e.target.value)}
            onBlur={() => {
              if (nameEdit.trim()) renameOrgBoard(board.id, nameEdit.trim())
              setNameEdit(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') setNameEdit(null)
            }}
            className="h-8 rounded-md border border-brand px-2 text-[14px] font-bold outline-none"
          />
        ) : (
          <button onClick={() => editable && setNameEdit(board.name)} className="text-[15px] font-extrabold tracking-tight text-ink" title={editable ? 'Rename board' : undefined}>
            {board.name}
          </button>
        )}
        <span className="rounded-md bg-[#eef1ff] px-2 py-0.5 text-[11px] font-bold text-brand">System map</span>
        <span className="text-[12px] text-faint">{org?.name}</span>
        {shareMode && <span className="rounded-md bg-[#f4f6f9] px-2 py-0.5 text-[11px] font-bold text-muted">Shared · read-only</span>}
        <div className="flex-1" />
        {present ? (
          <button
            onClick={() => setPresent(false)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12.5px] font-bold text-ink hover:bg-[#f4f6f9]"
          >
            <X size={14} /> Exit · Esc
          </button>
        ) : (
          !shareMode && (
            <>
              <div className="relative">
                <button
                  onClick={() => {
                    if (syncStatus !== 'live') return showToast('Share links need a KineTrak server (local-only mode)')
                    setShareOpen((v) => !v)
                    if (!shareOpen)
                      void authFetch(`/api/org-boards/${board.id}/share`).then(async (r) => {
                        if (r.ok) setShareToken((await r.json()).token ?? null)
                      })
                  }}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12.5px] font-bold text-ink hover:bg-[#f4f6f9]"
                >
                  <Share2 size={14} /> Share
                </button>
                {shareOpen && (
                  <>
                    <div className="fixed inset-0 z-[55]" onClick={() => setShareOpen(false)} />
                    <div className="absolute right-0 top-11 z-[60] w-[300px] animate-pop rounded-xl border border-line bg-white p-3 shadow-pop">
                      <div className="mb-2 text-[12px] font-bold text-ink">Public read-only link</div>
                      {shareToken ? (
                        <>
                          <button
                            onClick={async () => {
                              await navigator.clipboard.writeText(`${window.location.origin}/map/${shareToken}`)
                              showToast('Map link copied')
                              setShareOpen(false)
                            }}
                            className="mb-1.5 h-8 w-full rounded-lg bg-brand px-3 text-[12px] font-bold text-white hover:bg-brand-dark"
                          >
                            Copy link
                          </button>
                          <button
                            onClick={async () => {
                              const r = await authFetch(`/api/org-boards/${board.id}/share`, { method: 'DELETE' })
                              if (r.ok) {
                                setShareToken(null)
                                showToast('Link revoked')
                              }
                            }}
                            className="h-8 w-full rounded-lg border border-line px-3 text-[12px] font-bold text-[#e5484d] hover:bg-[#fdecec]"
                          >
                            Revoke link
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={async () => {
                            const r = await authFetch(`/api/org-boards/${board.id}/share`, { method: 'POST' })
                            if (r.ok) setShareToken((await r.json()).token ?? null)
                          }}
                          className="h-8 w-full rounded-lg bg-brand px-3 text-[12px] font-bold text-white hover:bg-brand-dark"
                        >
                          Create link
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setPresent(true)}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12.5px] font-bold text-ink hover:bg-[#f4f6f9]"
              >
                <Play size={14} /> Present
              </button>
            </>
          )
        )}
      </header>

      <main className="kt-canvas relative flex-1 overflow-hidden">
        {!present && !shareMode && (
          <ViewHint>
            Each card is a <b className="text-brand">project</b> (or external system) · connect the blue dots to draw an <b className="text-brand">integration</b> · click an arrow to edit its contract
          </ViewHint>
        )}

        {editable && (
          <div className="absolute left-[18px] top-[18px] z-20">
            <button
              onClick={() => setAddMenu((v) => !v)}
              className="flex h-9 items-center gap-1.5 rounded-[10px] border border-line bg-white px-3 text-[12.5px] font-bold text-brand shadow-card hover:bg-[#eef1ff]"
            >
              <Plus size={15} strokeWidth={2.5} /> System
            </button>
            {addMenu && (
              <>
                <div className="fixed inset-0 z-[1]" onClick={() => setAddMenu(false)} />
                <div className="absolute left-0 top-[42px] z-[2] w-[260px] animate-pop rounded-xl border border-line bg-white p-1.5 shadow-pop">
                  {addable.length > 0 && <div className="px-2.5 pb-1 pt-1.5 text-[10.5px] font-bold tracking-wide text-faint">ADD PROJECT</div>}
                  {addable.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        addOrgBoardNode(p.name, p.id)
                        setAddMenu(false)
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-semibold text-ink hover:bg-[#f4f6f9]"
                    >
                      <Boxes size={14} className="flex-none text-brand" />
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                  <div className="px-2.5 pb-1 pt-1.5 text-[10.5px] font-bold tracking-wide text-faint">OTHER</div>
                  <button
                    onClick={() => {
                      addOrgBoardNode('External system')
                      setAddMenu(false)
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-semibold text-ink hover:bg-[#f4f6f9]"
                  >
                    <Globe size={14} className="flex-none text-muted" /> External system…
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <ReactFlow
          nodes={rfNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onNodeDragStop={onNodeDragStop}
          onConnect={onConnect}
          onPaneClick={() => setSel(null)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
          nodesConnectable={editable}
          nodesDraggable={editable}
          elementsSelectable
          className="!bg-transparent"
        />
        <ZoomControl zoomPercent={Math.round(zoom * 100)} onMinus={() => zoomOut()} onPlus={() => zoomIn()} onFit={() => fitView({ padding: 0.2 })} />

        {/* Context-in-card detail panel */}
        {(selNode || selEdge) && (
          <aside className="absolute right-[18px] top-[18px] z-20 w-[300px] animate-pop rounded-xl border border-line bg-white p-4 shadow-pop">
            {selNode && (
              <>
                <div className="mb-1 text-[10.5px] font-bold tracking-wide text-faint">{selProject ? 'PROJECT' : 'EXTERNAL SYSTEM'}</div>
                <input
                  value={selProject?.name ?? selNode.label}
                  disabled={!editable || !!selProject}
                  onChange={(e) => updateOrgBoardNode(selNode.id, { label: e.target.value })}
                  className="mb-2 w-full rounded-md border border-line px-2 py-1.5 text-[13.5px] font-bold outline-none focus:border-brand disabled:bg-[#f8f9fb]"
                />
                <textarea
                  value={selNode.desc ?? ''}
                  disabled={!editable}
                  onChange={(e) => updateOrgBoardNode(selNode.id, { desc: e.target.value })}
                  placeholder="Notes (responsibility, owner, links…)"
                  rows={3}
                  className="mb-3 w-full resize-none rounded-md border border-line px-2 py-1.5 text-[12px] outline-none focus:border-brand"
                />
                <div className="flex gap-2">
                  {selProject && (
                    <button
                      onClick={() => openProject(selProject.id)}
                      className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 text-[12px] font-bold text-white hover:bg-brand-dark"
                    >
                      <ExternalLink size={13} /> Open project
                    </button>
                  )}
                  {editable && (
                    <button
                      onClick={() => {
                        deleteOrgBoardNode(selNode.id)
                        setSel(null)
                      }}
                      className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-line px-3 text-[12px] font-bold text-[#e5484d] hover:bg-[#fdecec]"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  )}
                </div>
              </>
            )}
            {selEdge && (
              <>
                <div className="mb-1 text-[10.5px] font-bold tracking-wide text-faint">INTEGRATION</div>
                {selEdge.codeStale && (
                  <div className="mb-2 rounded-lg border border-[#f5d99a] bg-[#fef6e7] px-2.5 py-2">
                    <div className="text-[11px] leading-[1.45] text-[#8a5a00]">
                      Linked code changed after this contract was last updated — re-check the contract, then resolve.
                    </div>
                    {editable && (
                      <button
                        onClick={() => updateOrgBoardEdge(selEdge.from, selEdge.to, { codeStale: false })}
                        className="mt-1.5 h-6 rounded-md border border-[#f5d99a] bg-white px-2 text-[11px] font-bold text-[#8a5a00] hover:bg-[#fdf1dc]"
                      >
                        Mark reconciled
                      </button>
                    )}
                  </div>
                )}
                <input
                  value={selEdge.label ?? ''}
                  disabled={!editable}
                  onChange={(e) => updateOrgBoardEdge(selEdge.from, selEdge.to, { label: e.target.value })}
                  placeholder="Label (e.g. Create order)"
                  className="mb-2 w-full rounded-md border border-line px-2 py-1.5 text-[13px] font-bold outline-none focus:border-brand"
                />
                <div className="mb-2 flex gap-1.5">
                  {EDGE_KINDS.map((k) => (
                    <button
                      key={k}
                      disabled={!editable}
                      onClick={() => updateOrgBoardEdge(selEdge.from, selEdge.to, { kind: k })}
                      className="flex-1 rounded-md border px-1.5 py-1 text-[11px] font-bold uppercase"
                      style={{
                        borderColor: (selEdge.kind ?? 'other') === k ? EDGE_KIND_COLOR[k] : '#e5e8ec',
                        color: EDGE_KIND_COLOR[k],
                        background: (selEdge.kind ?? 'other') === k ? EDGE_KIND_COLOR[k] + '14' : 'transparent',
                      }}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <textarea
                  value={selEdge.desc ?? ''}
                  disabled={!editable}
                  onChange={(e) => updateOrgBoardEdge(selEdge.from, selEdge.to, { desc: e.target.value })}
                  placeholder="Contract: endpoints, events, payloads…"
                  rows={4}
                  className="mb-3 w-full resize-none rounded-md border border-line px-2 py-1.5 text-[12px] outline-none focus:border-brand"
                />
                {/* Feature anchors — the joint that lets impact & drift reason across projects. */}
                {(
                  [
                    { side: 'PROVIDER', nodeId: selEdge.from, value: selEdge.fromFeatureId, field: 'fromFeatureId' as const },
                    { side: 'CONSUMER', nodeId: selEdge.to, value: selEdge.toFeatureId, field: 'toFeatureId' as const },
                  ] as const
                ).map(({ side, nodeId, value, field }) => {
                  const node = board.nodes.find((n) => n.id === nodeId)
                  const proj = node?.projectId ? projById.get(node.projectId) : undefined
                  if (!proj) return null
                  const anchored = value ? proj.data.features.find((f) => f.id === value) : undefined
                  return (
                    <div key={field} className="mb-2">
                      <div className="mb-1 flex items-center gap-1 text-[10px] font-bold tracking-wide text-faint">
                        <Anchor size={10} /> {side} FEATURE · {proj.name}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={value ?? ''}
                          disabled={!editable}
                          onChange={(e) => updateOrgBoardEdge(selEdge.from, selEdge.to, { [field]: e.target.value })}
                          className="h-8 min-w-0 flex-1 rounded-md border border-line bg-white px-1.5 text-[12px] outline-none focus:border-brand"
                        >
                          <option value="">— not anchored —</option>
                          {proj.data.features.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                        {anchored && (
                          <button
                            title={`Open “${anchored.name}” in ${proj.name}`}
                            onClick={() => {
                              openProject(proj.id)
                              selectEntity({ type: 'feature', id: anchored.id, view: 'mindmap' })
                            }}
                            className="flex h-8 w-8 flex-none items-center justify-center rounded-md border border-line text-brand hover:bg-[#eef1ff]"
                          >
                            <ExternalLink size={13} />
                          </button>
                        )}
                      </div>
                      {value && !anchored && (
                        <div className="mt-1 text-[10.5px] font-semibold text-[#e5484d]">Anchored feature no longer exists — re-anchor or clear.</div>
                      )}
                    </div>
                  )
                })}
                {(selEdge.codeRefs?.length ?? 0) > 0 && (
                  <div className="mb-3">
                    <div className="mb-1 text-[10px] font-bold tracking-wide text-faint">CODE REFERENCES</div>
                    {selEdge.codeRefs!.map((r, i) => (
                      <div key={i} className="mb-1 truncate rounded-md border border-line bg-[#fbfcfd] px-2 py-1 font-mono text-[10.5px] text-muted">
                        {r.symbol ? `${r.path} · ${r.symbol}` : r.path}
                      </div>
                    ))}
                  </div>
                )}
                {editable && (
                  <button
                    onClick={() => {
                      deleteOrgBoardEdge(selEdge.from, selEdge.to)
                      setSel(null)
                    }}
                    className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-line px-3 text-[12px] font-bold text-[#e5484d] hover:bg-[#fdecec]"
                  >
                    <Trash2 size={13} /> Remove integration
                  </button>
                )}
              </>
            )}
          </aside>
        )}
      </main>
    </div>
  )
}

export default function OrgBoardView() {
  return (
    <ReactFlowProvider>
      <OrgBoardInner />
    </ReactFlowProvider>
  )
}
