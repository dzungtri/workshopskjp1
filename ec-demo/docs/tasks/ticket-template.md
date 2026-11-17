# チケットテンプレート (Ticket template for agents)

> エージェント1回分 (1セッション・1PR) で終わる大きさに切ること。目安: 変更ファイル 1〜3、差分 200行以内。

## ID / タイトル (Title)
`T-xx: 〇〇を△△する`

## 目的 (Goal)
何を・なぜ。1〜3行。関係する業務ルールID (例: BR-09)。

## 背景・参照 (Context)
- 読むべきファイル: `docs/business-rules.md` の BR-xx, `src/...`
- 既存の似た実装: `src/...`

## 変更してよいファイル (Files allowed to touch)
- `src/...`
- `test/...`
- それ以外は変更しない。必要になったら止まって質問する

## 変更してはいけないもの (Do not touch)
- `src/payment/`, `docs/business-rules.md`, `test/golden/*.json`, 既存テストの期待値

## 受け入れ条件 (Acceptance criteria) — 実行可能なコマンドで書く
- [ ] `node --test test/xxx.test.js` が pass
- [ ] `npm test` が全て pass
- [ ] `npm run lint` が pass
- [ ] `test -z "$(git diff --name-only main -- . ':!src/xxx.js' ':!test/xxx.test.js')"` (許可ファイル以外を変更していない)

## 依存 (Depends on)
- なし / T-xx

## 並列実行 (Parallel)
- 可 / 不可。可なら `git worktree add ../ec-demo-T-xx -b feat/T-xx main`

## 未決定事項 (Open questions / TBD)
- 該当する TBD-xx があれば記載。**エージェントは推測せず質問すること**

## 完了報告 (Report back)
- 変更ファイル一覧、テスト結果、判断したこと・迷ったこと
