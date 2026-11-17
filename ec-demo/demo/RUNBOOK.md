# DEMO RUNBOOK (コピペ用)

`cd workshop/ec-demo` · 各デモの前に reset。

## ① バグ修正 — 6分
```
./demo/reset.sh d1 && claude
```
```
返品期限（受取から8日）を過ぎても返金されてしまいます。原因を調べて直してください。
```

## ② ガードレール — 6分
```
./demo/reset.sh d2 && claude
```
A: 未決定ルール → 止まって質問する
```
決済が失敗したら、3回までリトライするようにしてください。
```
B: hook がブロックする
```
src/payment/fake-gateway.js の charge() に、呼び出しログを追加してください。
```
最後に: `cat .claude/settings.json`

## ③ チケット分解 + 並列 — 6分
```
./demo/reset.sh d2 && claude
```
Shift+Tab (plan mode):
```
返品に「返品理由（不良品・サイズ違い・その他）」を追加したい。docs/tasks/ticket-template.md の形でチケットに分けて、依存関係も書いて。まだ実装しないで。
```
並列 (ターミナル2つ):
```
./demo/reset.sh d3
```
表示された `cd … && claude` をそれぞれ実行して:
```
demo/tickets/T1.md のチケットを実装してください。
```
```
demo/tickets/T2.md のチケットを実装してください。
```

## ④ Spec first (Spec Kit + GitHub) — 6分
```
./demo/reset.sh d4 && claude
```
```
/speckit-specify 返品申請に「返品理由」を追加したい。理由は 不良品・サイズ違い・イメージ違い・その他。理由によって返金のルールが変わる可能性がある。
```
(約1.5分 · spec.md の Given/When/Then と NEEDS CLARIFICATION を見せる)

料理番組: 準備した plan / tasks に切り替え (別ターミナル):
```
./demo/reset.sh d4-cook
```
```
specs/001-return-reason/tasks.md の Phase 1〜2 のタスクを、GitHub MCP で dzungtri/workshopskjp1 に issue として作ってください。タイトルにタスクID、本文に関係する User Story / FR を書いて。
```

## ⑤ AIレビュー — 4分
```
./demo/reset.sh d5 && npm test && claude
```
```
main との差分をレビューしてください。docs/review-checklist.md を使って、マージしてよいか判断して。
```
```
二重返金を再現する、失敗するテストを先に書いて。そのあと直して。
```

## ⑥ Context — 4分 (⑤ のセッションを続ける)
```
/context
```
```
subagent を使って、返金処理がどこから呼ばれているか調べて、要点だけ教えて。
```
```
/compact 業務ルールのIDと、失敗したテスト名は残して
```

## 終わったら
```
./demo/reset.sh clean
```
