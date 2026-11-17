# Workshop: コーディングエージェント PoCから本番運用へ

AI勉強会 (2時間) の資料とデモ。例はすべて架空の EC サイトです。

| フォルダ | 内容 |
|---|---|
| [`slides/`](slides/) | スライド (HTML)。`slides/index.html` を Chrome で開く · `P` 発表者ビュー · `H` ふりがな |
| [`ec-demo/`](ec-demo/) | デモ用の架空 EC サイト (Node.js · 依存なし) · Spec Kit · hooks |
| [`ec-demo/demo/RUNBOOK.md`](ec-demo/demo/RUNBOOK.md) | デモ手順 (コピペ用) |

```bash
cd ec-demo
npm test                    # 38 tests
./demo/reset.sh d1          # デモ①の準備 (d1〜d5, d4-cook, clean)
```

スライドの編集: `slides/src/` → `slides/build.sh` (詳細は `slides/README.md`)
