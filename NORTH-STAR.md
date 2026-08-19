# KineTrak — north star

> Công cụ quản lý **business logic** trực quan, rút ngắn khoảng cách PM → BA → Dev — mà “Dev” bây
> giờ phần lớn là agent. Board là ngữ cảnh dự án mà agent đọc được.

**Bản này để chống trôi mục tiêu.** Đọc §2, §3 và §7 trước khi thêm bất cứ tính năng nào. §3 là chỗ
dễ mất phương hướng nhất: có một sản phẩm khác đang làm rất tốt phần *trông giống* KineTrak.

Cập nhật 2026-08-19. Anh em: `README.md` · `docs/AGENT_PLAYBOOK.md` · `docs/BOARD_QUALITY.md` ·
`~/tools/repo-gates/NORTH-STAR.md` (chỉ mục 4 sản phẩm).

---

## 1. Câu hỏi nó trả lời

> **“Đổi cái này thì còn cái gì bị ảnh hưởng?”** — trả lời **trước khi sửa**.

Chất liệu của KineTrak: **cấu trúc sản phẩm — module / feature / release / dependency.**

## 2. Ai đau, đau vì cái gì

**Ai:** người phải đổi một thứ trong hệ thống mà họ không tự tay dựng hết. Và người phải giải thích
lại dự án cho agent ở **mỗi phiên**.

**Cơn đau KHÔNG phải** “thiếu công cụ quản lý dự án” — đây là chỗ chật nhất trong bốn sản phẩm, và
nếu định vị vào đó thì thua ngay.

**Hai cơn đau thật:**

1. **Logic sản phẩm đứt đoạn giữa PM, BA và người viết code.** Mỗi bên giữ một bản hiểu khác nhau,
   không bản nào kiểm được, không bản nào là bản chính.
2. **Agent quên, còn bạn phải nhớ hộ nó.** Chính hướng dẫn MCP của KineTrak đã viết:
   *“the board is the single source of truth, not this chat”* và *“RECALL BEFORE YOU WRITE.”*
   Mỗi phiên agent bắt đầu từ số không; board thì không.

Và câu hỏi mà không chỗ nào khác trong hệ thống trả lời được: **“đổi feature này thì vỡ đâu?”**

## 3. Cái làm nó khác — ranh giới quan trọng nhất của repo này

### 3.1 Khác công cụ vẽ diagram

`openflowkit` (github.com/Vrun-design/openflowkit — 718 sao, MIT, 209 commit, có MCP server) tự định
vị *“the open-source diagramming studio for builders”*: canvas ↔ DSL hai chiều, 1.600 icon, ELK
layout, export PNG/SVG/PDF/Mermaid/PlantUML/video, 10 nhà cung cấp AI. **Nó lưu tài liệu trong
IndexedDB** — tức trong trình duyệt, từng máy một.

| | Diagram studio (openflowkit, artifact diagram) | KineTrak |
|---|---|---|
| Đầu ra | một **bức hình** | một **trạng thái truy vấn được** |
| Lưu ở | IndexedDB, theo trình duyệt | Postgres · org / account / api_key / share |
| Trả lời được | “vẽ cho tôi xem” | “đổi feature này thì vỡ đâu” |
| Vòng đời | theo phiên | theo dự án, webhook gắn cờ `codeStale` |

**Có đua phần vẽ không? CÓ.** Quyết định 19/08/2026, và đây là quyết định đúng vì ba lý do đo được:

1. **“Trực quan hóa” nằm trong chính phát biểu giá trị của KineTrak** — README tự gọi nó là
   *“a visual operating interface… three synchronized living diagrams.”* Một sản phẩm thuộc hạng đó
   không được phép xấu hơn thứ miễn phí bên cạnh. Phần vẽ ở đây là **điều kiện vào cửa**, không phải
   phần thêm.
2. **openflowkit không phải gã khổng lồ.** 209 commit, 718 sao — vài tháng làm việc, không phải Figma.
3. **KineTrak không xuất phát từ 0.** Đã có 4 view (Mindmap, StoryMap, Swimlane, OrgBoard),
   `arrange_swimlane`, WS delta realtime.

Và điều quyết định: openflowkit lưu **IndexedDB theo trình duyệt**, nên nó **về cấu trúc không thể**
có state chia sẻ, truy vấn ảnh hưởng, hay drift gắn với code. KineTrak đạt ngang phần vẽ thì thành
**tập cha**, không phải đối thủ ngang hàng.

**Nhưng đua có mức trần** — xem §3.3. Phần vẽ là điều kiện vào cửa với một danh sách hữu hạn, không
phải chiến lược mở. Hào vẫn là **mô hình + truy vấn**.

### 3.3 Đua tới đâu — danh sách hữu hạn

**ĐUA (điều kiện vào cửa, có điểm dừng):**

