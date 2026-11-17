#!/bin/bash
# デモにジャンプ: リセット → 最初のプロンプトをクリップボードへ → claude を起動
#   ./demo/go.sh 1     ① バグ修正
#   ./demo/go.sh 2     ② ガードレール (2a → 2b)
#   ./demo/go.sh 3     ③ チケット分解 (plan mode: Shift+Tab)
#   ./demo/go.sh 3p    ③ 並列: worktree ×2 を作り、Terminal を2つ開く
#   ./demo/go.sh 4     ④ Spec Kit: specify
#   ./demo/go.sh 4b    ④ 準備版 spec/plan/tasks に切替 + Issue 用プロンプトをコピー (claude は起動しない)
#   ./demo/go.sh 5     ⑤ AIレビュー (5a → 5b)
#   ./demo/go.sh 6     ⑥ Context (⑤ のセッションで使う。コピーだけ)
#   ./demo/go.sh c 2b  プロンプト 2b をクリップボードへ (次のプロンプト用)
set -e
cd "$(dirname "$0")/.."
P=demo/prompts

copy() { pbcopy < "$P/$1.txt"; echo "📋 [$1] $(cat "$P/$1.txt")"; }
show() { for k in "$@"; do echo "   [$k] $(cat "$P/$k.txt")"; done; }
start() { echo; echo "→ claude を起動します。⌘V → Enter"; sleep 1; exec claude; }

case "$1" in
  1)  ./demo/reset.sh d1; copy 1; start ;;
  2)  ./demo/reset.sh d2; copy 2a; echo "   次: ./demo/go.sh c 2b"; show 2b; start ;;
  3)  ./demo/reset.sh d2; copy 3; echo "   ※ 起動したら Shift+Tab で plan mode"; start ;;
  3p) ./demo/reset.sh d3 | grep -v '^ターミナル'
      ROOT=$(git rev-parse --show-toplevel); PFX=$(git rev-parse --show-prefix)
      for t in T1 T2; do
        osascript -e "tell application \"Terminal\" to do script \"cd '$ROOT/.worktrees/$t/$PFX' && claude\"" >/dev/null
      done
      copy 3p1; echo "   T2 用: ./demo/go.sh c 3p2" ;;
  4)  ./demo/reset.sh d4; copy 4a; start ;;
  4b) ./demo/reset.sh d4-cook; copy 4b; echo "   → 元の claude に ⌘V" ;;
  5)  ./demo/reset.sh d5; copy 5a; echo "   次: ./demo/go.sh c 5b"; show 5b; start ;;
  6)  copy 6a; echo "   次: ./demo/go.sh c 6b / c 6c"; show 6b 6c ;;
  c)  copy "$2" ;;
  *)  sed -n '2,11p' "$0"; exit 1 ;;
esac
