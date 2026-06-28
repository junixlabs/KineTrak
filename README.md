# KineTrak

Visual Operating Interface — điều hành dự án qua 3 sơ đồ sống (Mindmap · Story Map · Swimlane)
đồng bộ trên một nguồn sự thật duy nhất (SSOT).

## Chạy dự án

```bash
npm install

# Một lệnh — web + API + WS + MCP chung 1 port:
npm start        # build web rồi phục vụ tất cả ở http://localhost:8787

# Dev (hot reload, 1 lệnh chạy cả hai):
npm run dev:all  # Vite (5173) + server (8787)

# Lẻ:
npm run dev      # chỉ web (5173)
npm run server   # chỉ server/MCP (8787)
npm run build    # type-check + build vào dist/
```

Kết nối agent qua MCP: xem [`docs/MCP.md`](docs/MCP.md) (endpoint `http://localhost:8787/mcp`).

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
