# Data Model: 返品理由 (Return Reason)

**Feature**: `001-return-reason` | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md)

> ⚠️ **PO確認待ち**: 理由の単位 (申請ごと) と、理由と商品状態の関係 (判定は状態のみ) は暫定。research.md Q-2 / Q-3 参照。

## ReturnReason (新規・値オブジェクト)

| コード | 表示名 | 備考 |
|--------|--------|------|
| `defective` | 不良品 | 商品状態 `condition: 'defective'` とは **別の項目**。返金可否には使わない (暫定) |
| `wrong_size` | サイズ違い | |
| `not_as_expected` | イメージ違い | |
| `other` | その他 | |
| `null` | 未設定 | 本機能リリース前の申請・旧経路 `requestReturn` のみ。新入口では指定不可 |

- 選択肢は固定。追加・変更は PO 承認を要する (spec Assumptions)

## Return (返品申請) — 既存エンティティの拡張

| フィールド | 型 | 既存/新規 | ルール |
|------------|-----|-----------|--------|
| `id` | string `RET-<n>` | 既存 | BR-15 |
| `orderId` | string | 既存 | |
| `lines` | `ReturnLine[]` | 既存 (**形は変えない**) | `calcRefundAmount` の入力。FR-006 |
| `status` | `'申請中' \| '返金済'` | 既存 | |
| `requestedAt` | ISO string | 既存 | `clock()` から取得 |
| `reason` | `ReturnReasonCode \| null` | **新規** | 新入口では必須・4値のみ (FR-001, FR-002)。旧データ/旧経路は `null` (FR-009) |
| `comment` | `string \| null` | **新規** | 任意。最大 500 文字 (コードポイント数)。未指定は `null` (FR-003) |

### ReturnLine (既存・変更なし)

| フィールド | 型 | ルール |
|------------|-----|--------|
| `sku` | string | 注文明細に存在すること |
| `qty` | 正の整数 | 累計で購入数以下 (BR-11)。**理由に関係なく合算** |
| `condition` | `'unopened' \| 'opened' \| 'used' \| 'defective'` | 返金可否は `unopened` / `defective` のみ可 (BR-10)。**理由では上書きしない** |

## 検証ルール (受付時)

順序は research.md R-06。いずれかで失敗したら例外を投げ、`order` (状態・`returns`) は変更しない (FR-005)。

1. 注文状態が返品可能 → `NOT_RETURNABLE_STATUS` (既存)
2. 返品期限内 → `RETURN_WINDOW_EXPIRED` (既存, BR-09)
3. 明細が空でない → `EMPTY_RETURN` (既存)
4. 各明細: `UNKNOWN_LINE` / `INVALID_QTY` / `RETURN_QTY_EXCEEDED` / `INVALID_CONDITION` / `NOT_REFUNDABLE` (既存, BR-10, BR-11)
5. **新入口のみ** 理由: 未指定 (`undefined` / `null` / `''`) → `REASON_REQUIRED`、4値以外 → `INVALID_REASON`
6. **新入口のみ** コメント: 文字列以外 → `INVALID_COMMENT`、500 文字超 → `COMMENT_TOO_LONG`

## 状態遷移

変更なし。BR-02 の 受取済 → 返品申請 → 返金済 (および 返金済 → 返品申請 の再申請) をそのまま使う。理由は遷移に影響しない。

## 返金との関係

- `refund(order, ret)` は `ret.lines` のみを使う。`reason` / `comment` は参照しない (暫定 A, research.md R-01)
- 冪等キーは `refund:<返品ID>` のまま (BR-13)。理由が違っても同じ返品IDなら二重返金しない
