# Quickstart: 返品理由の検証手順

**Feature**: `001-return-reason` | **Contract**: [contracts/return-service.md](./contracts/return-service.md)

## 前提

- Node.js 20 以上。`npm install` 不要 (依存なし)
- リポジトリのルートで実行する

## 1. 既存の挙動が壊れていないこと (FR-006 / SC-003)

```bash
node --test test/golden.test.js test/refunds.test.js test/returns.test.js
```

期待: すべて pass。これらのテストファイルと `test/golden/*.json` は **変更されていない** こと:

```bash
git diff --stat main -- test/golden test/golden.test.js test/refunds.test.js test/returns.test.js test/helpers.js
# 出力が空であること
```

## 2. 返品理由のテスト (新規ファイル)

```bash
node --test test/return-reason.test.js
```

期待: 以下のシナリオがすべて pass

| シナリオ | spec 対応 | 期待結果 |
|----------|-----------|----------|
| 理由「サイズ違い」・未開封で申請 | US1-1, FR-004 | 受付。`ret.reason === 'wrong_size'` |
| 理由なしで申請 | US1-2, FR-001, FR-005 | `REASON_REQUIRED`。`order` 不変 |
| 4値以外の理由 | US1-3, FR-002, FR-005 | `INVALID_REASON`。`order` 不変 |
| 「その他」+ コメント | US1-4, FR-003 | 理由とコメントが記録される |
| コメント 500 文字ちょうど / 501 文字 | Edge, FR-003 | 受付 / `COMMENT_TOO_LONG` |
| 理由を変えて同じ商品を返金 | US1-5, FR-006 | 返金額が理由に関係なく同じ (BR-12) |
| 理由「不良品」・状態「不良品」 | US2-1 | 受付・返金可 (BR-10) |
| 理由「イメージ違い」・状態「開封済」 | US2-2 | `NOT_REFUNDABLE` (BR-10) |
| 異なる理由で部分返品を2回 → 3回目で超過 | Edge, BR-11 | 3回目は `RETURN_QTY_EXCEEDED` |
| 理由「不良品」でも期限切れ | Edge, BR-09 | `RETURN_WINDOW_EXPIRED` |
| 同じ返品を2回返金 | Edge, BR-13 | 2回目は同じ結果、`gateway.refunds.length === 1` |
| 旧経路 `requestReturn` (理由なし) の返金 | FR-009 | 返金できる。`ret.reason === null` |

**PO回答待ちのため含めないもの**: US2-3 (理由と状態の食い違い), US3 (理由別返金ルール)

## 3. 全体チェック (CLAUDE.md)

```bash
npm test && npm run lint
```

期待: すべて pass、`lint ok: N files`

## 4. CLI デモ

```bash
npm run demo
```

期待: 返品申請の出力に返品理由が表示され、返金額は従来と同じ