| Việc | Cách rẻ nhất |
|---|---|
| Auto-layout chất lượng | **Dùng ELK.js**, đừng tự viết — chính openflowkit cũng dùng nó |
| Nhận Mermaid vào | Mermaid là spec công khai; đây là đường onboarding nhanh nhất, phục vụ chỉ số “dưới 15 phút” |
| Export PNG / SVG | rẻ, và là thứ người ta đem đi họp |
| Icon set | openflowkit MIT — **mượn cách làm, đừng dựng lại 1.600 icon** |

**KHÔNG ĐUA (openflowkit có, nhưng không phục vụ job của KineTrak):**

- Export video / WebCodecs — không ai ra quyết định bằng một đoạn video.
- Cấu hình 10 nhà cung cấp AI — KineTrak đã là MCP server, agent vào thẳng.
- Freeform whiteboard — chính openflowkit cũng khai đây là non-goal.
- **Canvas ↔ DSL đồng bộ hai chiều đầy đủ** — đắt nhất, và **đã bị 65 MCP tool phủ** cho phía agent.
  Chỉ làm nếu có người thật đòi, không làm vì openflowkit có.

**Mượn, đừng dựng lại.** openflowkit là MIT; ELK.js miễn phí; Mermaid là spec. Đạt ngang phần vẽ rẻ
hơn nhiều so với chi phí openflowkit đã bỏ ra để tới đó.

### 3.2 Khác forge (và vì sao không cạnh tranh)

forge có **79 bảng và không bảng nào là `feature` hay `module`**. Grep
`topolog|transitive|DAG|blast` trong `packages/core/src` ra **0 hit thuật toán** — traversal của
forge là BFS chặn ở depth 5 / 200 node.

- **forge** trả lời *“đang làm gì, đã hết chặn chưa”* — dependency là **cổng chặn** (DFS chống cycle,
  gate `waiting_on_dep` chờ `merged_at`).
- **KineTrak** trả lời *“hệ thống làm bằng gì, đổi cái này thì vỡ đâu”* — dependency là **engine
  phân tích** (transitive closure hai chiều, `src/lib/impact.ts:45`, cross-project qua org board).

Hai nửa của một thứ. Nối bằng **một khoá**, không gộp schema.

## 4. Bằng chứng hôm nay (đo 19/08/2026)

```
kinetrak.thejunix.com/api/health → {"ok":true,"accounts":2}   — production, đang chạy
localhost:8787                                                — cũng đang chạy
78 test (72 pass · 6 skip) · 0 stub (grep TODO|FIXME|stub → 0 hit)
65 MCP tool · Postgres + Drizzle 10 bảng · 0 coupling nội bộ
multi-tenancy đã có sẵn: users · sessions · orgs · api_keys · shares
```

Máy móc thật đang chạy: impact engine transitive hai chiều · board-quality invariant I1–I7 (trên
board `ssot` là lỗi cứng, **chặn `create_snapshot`**) · ProjectRegistry load theo yêu cầu + evict
khi rảnh + ghi tuần tự · WS delta có scope · webhook GitHub/GitLab HMAC → gắn cờ `codeStale` ·
share link chỉ đọc.

**Đang là MCP server thật** cho `~/services/anhome` và `~/code/dodgeprint-api`; có board memory ở 3
project; cài như plugin marketplace `kinetrak-tools`.

**Đây là artifact mạnh nhất trong bốn sản phẩm.** Nó không cần “hoàn thiện” — nó cần **được nối** và
**được người ngoài dùng**.

## 5. North star

> **Số người KHÔNG phải chủ sở hữu đã ra một quyết định dựa trên `compute_impact`.**

Không đếm account. Không đếm board. **Một board không bị truy vấn là một cái sơ đồ** — và sơ đồ đẹp
thì đã có thứ miễn phí làm rồi. Phần vẽ đưa người ta vào cửa; **truy vấn mới là lý do họ ở lại.**

| Mốc | Chỉ tiêu |
|---|---|
| 30 ngày | `Feature.issueRef` ⇄ forge `issues` chạy được |
| 90 ngày | **5 người ngoài** đã ra quyết định bằng `compute_impact` |
| 12 tháng | dùng đều đặn ở ≥10 dự án không phải của chủ sở hữu |

**Chỉ số dẫn:** thời gian từ đăng ký tới board đầu tiên có ≥1 dependency — mục tiêu **dưới 15 phút**.

## 6. Kill criteria

90 ngày mà **0 người ngoài** ra quyết định dựa trên `compute_impact` → hoặc mô hình sai, hoặc người
dùng sai. **Ngừng thêm tính năng**, chuyển toàn bộ thời gian sang nói chuyện với người dùng.

## 7. Không làm

- **Không để phần vẽ chiếm chỗ của north star.** Đua phần vẽ là quyết định đã chốt (§3.2), nhưng
  ràng buộc: **mỗi vòng cải thiện visual phải đi kèm một việc đẩy §5.** Không có vòng nào chỉ có
  visual. Đây là chỗ thay cho lệnh cấm cũ — rủi ro thật không phải “đua thì thua”, mà là *dành hết
  thời gian cho hình và không bao giờ đưa truy vấn tới người thứ hai*.
