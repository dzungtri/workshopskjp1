# DEMO RUNBOOK

`cd workshop/ec-demo` → `./demo/go.sh <番号>` → claude が起動 → **⌘V → Enter**
(リセット・ブランチ準備・プロンプトのコピーは go.sh が全部やる)

| デモ | コマンド | 1つ目 (自動コピー) | 次のプロンプト |
|---|---|---|---|
| ① バグ修正 | `./demo/go.sh 1` | 1 | — |
| ② ガードレール | `./demo/go.sh 2` | 2a (TBD → 質問) | `./demo/go.sh c 2b` (hook) → 最後に `cat .claude/settings.json` |
| ③ チケット分解 | `./demo/go.sh 3` + Shift+Tab | 3 | — |
| ③ 並列 | `./demo/go.sh 3p` (Terminal が2つ開く) | 3p1 | `./demo/go.sh c 3p2` |
| ④ Spec Kit | `./demo/go.sh 4` | 4a (/speckit-specify, 約1.5分) | 別ターミナルで `./demo/go.sh 4b` → 元の claude に ⌘V |
| ⑤ AIレビュー | `./demo/go.sh 5` | 5a | `./demo/go.sh c 5b` |
| ⑥ Context | ⑤ のまま、別ターミナルで `./demo/go.sh 6` | 6a `/context` | `c 6b` → `c 6c` |

終わったら: `./demo/reset.sh clean` · 退避された変更: `git stash list` (不要なら `git stash clear`)

プロンプト本文: `demo/prompts/*.txt` · 準備版 spec: `demo/spec-prepared/`

## 事前準備 (前日)
- Claude Code に GitHub MCP を設定 (④ の Issue 作成用)
- 全デモを1回通す (`go.sh 1` … `6`)
