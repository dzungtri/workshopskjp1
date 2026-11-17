# ec-demo — AIコーディングエージェント演習用 架空ECサイト

架空のECサイトのバックエンド (商品・在庫・カート・クーポン・注文・決済・返品・返金) を
メモリ上だけで動かす小さなデモです。実在の企業・システムとは関係ありません。

- Node.js 20+ / ESM / **依存パッケージなし** (`npm install` 不要)
- 金額はすべて整数円。現在時刻は `clock()` で注入 (テストは決定的)

```bash
npm test        # 全テスト (node --test)
npm run lint    # 構文チェック
npm run demo    # 注文 → 返金の通しシナリオを表示
```

## 主なファイル

| ファイル | 内容 |
|---|---|
| `CLAUDE.md` / `AGENTS.md` | エージェント向けの短い指示 (コンテキスト) |
| `docs/business-rules.md` | 業務ルール (BR-xx)。人間が決めるもの / 実装詳細 / 未決定 (TBD) |
| `docs/tasks/` | タスク分解の例とチケットテンプレート |
| `docs/review-checklist.md` | AI生成PRのレビューチェックリスト |
| `test/golden/` | 人間承認済みの期待値 (ゴールデンテスト) |
| `.claude/` | ガードレール hook の例 |

## デモ

手順 (コピペ用): **[`demo/RUNBOOK.md`](demo/RUNBOOK.md)** · 準備/リセット: `./demo/reset.sh d1|d2|d3|d4|d4-cook|d5|clean`

| # | 内容 | 準備 |
|---|---|---|
| ① | Agent Loop: 返品期限バグを直す | `reset.sh d1` (main + `demo/patches/d1-*.patch`) |
| ② | ガードレール: TBD で止まる / hook がブロック | `reset.sh d2` |
| ③ | チケット分解 + worktree 並列 | `reset.sh d3` |
| ④ | Spec first: Spec Kit → tasks → GitHub issues (GitHub MCP) | `reset.sh d4` → `reset.sh d4-cook` |
| ⑤ | AIレビュー: テストは green、でも二重返金 | `reset.sh d5` (main + `demo/patches/d4-*.patch`) |
| ⑥ | Context: `/context` · subagent · `/compact` | ⑤ のセッションを続ける |

- hook (`.claude/`) は**説明用のサンプル**です。Bash 経由の書き換えなどは防げません
- Spec Kit: `.specify/` · `.claude/skills/speckit-*` (`specify init --integration claude` 済み)
