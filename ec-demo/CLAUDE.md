# CLAUDE.md

架空のECサイト (ワークショップ用デモ)。Node.js 20+ / ESM / 依存パッケージなし。

## コマンド
- テスト: `npm test` (node --test。install 不要)
- Lint: `npm run lint`
- 1ファイルだけ: `node --test test/returns.test.js`

## ルール (必ず守る)
- 金額は常に **整数の円 (integer JPY)**。float・`toFixed` 禁止。端数処理は `docs/business-rules.md` に従う
- 現在時刻は `clock()` から取得する。`Date.now()` / `new Date()` を直接使わない
- 業務ルールは `docs/business-rules.md` が正。コメントに BR-xx の ID を書く
- 変更後は `npm test` と `npm run lint` を実行し、結果を報告する

## 人間の承認が必要 (Do not modify without human approval)
- `src/payment/` と `docs/business-rules.md` は変更しない (hook でもブロックされる)
- `test/golden/*.json` の期待値は人間承認済み。変更しない
- **テストを編集・削除・skip してテストを通さない。** テストが間違っていると思ったら止まって質問する

## 判断に迷ったら
- `docs/business-rules.md` で **未決定 (TBD)** のルールに触れる場合は、推測で実装せず止まって質問する
- 「決定者: 人間」のルールと矛盾する実装を見つけたら、直さずに報告する

## 作業の進め方
- 小さく変更し、1変更ごとにテストを回す
- バグ修正は「失敗するテストを先に書く → 修正 → 全テスト green」
- タスク票の形式: `docs/tasks/ticket-template.md`
