# KineTrak

Visual Operating Interface — điều hành dự án qua 3 sơ đồ sống (Mindmap · Story Map · Swimlane)
đồng bộ trên một nguồn sự thật duy nhất (SSOT).

## Chạy dự án

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + build production vào dist/
npm run preview  # xem thử bản build
```

## Cấu trúc

```
src/
  store/      types · seed (dữ liệu mẫu) · useWorkspace (Zustand SSOT + persist) · selectors
  lib/        impact.ts — BFS vùng tác động
  components/
    shell/    Header, ViewTabs, SnapshotMenu/Banner, RoleFilter, AlertsPanel, ZoomControl
    views/    MindmapView, StoryMapView, SwimlaneView
    nodes/    node tuỳ biến React Flow (mindmap + swimlane)
    panel/    DetailPanel (Context-in-Card)
docs/         PRODUCT.md (spec) · concept gốc (blueprint, strategy)
```

## Tech stack

React 18 · TypeScript · Vite · React Flow (`@xyflow/react`) · `@dnd-kit/core` · Zustand · Tailwind.

Chi tiết sản phẩm & lộ trình: [`docs/PRODUCT.md`](docs/PRODUCT.md).
