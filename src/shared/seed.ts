import type { Release, SwimLane, SwimNode, WorkspaceData } from './types'

/** Deep clone so a new project never shares mutable arrays with the templates. */
export function cloneData(d: WorkspaceData): WorkspaceData {
  return typeof structuredClone === 'function'
    ? structuredClone(d)
    : (JSON.parse(JSON.stringify(d)) as WorkspaceData)
}

const standardReleases: Release[] = [
  { id: 'mvp', name: 'MVP', tag: 'Minimum viable', color: '#16a34a', bg: '#eaf6ef', bdr: '#cdecd9' },
  { id: 'r1', name: 'Release 1', tag: 'Q3 · 2026', color: '#2f6fed', bg: '#eaf1fe', bdr: '#cfe0fb' },
  { id: 'r2', name: 'Release 2', tag: 'Q4 · 2026', color: '#7c5cff', bg: '#efeaff', bdr: '#ddd2fb' },
]

const standardLanes: SwimLane[] = [
  { id: 0, name: 'User / PM / PO', sub: 'End users', color: '#6e8bff', owners: ['PM', 'PO'], y: 40, h: 104 },
  { id: 1, name: 'Frontend Interface', sub: 'UI', color: '#2f6fed', owners: ['Dev', 'Tester'], y: 144, h: 150 },
  { id: 2, name: 'Backend & Database', sub: 'Process · storage', color: '#0d9488', owners: ['Dev', 'BA', 'Tester'], y: 294, h: 176 },
  { id: 3, name: 'Notification Engine', sub: 'Alerts', color: '#f59e0b', owners: ['Dev'], y: 470, h: 104 },
]

const sampleSwimNodes: SwimNode[] = ([
  { id: 'A', label: 'Start: drag card → Done', lane: 0, kind: 'start', status: 'done', x: 176, y: 69, owner: 'Alex P', ownerInit: 'AP', ownerColor: '#6e8bff', desc: 'The user drags a Task card from In Progress to Done on the Story Map.' },
  { id: 'B', label: 'Capture drag-and-drop action', lane: 1, kind: 'process', status: 'done', x: 392, y: 190, owner: 'FE Team', ownerInit: 'FE', ownerColor: '#2f6fed', desc: 'Frontend captures the drag-drop event and optimistically updates the UI.' },
  { id: 'C', label: 'Send status update API', lane: 1, kind: 'process', status: 'done', x: 588, y: 190, owner: 'FE Team', ownerInit: 'FE', ownerColor: '#2f6fed', constraints: ['PATCH /tasks/:id { status }', 'Debounce 200ms for rapid actions.'] },
  { id: 'D', label: 'Receive update request', lane: 2, kind: 'process', status: 'done', x: 588, y: 353, owner: 'BE Team', ownerInit: 'BE', ownerColor: '#0d9488' },
  {
    id: 'E', label: 'Card linked to a Workflow?', lane: 2, kind: 'decision', status: 'done', x: 790, y: 349,
    owner: 'BE Team', ownerInit: 'BE', ownerColor: '#0d9488',
    desc: 'Check whether the card belongs to a Workflow (swimlane) to decide if the impact zone must be computed.',
    constraints: ['Look up the workflow_links table.', 'If linked → compute impact; otherwise update directly.'],
    crossLinks: [{ view: 'mindmap', label: 'Mindmap · Automatic impact calculation', targetId: 'f6' }],
  },
  { id: 'F', label: 'Update related nodes', lane: 2, kind: 'process', status: 'progress', x: 1014, y: 318, owner: 'BE Team', ownerInit: 'BE', ownerColor: '#0d9488', desc: 'Propagate the change to linked workflow nodes (impact propagation).' },
  { id: 'G', label: 'Update card status → DB', lane: 2, kind: 'process', status: 'done', x: 1014, y: 402, owner: 'BE Team', ownerInit: 'BE', ownerColor: '#0d9488' },
  { id: 'H', label: 'Create Impact Warning', lane: 3, kind: 'process', status: 'progress', x: 1014, y: 493, owner: 'Notif', ownerInit: 'NT', ownerColor: '#f59e0b', desc: 'Generate an impact warning and tag BA/PO for review.' },
  { id: 'I', label: 'Show impact alert', lane: 1, kind: 'process', status: 'todo', x: 1240, y: 190, owner: 'FE Team', ownerInit: 'FE', ownerColor: '#2f6fed' },
  {
    id: 'J', label: 'Update UI → Done & save', lane: 1, kind: 'process', status: 'done', x: 1454, y: 190,
    owner: 'FE Team', ownerInit: 'FE', ownerColor: '#2f6fed',
    desc: 'Reflect the Done status across every view via SSOT and persist it.',
    validations: ['Status must be synced to Mindmap + Story Map before closing.'],
    crossLinks: [{ view: 'mindmap', label: 'Mindmap · Real-time sync with workflow', targetId: 'f8' }],
    // cm:why codeStale is seeded true so a fresh sample board demonstrates the live
    // 'outdated' alert path without waiting for a real VCS webhook.
    codeRefs: [{ path: 'src/shared/board.ts' }],
    codeStale: true,
  },
  { id: 'K', label: 'End', lane: 0, kind: 'end', status: 'done', x: 1670, y: 69 },
] as SwimNode[]).map((n) => ({ ...n, code: n.id }))

