#!/bin/bash
# デモの準備 / リセット (ec-demo/ の中だけを触る。slides/ には影響しない)
#   ./demo/reset.sh d1       ① バグ修正 (agent loop)        → branch demo/d1 (main + バグ patch)
#   ./demo/reset.sh d2       ② ガードレール (TBD / hook)     → main
#   ./demo/reset.sh d3       ③ チケット分解 + worktree ×2    → main + .worktrees/T1 T2
#   ./demo/reset.sh d4       ④ Spec first (Spec Kit)         → main
#   ./demo/reset.sh d4-cook  ④ 「準備しておいた」spec / plan / tasks を specs/ にコピー
#   ./demo/reset.sh d5       ⑤ AIレビュー (二重返金)        → branch demo/d5 (main + バグ patch)
#   ./demo/reset.sh clean    片付け
# ec-demo/ の未コミットの変更は消さずに `git stash` に退避します ("reset.sh backup")。
#   戻すとき: git stash list → git stash pop stash@{N}
set -e
cd "$(dirname "$0")/.."
ROOT=$(git rev-parse --show-toplevel)
PREFIX=$(git rev-parse --show-prefix); PREFIX=${PREFIX%/}

# ---- 片付け ----
for t in "$ROOT/.worktrees/T1" "$ROOT/.worktrees/T2"; do [ -d "$t" ] && git worktree remove --force "$t"; done
git worktree prune
if [ -n "$(git status --porcelain -- .)" ]; then
  git stash push -q -u -m "reset.sh backup $(date +%H:%M:%S)" -- . && echo "(未コミットの変更を stash に退避: git stash list)"
fi
cur=$(git branch --show-current)
if [[ "$cur" == demo/* || "$cur" == feat/* || "$cur" =~ ^[0-9]{3}- ]]; then git checkout -q main; fi
for b in $(git for-each-ref --format='%(refname:short)' refs/heads/ | grep -E '^(demo/|feat/T|[0-9]{3}-)' || true); do
  git branch -q -D "$b"
done

bug_branch() {  # $1=branch $2=patch-name $3=commit-message-file
  git checkout -q -b "$1" main
  git apply --directory="$PREFIX" "demo/patches/$2.patch"
  git commit -q -m "$(cat "demo/patches/$3.msg")" -- .
}

case "$1" in
  d1) bug_branch demo/d1 d1-bug-return-window d1 ;;
  d5) bug_branch demo/d5 d4-bug-double-refund d4 ;;
  d3)
    git worktree add -q "$ROOT/.worktrees/T1" -b feat/T1 main
    git worktree add -q "$ROOT/.worktrees/T2" -b feat/T2 main
    echo "ターミナル1: cd $ROOT/.worktrees/T1/$PREFIX && claude   → demo/tickets/T1.md"
    echo "ターミナル2: cd $ROOT/.worktrees/T2/$PREFIX && claude   → demo/tickets/T2.md" ;;
  d4-cook)
    mkdir -p specs/001-return-reason
    cp -R demo/spec-prepared/001-return-reason/. specs/001-return-reason/
    echo "cooked: specs/001-return-reason/ (spec.md · plan.md · tasks.md)" ;;
  d2|d4|clean|"") ;;
  *) echo "usage: $0 d1|d2|d3|d4|d4-cook|d5|clean"; exit 1 ;;
esac
echo "ready: $(git branch --show-current) — $(node --test test/*.test.js 2>&1 | grep -E '^ℹ (pass|fail)' | tr '\n' ' ')"
