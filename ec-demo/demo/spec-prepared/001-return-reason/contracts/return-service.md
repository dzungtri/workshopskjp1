# Contract: `src/returns/return-service.js` (公開 API)

**Feature**: `001-return-reason` | **Data model**: [../data-model.md](../data-model.md)

> ⚠️ `submitReturn` の追加は research.md R-04 の **提案** (要ユーザー/人間確認)。承認されない場合はこの契約を見直す。

## エクスポート (追加)

```js
export const RETURN_REASONS;       // 凍結オブジェクト: { defective: '不良品', wrong_size: 'サイズ違い', not_as_expected: 'イメージ違い', other: 'その他' }
export const MAX_COMMENT_LENGTH;   // 500
```

## `createReturnService({ clock })` が返すオブジェクト

### `submitReturn(order, items, { reason, comment })` — 新規 (購入者の申請経路)

- **入力**
  - `items`: `[{ sku, qty, condition }]` (既存と同じ)
  - `reason`: `'defective' | 'wrong_size' | 'not_as_expected' | 'other'` (必須)
  - `comment`: `string` (任意、≤ 500 文字)
- **成功時**: `Return` を返す。`ret.reason === reason`, `ret.comment === comment ?? null`。`order.returns` に追加され、必要なら `order.status` が `返品申請` に遷移
- **失敗時**: `DomainError` を throw。`order` は変更されない

| 条件 | `code` |
|------|--------|
| 既存の全エラー | 既存どおり (`requestReturn` と同じ) |
| `reason` が未指定 / `null` / `''`、または第3引数自体がない | `REASON_REQUIRED` |
| `reason` が4値以外 (日本語表示名 `'不良品'` 等も含む) | `INVALID_REASON` |
| `comment` が文字列でも `undefined`/`null` でもない | `INVALID_COMMENT` |
| `comment` が 500 コードポイント超 | `COMMENT_TOO_LONG` |

### `requestReturn(order, items)` — 既存 (挙動変更なし)

- 既存の入出力・エラーはそのまま。戻り値に `reason: null`, `comment: null` が **追加される** のみ
- 本機能リリース前の経路・既存テスト用。新規の購入者申請では使わない (R-04 のリスク参照)

## 不変条件 (テストで確認する)

- `calcRefundAmount(order, ret.lines)` / `refund(order, ret)` の結果は `reason` に依存しない (FR-006, SC-003)
- `test/golden/*.json` の期待値はすべてそのまま通る
- 理由・コメントの検証エラーで `order.returns.length`・`order.status`・`order.refundedTotal`・在庫・`gateway.refunds` は変化しない (FR-005)