/** Demo data ported from the KineTrak design prototype — the "Sample" template. */
export const sampleTemplate: WorkspaceData = {
  modules: [
    { id: 'm1', name: 'Feature Mapping & Mindmap', color: '#2f6fed', backbone: { name: 'Define Scope', sub: 'Scope & features' }, owners: ['BA', 'PO'] },
    { id: 'm2', name: 'Workflow & Swimlane Diagram', color: '#0d9488', backbone: { name: 'Design Workflows', sub: 'Logic & swimlane' }, owners: ['BA', 'Dev'] },
    { id: 'm3', name: 'Execution & Story Mapping', color: '#7c5cff', backbone: { name: 'Build & Sync', sub: 'Build & sync' }, owners: ['PM', 'PO'] },
    { id: 'm4', name: 'Collaboration & Access', color: '#f59e0b', backbone: { name: 'Collaborate & Release', sub: 'Collaborate & release' }, owners: ['PM', 'PO', 'BA', 'Dev', 'Tester'] },
  ],
  releases: standardReleases,
  features: [
    { id: 'f1', moduleId: 'm1', name: 'Node customization', status: 'done', releaseId: 'mvp' },
    { id: 'f2', moduleId: 'm1', name: 'Drag-and-drop builder', status: 'progress', releaseId: 'r1' },
    { id: 'f3', moduleId: 'm1', name: 'Role-based filters', status: 'nice', releaseId: 'r2' },
    { id: 'f4', moduleId: 'm2', name: 'BPMN notation', status: 'done', releaseId: 'mvp' },
    { id: 'f5', moduleId: 'm2', name: 'Multi-lane layout', status: 'done', releaseId: 'mvp' },
    {
      id: 'f6', moduleId: 'm2', name: 'Automatic impact calculation', status: 'progress', releaseId: 'r1',
      desc: 'Automatically computes the impact zone when a card/node changes: propagates along Workflow links and highlights affected lanes. This is the core of Impact Highlighting.',
      constraints: ['BFS over workflow_links.', 'Alert threshold configurable per project.'],
      validations: ['BFS over workflow links', 'Alert threshold configurable per project', 'UI highlights the impact zone'],
      validationsDone: ['BFS over workflow links'],
      crossLinks: [
        { view: 'swimlane', label: 'Swimlane · E · Link decision', targetId: 'E' },
        { view: 'story', label: 'Story Map · Impact engine' },
      ],
      codeRefs: [{ path: 'src/lib/impact.ts', symbol: 'computeImpact' }],
    },
    { id: 'f7', moduleId: 'm3', name: 'Dynamic release lanes', status: 'progress', releaseId: 'r1' },
    {
      id: 'f8', moduleId: 'm3', name: 'Real-time sync with workflow', status: 'must', releaseId: 'mvp',
      desc: 'Real-time sync between Story Map and Swimlane: a status change in one view reflects instantly in the others via SSOT.',
      constraints: ['WebSocket channel per project.', 'Reconcile on reconnect.'],
      crossLinks: [{ view: 'swimlane', label: 'Swimlane · J · Update & save', targetId: 'J' }],
    },
    { id: 'f9', moduleId: 'm3', name: 'Color-coded task cards', status: 'done', releaseId: 'r2' },
    { id: 'f10', moduleId: 'm4', name: 'Comment threads', status: 'nice', releaseId: 'r1' },
    { id: 'f11', moduleId: 'm4', name: 'Live presentation mode', status: 'nice', releaseId: 'r2' },
    { id: 'f12', moduleId: 'm4', name: 'Role-based view settings', status: 'progress', releaseId: 'r2' },
  ],
  lanes: standardLanes,
  swimNodes: sampleSwimNodes,
  swimEdges: [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'C', to: 'D' },
    { from: 'D', to: 'E' },
    { from: 'E', to: 'F', branch: 'Yes' },
    { from: 'E', to: 'G', branch: 'No' },
    { from: 'F', to: 'H' },
    { from: 'H', to: 'I' },
    { from: 'I', to: 'J' },
    { from: 'G', to: 'J' },
    { from: 'J', to: 'K' },
  ],
  // cm:why empty by design: impact/outdated/dod are derived in src/lib/impact and never read from
  // here; only stored 'question' decisions and 'friction' tooling reports belong in this array.
  alerts: [],
  settings: { impactThreshold: 3 },
}

/** Empty project scaffold: standard lanes + releases, no modules/features/nodes yet. */
export function blankTemplate(): WorkspaceData {
  return cloneData({
    modules: [],
    features: [],
    releases: standardReleases,
    lanes: standardLanes,
    swimNodes: [],
    swimEdges: [],
    alerts: [],
    settings: { impactThreshold: 3 },
  })
}

/** Fresh copy of a template for a new project. */
export function templateData(template: 'sample' | 'blank'): WorkspaceData {
  return template === 'blank' ? blankTemplate() : cloneData(sampleTemplate)
}
