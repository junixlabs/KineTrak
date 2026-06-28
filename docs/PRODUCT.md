# KineTrak — Product Spec (v1)

> Visual Operating Interface for product teams. **Dẹp tài liệu chữ** — điều hành cả vòng đời
> dự án qua **3 sơ đồ sống đồng bộ** trên **một nguồn sự thật duy nhất (SSOT)**.

This is the implemented spec for the real product. It derives from the concept docs
(`Kinetrak_Blueprint.html`, `KineTrak_Strategy.html`) and the Claude Design prototype
("KineTrak Workspace"), which served as reference only — the product is a fresh React build,
not a copy of the prototype.

## 1. Triết lý
80% thông tin nằm ở **sơ đồ** (cấu trúc, luồng dữ liệu, người phụ trách, tiến độ — hiểu trong 3s);
20% chi tiết (ràng buộc API, quy tắc validate, ghi chú) **giấu trong thẻ**, chỉ hiện khi click
(Context-in-Card). Không chạy đua tính năng rác.

## 2. Ba tầng sơ đồ (the visual backbone)

| View | Đối tượng | Vai trò |
|---|---|---|
| **Mindmap** (Feature Mapping) | PO · BA | Phân rã Module → Tính năng, gắn nhãn trạng thái, tiến độ/module |
| **Story Map** | PM · PO | Trục ngang = hành trình, trục dọc = release; thẻ màu theo trạng thái |
| **Swimlane** | BA · Dev · Tester | Luồng nghiệp vụ rẽ nhánh, phân làn trách nhiệm, vùng tác động |

## 3. Cơ chế "sơ đồ sống"
- **SSOT** — mỗi tính năng/task là một bản ghi duy nhất; đổi trạng thái ở một View tự cập nhật
  **mọi View** tức thì (đã kiểm chứng: Mindmap → Story Map).
- **Snapshot & Version Control** — tạo snapshot **đông cứng** bản hiện tại bất kỳ lúc nào; xem lại
  ở chế độ chỉ đọc kèm banner cảnh báo; xoá snapshot. Mỗi snapshot lưu kèm project.
- **Impact Warning AI** (cảnh báo) — 3 loại: Tác động chưa duyệt · Sơ đồ lỗi thời (PR merge) ·
  Điều kiện nghiệm thu (DoD). _v1: dữ liệu mock; v2 nối webhook GitHub/GitLab._
- **Context-in-Card** — panel chi tiết: trạng thái, người phụ trách, mô tả, ràng buộc API,
  quy tắc validate, liên kết chéo (Dynamic Linking điều hướng giữa các View).

## 4. Tính năng strategy đã hiện thực hoá (prototype mới giả lập)
- **Semantic Zoom** — Mindmap/Swimlane đổi cấp chi tiết theo mức zoom (zoom-out = module vĩ mô;
  zoom-in = hiện tính năng / nhãn đầy đủ).
- **Drag-and-drop** — Story Map: kéo thẻ giữa các release (cập nhật thật, có ràng buộc khi xem
  snapshot lịch sử).
- **Role-based filter** — lọc theo PM/PO/BA/Dev/Tester; làm mờ phần không thuộc vai trò.

## 4b. Authoring / CRUD (MVP)
Công cụ dùng được thật, không chỉ xem seed:
- **Module / tính năng**: thêm ở Mindmap (＋ Module · ＋ trên node module) và Story Map (ô ＋); sửa
  mọi trường trong panel (tên, mô tả, ràng buộc, validate, status, module, release, vai trò module);
  xoá (xoá module ⇒ xoá tính năng con).
- **Swimlane**: thêm bước theo làn, **kéo sắp xếp** (lưu toạ độ), **nối chấm xanh để vẽ mũi tên**,
  hover mũi tên để xoá hoặc chọn bước rồi **Delete**.
- **Read-only**: khi xem snapshot, mọi nút thêm/sửa/xoá ẩn đi.

## 4c. Orgs & Multiple projects (MVP)
- Mỗi **Project sở hữu dữ liệu riêng** (graph + snapshot), nhóm theo **Org**. Bộ chọn ở header:
  chuyển project, tạo/đổi tên/xoá project & org, project mới chọn **Sample** (copy demo) hoặc **Blank**.
- Single-user, local — org mới chỉ là nhóm (chưa auth/chia sẻ).

## 5. Kiến trúc kỹ thuật
- **Vite + React 18 + TypeScript**.
- **@xyflow/react** (React Flow) — Mindmap & Swimlane (custom node/edge, vẽ edge, kéo node);
  **CSS Grid** — Story Map; **@dnd-kit** — kéo thẻ.
- **Zustand + persist (v2)** — store đa-project; mỗi project sở hữu `WorkspaceData` sửa trực tiếp;
  seed là **template** (`sample`/`blank`). Lưu `localStorage` (key `kinetrak-workspace`), có
  `migrate` từ v1 (mô hình overrides cũ) sang project mặc định. Snapshot = bản đông cứng lưu kèm.
- **Tailwind** với token brand (`#2f6fed` …). Font Hanken Grotesk + JetBrains Mono.
- Mã nguồn: `src/store` (types/seed/ids/store/selectors), `src/lib/{impact,layout}.ts`,
  `src/components/{shell,views,nodes,panel}` (panel có `fields.tsx` các control sửa).

## 5b. Home, Present & Share (done)
- **Home** (Miro-style): top header (Workspace · Free · Invite · Upgrade · what's-new ·
  notifications · avatar menu with Import / Reset all data) + left sidebar (search, Home/Recent,
  Spaces=orgs) + template cards (Blank/Sample) + project grid. Header logo returns Home.
- **Present mode**: clean fullscreen view (project + view tabs + Exit/Esc), editing chrome hidden.
- **Share**: Copy link, Export project (JSON download), Import project (JSON) — local-first;
  data lives in the browser, export to hand off. Transient toasts confirm actions.

## 6. Ngoài phạm vi MVP (v.next)
CRUD cho **lane** & **release** (giữ scaffold chuẩn từ template); sửa nhãn nhánh edge; undo/redo;
backend + DB; đồng bộ realtime qua WebSocket; webhook GitHub/GitLab cho cảnh báo lỗi thời;
đa người dùng thật & chia sẻ org online; comment threads. Kiến trúc đã chừa khe cắm sạch
(store tách bạch data/ui, action editing tập trung, project sở hữu data).

## 7. Đồng bộ với concept docs
- **Màu brand**: ✅ đã đồng bộ. Hai file concept (`Kinetrak_Blueprint.html`,
  `KineTrak_Strategy.html`) đã chuyển về token brand của sản phẩm — primary `#2f6fed`
  (hover `#2a63d6`), accent grape `#7c5cff` (node quyết định mermaid) & amber `#f59e0b`
  (hộp triết lý), nền `#eef1f5`, viền `#e5e8ec`, chữ `#14181f`, tag brand-tint
  (`#eef1ff`/`#2a4a8f`); font **Hanken Grotesk** + **JetBrains Mono** như app.
- **Story backbone**: sản phẩm dùng 4 bước (Define Scope → Design Workflows → Build & Sync →
  Collaborate & Release); blueprint gốc ghi 3 bước — *chưa chốt*, để bạn quyết.