- **Không vượt quá danh sách ở §3.3.** Không export video, không cấu hình 10 nhà cung cấp AI, không
  freeform whiteboard, không canvas↔DSL hai chiều đầy đủ. Ngoài danh sách là scope creep.
- **Không tự viết layout engine hay vẽ lại 1.600 icon.** ELK.js miễn phí, openflowkit MIT.
  Mượn, đừng dựng lại.
- **Không gộp schema với forge.** Một khoá `issueRef`, hai database. Không port swimlane vào forge,
  không để 15 status của forge rò vào 4 status của KineTrak.
- **Không nới board-quality invariant để cho dễ dùng.** I1–I7 chặn `create_snapshot` trên board
  `ssot` là **tính năng**, không phải ma sát. Board không kiểm được thì quay về là một bức hình.
- **Không thêm tính năng khi north star còn bằng 0.** Xem §6.
- **Không đặt việc thương mại lên đường tới hạn.** Xem §8.

## 8. Thu phí — để sau, có điều kiện

Chủ sở hữu đã chốt: **giá trị đi trước, miễn phí cũng được.** Phần thương mại **không nằm trên
đường tới hạn** và không được chiếm thời gian của §5.

**Điều kiện mở lại câu hỏi giá: north star ở §5 khác 0.** Chưa có người ngoài ra quyết định bằng nó
thì mọi mô hình giá đều là đoán.

Khi đủ điều kiện, việc phải làm: định giá · billing · ToS + Privacy · cam kết cô lập dữ liệu · đường
báo lỗi bảo mật · chính sách backup/khôi phục · kênh hỗ trợ. Tin tốt: **multi-tenancy đã có sẵn**
(§4) — đó là tài sản, không phải việc còn phải làm.

## 9. Lộ trình của repo này

**Nối (ưu tiên cao nhất)**
- `Feature.issueRef` ⇄ forge `issues` — một trường tuỳ chọn. Kết quả: forge có blast-radius nó không
  có; KineTrak có trạng thái thực thi nó không có.

**Sau khi archmap export đồ thị (Phase 2 của archmap)**
- `CodeRef{path,symbol,url,sha}` kiểm chứng bằng đồ thị import thật → `codeStale` từ một tín hiệu
  webhook trở thành **sự thật kiểm được**, và một Feature trả lời được *“đổi cái này còn chạm vào
  đâu”* ở mức code.

**Onboarding**
- Rút thời gian tới board đầu tiên có dependency xuống dưới 15 phút. Đây là chỉ số dẫn của §5.

**Ngang phần vẽ — danh sách hữu hạn ở §3.3, theo thứ tự đòn bẩy**
1. **Nhận Mermaid vào.** Rẻ nhất, và phục vụ thẳng chỉ số 15 phút ở trên — dán một sơ đồ có sẵn là
   có board, thay vì dựng từng node.
2. **Auto-layout bằng ELK.js.** Không tự viết. Nâng `arrange_swimlane` lên chất lượng openflowkit.
3. **Export PNG / SVG.** Thứ người ta đem đi họp; cũng là đường board thoát ra ngoài công cụ.
4. **Icon set.** Mượn cách làm của openflowkit (MIT), không vẽ lại.

Ràng buộc §7: **mỗi mục ở trên phải đi kèm một việc đẩy §5** trong cùng vòng.

## 10. Nhật ký quyết định

- **2026-08-19 (chiều)** — **Đảo quyết định buổi sáng: CÓ đua phần vẽ với openflowkit.** Lý do đảo:
  “trực quan hóa” nằm trong chính phát biểu giá trị của sản phẩm, nên khuyên không đua là mâu thuẫn
  với định vị; openflowkit mới 209 commit; KineTrak đã có 4 view. Và openflowkit lưu IndexedDB nên
  về cấu trúc không thể có state chia sẻ / truy vấn ảnh hưởng — đạt ngang phần vẽ thì KineTrak thành
  **tập cha**. Đổi lệnh cấm thành **mức trần hữu hạn (§3.3) + ràng buộc mỗi vòng visual kèm một việc
  đẩy §5**.
- **2026-08-19 (sáng)** — Khảo `openflowkit`, kết luận ban đầu là không đua phần vẽ. *Đã đảo, xem
  mục trên.* Phần còn đúng và giữ nguyên: **hào là mô hình + truy vấn**, phần vẽ là điều kiện vào
  cửa chứ không phải hào.
- **2026-08-19** — North star đổi từ *“account trả tiền gọi `compute_impact`”* sang *“người ngoài
  **ra quyết định** bằng `compute_impact`”*, theo quyết định giá trị-đi-trước.
- **2026-08-19** — Thu phí rời khỏi đường tới hạn; có điều kiện mở lại rõ ràng (§8).
- **2026-08-19** — Xác nhận forge không có entity `feature`/`module` và 0 thuật toán transitive →
  hai bên là hai nửa, nối bằng một khoá.
- **2026-07-06** — Commit cuối. Im lặng ở đây nghĩa là **xong việc**, không phải bỏ: dịch vụ vẫn
  chạy production với 2 account.
