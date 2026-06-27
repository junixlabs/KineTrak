import type { WorkspaceData } from './types'

/**
 * Initial workspace data, ported from the KineTrak Workspace design prototype.
 * This is the seed for the "Live" snapshot; historical snapshots derive from it.
 */
export const seedData: WorkspaceData = {
  modules: [
    { id: 'm1', name: 'Feature Mapping & Mindmap', color: '#2f6fed', backbone: { name: 'Define Scope', sub: 'Phạm vi & tính năng' }, owners: ['BA', 'PO'] },
    { id: 'm2', name: 'Workflow & Swimlane Diagram', color: '#0d9488', backbone: { name: 'Design Workflows', sub: 'Logic & swimlane' }, owners: ['BA', 'Dev'] },
    { id: 'm3', name: 'Execution & Story Mapping', color: '#7c5cff', backbone: { name: 'Build & Sync', sub: 'Thực thi & đồng bộ' }, owners: ['PM', 'PO'] },
    { id: 'm4', name: 'Collaboration & Access', color: '#f59e0b', backbone: { name: 'Collaborate & Release', sub: 'Cộng tác & phát hành' }, owners: ['PM', 'PO', 'BA', 'Dev', 'Tester'] },
  ],

  releases: [
    { id: 'mvp', name: 'MVP', tag: 'Bản tối thiểu', color: '#16a34a', bg: '#eaf6ef', bdr: '#cdecd9' },
    { id: 'r1', name: 'Release 1', tag: 'Q3 · 2026', color: '#2f6fed', bg: '#eaf1fe', bdr: '#cfe0fb' },
    { id: 'r2', name: 'Release 2', tag: 'Q4 · 2026', color: '#7c5cff', bg: '#efeaff', bdr: '#ddd2fb' },
  ],

  features: [
    { id: 'f1', moduleId: 'm1', name: 'Node customization', status: 'done', releaseId: 'mvp' },
    { id: 'f2', moduleId: 'm1', name: 'Drag-and-drop builder', status: 'progress', releaseId: 'r1' },
    { id: 'f3', moduleId: 'm1', name: 'Role-based filters', status: 'nice', releaseId: 'r2' },
    { id: 'f4', moduleId: 'm2', name: 'BPMN notation', status: 'done', releaseId: 'mvp' },
    { id: 'f5', moduleId: 'm2', name: 'Multi-lane layout', status: 'done', releaseId: 'mvp' },
    {
      id: 'f6', moduleId: 'm2', name: 'Automatic impact calculation', status: 'progress', releaseId: 'r1',
      desc: 'Tự động tính vùng tác động khi một thẻ/node thay đổi: lan truyền theo liên kết Workflow và làm sáng các làn bị ảnh hưởng. Đây là lõi của cơ chế Impact Highlighting.',
      constraints: ['Thuật toán BFS theo workflow_links.', 'Ngưỡng cảnh báo cấu hình theo project.'],
      crossLinks: [
        { view: 'swimlane', label: 'Swimlane · E · Quyết định liên kết', targetId: 'E' },
        { view: 'story', label: 'Story Map · Impact engine' },
      ],
    },
    { id: 'f7', moduleId: 'm3', name: 'Dynamic release lanes', status: 'progress', releaseId: 'r1' },
    {
      id: 'f8', moduleId: 'm3', name: 'Real-time sync with workflow', status: 'must', releaseId: 'mvp',
      desc: 'Đồng bộ thời gian thực giữa Story Map và Swimlane: trạng thái đổi ở một View phản ánh tức thì ở các View khác theo cơ chế SSOT.',
      constraints: ['WebSocket channel theo project.', 'Reconcile khi mất kết nối.'],
      crossLinks: [{ view: 'swimlane', label: 'Swimlane · J · Cập nhật & lưu', targetId: 'J' }],
    },
    { id: 'f9', moduleId: 'm3', name: 'Color-coded task cards', status: 'done', releaseId: 'r2' },
    { id: 'f10', moduleId: 'm4', name: 'Comment threads', status: 'nice', releaseId: 'r1' },
    { id: 'f11', moduleId: 'm4', name: 'Live presentation mode', status: 'nice', releaseId: 'r2' },
    { id: 'f12', moduleId: 'm4', name: 'Role-based view settings', status: 'progress', releaseId: 'r2' },
  ],

  lanes: [
    { id: 0, name: 'User / PM / PO', sub: 'Người dùng cuối', color: '#6e8bff', owners: ['PM', 'PO'] },
    { id: 1, name: 'Frontend Interface', sub: 'Giao diện', color: '#2f6fed', owners: ['Dev', 'Tester'] },
    { id: 2, name: 'Backend & Database', sub: 'Xử lý · lưu trữ', color: '#0d9488', owners: ['Dev', 'BA', 'Tester'] },
    { id: 3, name: 'Notification Engine', sub: 'Cảnh báo', color: '#f59e0b', owners: ['Dev'] },
  ],

  swimNodes: [
    { id: 'A', label: 'Bắt đầu: kéo thẻ → Done', lane: 0, kind: 'start', status: 'done', x: 176, y: 69, owner: 'Phạm An', ownerInit: 'PA', ownerColor: '#6e8bff', desc: 'Người dùng kéo một thẻ Task từ In Progress sang Done trên Story Map.' },
    { id: 'B', label: 'Ghi nhận hành động kéo thả', lane: 1, kind: 'process', status: 'done', x: 392, y: 190, owner: 'FE Team', ownerInit: 'FE', ownerColor: '#2f6fed', desc: 'Frontend bắt sự kiện drag-drop và optimistic-update giao diện.' },
    { id: 'C', label: 'Gửi API cập nhật trạng thái', lane: 1, kind: 'process', status: 'done', x: 588, y: 190, owner: 'FE Team', ownerInit: 'FE', ownerColor: '#2f6fed', constraints: ['PATCH /tasks/:id { status }', 'Debounce 200ms cho thao tác liên tiếp.'] },
    { id: 'D', label: 'Nhận yêu cầu cập nhật', lane: 2, kind: 'process', status: 'done', x: 588, y: 353, owner: 'BE Team', ownerInit: 'BE', ownerColor: '#0d9488' },
    {
      id: 'E', label: 'Thẻ có liên kết Workflow?', lane: 2, kind: 'decision', status: 'done', x: 790, y: 349,
      owner: 'BE Team', ownerInit: 'BE', ownerColor: '#0d9488',
      desc: 'Kiểm tra thẻ có nằm trong một luồng Workflow (swimlane) hay không để quyết định có tính vùng tác động.',
      constraints: ['Tra bảng workflow_links.', 'Nếu có → tính impact; nếu không → cập nhật trực tiếp.'],
      crossLinks: [{ view: 'mindmap', label: 'Mindmap · Automatic impact calculation', targetId: 'f6' }],
    },
    { id: 'F', label: 'Cập nhật các node liên quan', lane: 2, kind: 'process', status: 'progress', x: 1014, y: 318, owner: 'BE Team', ownerInit: 'BE', ownerColor: '#0d9488', desc: 'Lan truyền thay đổi tới các node liên kết trong workflow (impact propagation).' },
    { id: 'G', label: 'Cập nhật trạng thái thẻ → DB', lane: 2, kind: 'process', status: 'done', x: 1014, y: 402, owner: 'BE Team', ownerInit: 'BE', ownerColor: '#0d9488' },
    { id: 'H', label: 'Tạo thông báo Impact Warning', lane: 3, kind: 'process', status: 'progress', x: 1014, y: 493, owner: 'Notif', ownerInit: 'NT', ownerColor: '#f59e0b', desc: 'Sinh cảnh báo tác động và gắn tag BA/PO để review.' },
    { id: 'I', label: 'Hiển thị cảnh báo tác động', lane: 1, kind: 'process', status: 'todo', x: 1240, y: 190, owner: 'FE Team', ownerInit: 'FE', ownerColor: '#2f6fed' },
    {
      id: 'J', label: 'Cập nhật UI → Done & lưu', lane: 1, kind: 'process', status: 'done', x: 1454, y: 190,
      owner: 'FE Team', ownerInit: 'FE', ownerColor: '#2f6fed',
      desc: 'Phản ánh trạng thái Done trên mọi View theo cơ chế SSOT và lưu trữ.',
      validations: ['Trạng thái phải đồng bộ Mindmap + Story Map trước khi đóng.'],
      crossLinks: [{ view: 'mindmap', label: 'Mindmap · Real-time sync with workflow', targetId: 'f8' }],
    },
    { id: 'K', label: 'Kết thúc', lane: 0, kind: 'end', status: 'done', x: 1670, y: 69 },
  ],

  swimEdges: [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'C', to: 'D' },
    { from: 'D', to: 'E' },
    { from: 'E', to: 'F', branch: 'Có' },
    { from: 'E', to: 'G', branch: 'Không' },
    { from: 'F', to: 'H' },
    { from: 'H', to: 'I' },
    { from: 'I', to: 'J' },
    { from: 'G', to: 'J' },
    { from: 'J', to: 'K' },
  ],

  snapshots: [
    { id: 'current', name: 'Bản hiện tại (Live)', date: 'cập nhật 2 giờ trước', tag: 'LIVE', tagColor: '#16a34a', tagBg: '#e7f6ee', dot: '#16a34a' },
    { id: 'sprint7', name: 'Sprint 7 — đóng băng', date: '2026 · 06 · 20', tag: 'SPRINT', tagColor: '#2f6fed', tagBg: '#e9f1ff', dot: '#2f6fed' },
    { id: 'client', name: 'Bản chốt khách hàng', date: '2026 · 05 · 12', tag: 'CHỐT', tagColor: '#8a6d1f', tagBg: '#fff3d4', dot: '#f59e0b' },
    { id: 'mvp', name: 'MVP baseline', date: '2026 · 03 · 02', tag: 'GỐC', tagColor: '#5b6470', tagBg: '#eef0f3', dot: '#9aa2ad' },
  ],

  alerts: [
    { id: 'al1', kind: 'impact', title: 'Tác động chưa được duyệt', detail: '"Real-time sync with workflow" vừa chuyển sang Must-have — ảnh hưởng nhánh quyết định và 6 bước phía sau trong Swimlane.', tags: ['@BA', '@Dev'], time: '5 phút trước', actionLabel: 'Xem vùng tác động', action: { view: 'swimlane', selection: { type: 'swimnode', id: 'E', view: 'swimlane' } } },
    { id: 'al2', kind: 'outdated', title: 'Sơ đồ có thể đã lỗi thời', detail: 'Swimlane "Cập nhật UI → Done & lưu" chưa cập nhật 32 ngày sau khi PR #142 được merge vào Production.', tags: ['@PO'], time: '2 giờ trước', actionLabel: 'Mở bước liên quan', action: { view: 'swimlane', selection: { type: 'swimnode', id: 'J', view: 'swimlane' } } },
    { id: 'al3', kind: 'dod', title: 'Điều kiện nghiệm thu (DoD)', detail: '"Automatic impact calculation" cần BA xác nhận sơ đồ Swimlane khớp 100% Production trước khi được đánh dấu Released.', tags: ['@BA'], time: 'Hôm nay', actionLabel: 'Mở tính năng', action: { view: 'mindmap', selection: { type: 'feature', id: 'f6', view: 'mindmap' } } },
  ],
}

