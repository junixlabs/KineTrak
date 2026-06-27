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
- **Snapshot & Version Control** — Live / Sprint / Bản chốt khách hàng / MVP baseline; xem lịch sử
  ở chế độ chỉ đọc kèm banner cảnh báo.
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

## 5. Kiến trúc kỹ thuật
- **Vite + React 18 + TypeScript**.
- **@xyflow/react** (React Flow) — Mindmap & Swimlane; **CSS Grid** — Story Map; **@dnd-kit** — kéo thả.
- **Zustand + persist** — store SSOT duy nhất, lưu `localStorage` (key `kinetrak-workspace`).
- **Tailwind** với token brand (`#2f6fed` …). Font Hanken Grotesk + JetBrains Mono.
- Mã nguồn: `src/store` (types/seed/store/selectors), `src/lib/impact.ts` (BFS vùng tác động),
  `src/components/{shell,views,nodes,panel}`.

## 6. Ngoài phạm vi v1 (v2)
Backend + DB, đồng bộ realtime qua WebSocket, webhook GitHub/GitLab cho cảnh báo lỗi thời,
đa người dùng thật, comment threads, chế độ Present trực tiếp. Kiến trúc đã chừa khe cắm sạch
cho các phần này (store tách bạch data/ui, action editing tập trung).

## 7. Lưu ý đồng bộ với concept docs
- **Màu brand**: sản phẩm chốt `#2f6fed` (theo prototype). Hai file concept đang dùng
  `#0052cc` / `#ff5630` — nên cập nhật lại để khớp (chưa làm trong v1).
- **Story backbone**: sản phẩm dùng 4 bước (Define Scope → Design Workflows → Build & Sync →
  Collaborate & Release); blueprint gốc ghi 3 bước.
