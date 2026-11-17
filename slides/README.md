# Workshop slides: コーディングエージェント PoCから本番運用へ

Workshop 2h cho dev team Spark Japan (khán giả người Nhật). Slide tiếng Nhật ngắn + thuật ngữ English; kịch bản nói đầy đủ nằm trong presenter notes.

## Mở / trình bày
- Mở `index.html` bằng Chrome (offline được, font nằm trong `fonts/`).
- Phím: `→`/`Space` bước tiếp (kể cả bước animation) · `←` lùi · `↑↓` nhảy slide · `O` tổng quan · `F` toàn màn hình · `R` reset animation slide hiện tại · **`H` bật/tắt furigana** (chữ nhỏ xám dưới kanji; màn chiếu mặc định tắt, presenter view mặc định bật, nhớ lựa chọn) · `?` hiện phím tắt
- **`P` = presenter view** (mở cửa sổ riêng, đồng bộ với màn chiếu): script JP đầy đủ + ghi chú VN + cue thời gian, đồng hồ, mục lục khối. `N` = hiện notes ngay trên màn hình (chỉ để luyện tập).
- `index.html#9.3` = mở slide 9 ở bước 3 · `index.html?all` = hiện toàn bộ bước (để in PDF: Cmd+P) · `?furi` = bật furigana.
- Chữ tiếng Nhật do animation JS sinh ra (feature_list, compaction) chưa có furigana.

## Cấu trúc
```
src/shell.html        khung HTML (presenter view, notes overlay)
src/style.css         phong cách giấy kem + panel tối cho slide cơ chế
src/script.js         điều hướng, step/animation engine (data-steps, data-at)
src/symbols.html      icon SVG vẽ tay (từ deck mùa 1)
src/parts/NN-*.html   slide theo khối (00 mở đầu, 01 A … 06 F + kết)
src/anim/*.js         animation có logic (loop counter, feature_list, context window, subagent)
build.sh              build có furigana tự động (uv + fugashi/unidic-lite)  ← dùng cái này
build.py              ghép src → index.html (chạy thẳng bằng python3 thì bỏ qua furigana)
furigana.py           sinh <ruby> cho mọi từ có kanji (bỏ qua code/pre/svg/ruby có sẵn)
shot.sh               chụp màn hình headless để kiểm tra layout
```

### Viết slide mới
- `<section class="slide" id="..." data-title="..." data-part="...">` + `<aside class="notes">` gồm `.nt-cue` (thời gian/cue), `.nt-jp` (script nói), `.nt-vi` (ghi chú VN).
- Hiện dần: `class="frag" data-f="1"` (cùng số = hiện cùng lúc).
- Animation theo trạng thái: thêm `data-steps="N"` vào slide; phần tử dùng `data-at="2"` (≥2), `"2-4"`, `"=3"`, hoặc nhiều class `"glow@=2 done@3-"`. Logic phức tạp: `DECK_ANIM['slide-id'] = (step, el) => {...}` trong `src/anim/`.

## Bản đồ thời gian (120')
| Khối | Slide | Phút |
|---|---|---|
| 0 Mở đầu (METR, DORA, 今日の地図, ví dụ EC) | 1–7 | 0–9 |
| A Agent Loop | 8–12 | 9–23 (gồm Q&A) |
| B 本番運用 · Guardrails | 13–22 | 23–46 |
| C 開発プロセス (ticket, DAG, loop, Ralph, long-running) | 23–31 | 45–66 + nghỉ 5' |
| D 品質保証 (review 3 lớp, bài tập PR) | 32–38 | 71–91 |
| E Context · Token | 39–46 | 91–109 |
| F 概要 + kết | 47–53 | 109–120 |

## Liên quan
- `../ec-demo/` — repo demo (EC giả định) mà các slide trích code/rule/ticket/bài tập.
- `../workshop-plan.md` — plan nội dung và nguồn tham khảo.

## Font
Klee One (SIL OFL) cho tiếng Nhật, Pangolin/Patrick Hand/JetBrains Mono cho Latin (từ deck mùa 1).