/**
 * Derive a frozen historical snapshot from the live seed by rewinding feature
 * statuses (version history is mocked for v1). Returns a deep-ish clone.
 */
export function snapshotData(snapshotId: string): WorkspaceData {
  const clone: WorkspaceData = JSON.parse(JSON.stringify(seedData))
  if (snapshotId === 'current') return clone

  // Map of overrides per historical snapshot — fewer things "done" the further back.
  const rewind: Record<string, Record<string, WorkspaceData['features'][number]['status']>> = {
    sprint7: { f6: 'progress', f9: 'progress', f12: 'must' },
    client: { f6: 'must', f7: 'must', f9: 'progress', f12: 'must', f5: 'progress' },
    mvp: { f2: 'must', f6: 'must', f7: 'must', f9: 'nice', f12: 'must', f5: 'progress', f4: 'progress' },
  }
  const swimRewind: Record<string, Record<string, WorkspaceData['swimNodes'][number]['status']>> = {
    sprint7: { F: 'todo', H: 'todo' },
    client: { F: 'todo', G: 'progress', H: 'todo', I: 'todo' },
    mvp: { D: 'progress', E: 'progress', F: 'todo', G: 'todo', H: 'todo', I: 'todo', J: 'progress' },
  }
  const fOverrides = rewind[snapshotId]
  if (fOverrides) clone.features.forEach((f) => { if (fOverrides[f.id]) f.status = fOverrides[f.id] })
  const sOverrides = swimRewind[snapshotId]
  if (sOverrides) clone.swimNodes.forEach((n) => { if (sOverrides[n.id]) n.status = sOverrides[n.id] })
  return clone
}
