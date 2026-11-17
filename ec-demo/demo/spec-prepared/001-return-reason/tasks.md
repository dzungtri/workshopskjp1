---

description: "Task list for 001-return-reason (返品理由の追加)"
---

# Tasks: 返品理由 (Return Reason) の追加

**Input**: Design documents from `/specs/001-return-reason/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/return-service.md, quickstart.md

**Tests**: **必須**。constitution 原則3 (V-Model: テストは Spec から先に書く) と CLAUDE.md (バグ修正・変更は失敗するテストを先に書く) に従い、各ストーリーでテストを先に書いて red を確認してから実装する。

**Organization**: ユーザーストーリー単位。US2 シナリオ3 と US3 は PO 回答待ちのため **BLOCKED** タスクとしてのみ記載する。

> ## ⚠️ 実装前ゲート
>
> - **Q-4 (research.md R-04)**: 新入口 `submitReturn` を追加する方針について **ユーザー/人間の承認が必要**。T001 で承認を確認するまで Phase 2 以降に進まない
> - Q-1 / Q-2 / Q-3 / Q-5 は暫定値 (plan.md「PO確認待ち」表) のまま実装する。PO 回答で変わったら plan.md → tasks.md を更新する

## 全タスク共通の制約 (CLAUDE.md)

- 変更してはいけない: `src/payment/`, `docs/business-rules.md`, `test/golden/*.json`, 既存テスト (`test/returns.test.js`, `test/refunds.test.js`, `test/golden.test.js`, `test/helpers.js` ほか既存 `test/*.test.js`)
- テストを編集・削除・skip して通さない。テストが間違っていると思ったら止まって質問する
- 時刻は `clock()` のみ (`Date.now()` / `new Date()` 禁止)。金額は整数の円 (本機能は金額計算を変更しない)
- コードコメントの根拠 ID: 既存ルールは `BR-xx`、返品理由の新ルールは BR 採番がない (Q-5) ため `spec 001 FR-xxx` と書く
- 各タスク完了後に `npm test && npm run lint` を実行し結果を報告する

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可 (別ファイル・未完了タスクへの依存なし)
- **[Story]**: US1 / US2 / US3

---

## Phase 1: Setup (確認・ベースライン)

**Purpose**: 実装ゲートの確認と、変更前ベースラインの記録

- [ ] T001 Q-4 の承認を確認する: specs/001-return-reason/research.md R-04 の提案 (「理由必須の新入口 `submitReturn(order, items, { reason, comment })` を追加し、既存 `requestReturn(order, items)` は挙動を変えず `reason: null` を記録する旧経路として残す」) をユーザーに提示し、承認を得る。**承認が得られない、または「既存テストを reason 付きに更新する」方針が選ばれた場合はここで止まり、plan.md / contracts/return-service.md の見直しを依頼する**
- [ ] T002 変更前ベースラインを記録する: リポジトリルートで `npm test && npm run lint` を実行し全 pass を確認、`node --test test/golden.test.js test/refunds.test.js test/returns.test.js` の pass 件数をメモする (specs/001-return-reason/quickstart.md §1)

---

## Phase 2: Foundational (全ストーリーの前提)

**Purpose**: 理由の定数と、`requestReturn` / `submitReturn` が共有する内部処理を用意する。既存テストがこのリファクタの安全網になる

**⚠️ CRITICAL**: このフェーズ完了まで US1 以降に着手しない

- [ ] T003 src/returns/return-service.js に定数を追加・export する: `export const RETURN_REASONS = Object.freeze({ defective: '不良品', wrong_size: 'サイズ違い', not_as_expected: 'イメージ違い', other: 'その他' });` と `export const MAX_COMMENT_LENGTH = 500;`。コメントに `// spec 001 FR-002 (返品理由4値。追加・変更は PO 承認が必要)` / `// spec 001 FR-003` を書く。データモデル制約: 「選択肢は固定。追加・変更は PO 承認を要する」。既存の `REFUNDABLE` / `CONDITIONS` (BR-10) には触らない
- [ ] T004 src/returns/return-service.js の `requestReturn` 本体を内部関数 (例: `createReturn(order, items, { reason, comment })`) に切り出し、`requestReturn(order, items)` はそれを `{ reason: null, comment: null }` で呼ぶだけにする。生成する `Return` オブジェクトに `reason` と `comment` フィールドを追加 (旧経路は両方 `null`)。**`lines` の形 (`{ sku, qty, condition }`)・既存エラーコード・チェック順 (状態 → 期限 → 空 → 明細)・`requestedAt = clock()`・状態遷移は一切変えない** (FR-006, FR-009, data-model.md「Return」)。完了後 `npm test && npm run lint` が T002 と同じ件数で全 pass することを確認

**Checkpoint**: 既存テスト全 pass、`requestReturn` の戻り値に `reason: null, comment: null` が付くだけの状態

---

## Phase 3: User Story 1 - 返品申請時に返品理由を選ぶ (Priority: P1) 🎯 MVP

**Goal**: 購入者が `submitReturn` で4種類の理由 (+ 任意コメント) を指定して返品申請でき、理由なし・不正値は `order` を変えずに拒否される。返金額は理由に依存しない

**Independent Test**: `node --test test/return-reason.test.js` の US1 テストが pass。理由付き申請で `ret.reason` / `ret.comment` が記録され、`REASON_REQUIRED` / `INVALID_REASON` / `INVALID_COMMENT` / `COMMENT_TOO_LONG` で拒否時に `order` 不変、返金額が理由間で同一

### Tests for User Story 1 (先に書いて red を確認) ⚠️

> すべて新規ファイル test/return-reason.test.js に追記する (同一ファイルのため [P] なし)。`import { setup, receivedOrder, T0 } from './helpers.js'` と `import { RETURN_REASONS, MAX_COMMENT_LENGTH } from '../src/returns/return-service.js'` を使う。`helpers.js` は変更しない。各 `test()` 名に spec の ID (例: `US1-1 / FR-004`) を入れる

- [ ] T005 [US1] test/return-reason.test.js を新規作成し、US1-1 / FR-004 のテストを書く: `receivedOrder` で受取済注文を作り `setNow` で期限内にして、`ctx.returns.submitReturn(order, [{ sku, qty: 1, condition: 'unopened' }], { reason: 'wrong_size' })` が成功し、`ret.reason === 'wrong_size'`、`ret.comment === null`、`order.returns` に含まれ、`order.status` が返品申請になることを assert
- [ ] T006 [US1] test/return-reason.test.js に US1-2 / FR-001 / FR-005 のテストを追加: 第3引数なし・`{}`・`{ reason: undefined }`・`{ reason: null }`・`{ reason: '' }` のそれぞれで `DomainError` の `code === 'REASON_REQUIRED'`。各ケースで呼び出し前後の `order.returns.length`・`order.status`・`order.refundedTotal`・`ctx.gateway.refunds.length` が不変であることを assert (在庫も `ctx.inventory` の該当 SKU 数量で不変を確認)
- [ ] T007 [US1] test/return-reason.test.js に US1-3 / FR-002 / FR-005 のテストを追加: `reason` が `'broken'`、日本語表示名 `'不良品'`、`'DEFECTIVE'` (大文字)、数値 `1` のとき `code === 'INVALID_REASON'`、`order` 不変 (T006 と同じ観点)
- [ ] T008 [US1] test/return-reason.test.js に US1-4 / FR-003 のテストを追加: `{ reason: 'other', comment: 'サイズ表と違った' }` で `ret.reason === 'other'` かつ `ret.comment === 'サイズ表と違った'`。他の理由 (`'wrong_size'`) でもコメントが記録されること、`comment: ''` は `''` のまま記録、`comment` 未指定/`null` は `null` で記録されることを assert (research.md R-05)
- [ ] T009 [US1] test/return-reason.test.js に Edge / FR-003 のコメント長テストを追加: `'あ'.repeat(500)` は受付、`'あ'.repeat(501)` は `COMMENT_TOO_LONG`、絵文字 `'😀'.repeat(500)` (UTF-16 長 1000 だがコードポイント 500) は受付、`'😀'.repeat(501)` は `COMMENT_TOO_LONG`。`comment` が数値 `123` / オブジェクトのとき `INVALID_COMMENT`。拒否時は `order` 不変
- [ ] T010 [US1] test/return-reason.test.js に US1-5 / FR-006 / SC-003 のテストを追加: 同じ注文内容で `setup()` を4回作り、4種類の理由それぞれで同じ商品・数量を `submitReturn` → `ctx.refunds.refund(order, ret)` し、返金額がすべて等しく、`requestReturn` (理由なし) で返品・返金した場合の額とも等しいことを assert (BR-12)。金額比較は整数の `===` で行う
- [ ] T011 [US1] test/return-reason.test.js に FR-009 のテストを追加: 旧経路 `ctx.returns.requestReturn(order, items)` の戻り値が `reason === null` かつ `comment === null` で、`ctx.refunds.refund(order, ret)` が従来どおり成功することを assert
- [ ] T012 [US1] test/return-reason.test.js に Edge / BR-13 のテストを追加: `submitReturn` で作った同じ返品に `refund` を2回呼び、2回目が1回目と同じ結果を返し `ctx.gateway.refunds.length === 1` であることを assert
- [ ] T013 [US1] `node --test test/return-reason.test.js` を実行し、`submitReturn` 未実装により T005〜T010・T012 が **fail (red)** することを確認・報告する (T011 は T004 により pass してよい)

### Implementation for User Story 1

- [ ] T014 [US1] src/returns/return-service.js の `createReturnService` が返すオブジェクトに `submitReturn(order, items, { reason, comment } = {})` を追加する。T004 の内部関数を使い、検証順は「既存チェック (状態 → 期限 → 空 → 明細) の **後**、`order.returns.push` の **前**」(research.md R-06) とし、次のルールで `DomainError` を throw する (contracts/return-service.md の表どおり):
  - `reason` が `undefined` / `null` / `''` (第3引数なし含む) → `REASON_REQUIRED` (`// spec 001 FR-001`)
  - `reason` が `RETURN_REASONS` のキー以外 (日本語表示名も不可。`Object.hasOwn(RETURN_REASONS, reason)` で判定し、プロトタイプのキーを通さない) → `INVALID_REASON` (`// spec 001 FR-002`)
  - `comment` が `undefined` / `null` / 文字列 以外 → `INVALID_COMMENT`
  - `comment` のコードポイント数 `[...comment].length` が `MAX_COMMENT_LENGTH` (500) 超 → `COMMENT_TOO_LONG` (`// spec 001 FR-003`)
  - 記録: `ret.reason = reason`, `ret.comment = comment ?? null` (空文字はそのまま)
  - 全検証通過まで `order` を一切変更しない (`// spec 001 FR-005`)。返金関連ファイル (src/returns/refund-calc.js, src/returns/refund-service.js) は変更しない
- [ ] T015 [US1] `npm test && npm run lint` を実行し、test/return-reason.test.js 含め全テスト pass を確認・報告する。あわせて `git diff --stat main -- test/golden test/golden.test.js test/refunds.test.js test/returns.test.js test/helpers.js src/payment docs/business-rules.md` の出力が空であることを確認する

**Checkpoint**: US1 単独で完了 (MVP)。理由の記録・必須化・不正値拒否が動き、返金額・既存テストに影響なし

---

## Phase 4: User Story 2 - 返品理由と商品状態の整合性チェック (Priority: P2)

**Goal**: 理由「不良品」と商品状態 `condition` を別項目として扱い、返金可否は従来どおり `condition` のみで判定されることをテストで固定する (research.md R-02。暫定)

**Independent Test**: `node --test test/return-reason.test.js` の US2 / Edge テストが pass。実装変更は不要の見込み (fail した場合は実装を直す前に止まって報告する)

**依存**: US1 の `submitReturn` (T014) を使う

### Tests for User Story 2

- [ ] T016 [US2] test/return-reason.test.js に US2-1 のテストを追加: `submitReturn(order, [{ sku, qty: 1, condition: 'defective' }], { reason: 'defective' })` が受付され、`refund` で返金されること (BR-10)。`ret.reason === 'defective'` と `ret.lines[0].condition === 'defective'` が別フィールドとして記録されることも assert
- [ ] T017 [US2] test/return-reason.test.js に US2-2 のテストを追加: `{ reason: 'not_as_expected' }` + `condition: 'opened'` で `code === 'NOT_REFUNDABLE'` (BR-10)、`order` 不変
- [ ] T018 [US2] test/return-reason.test.js に Edge / BR-11 のテストを追加: 購入数 3 の商品を理由 `'wrong_size'` で qty 1、理由 `'not_as_expected'` で qty 2 の2回に分けて `submitReturn` → 両方受付。3回目 (理由 `'defective'`, qty 1) は `RETURN_QTY_EXCEEDED` (数量上限は理由に関係なく合算)。購入数は helpers の `receivedOrder` に渡す `lines` で設定する
- [ ] T019 [US2] test/return-reason.test.js に Edge / BR-09 のテストを追加: `setNow` で受取 (T0) から8日を超えた時刻にし、`{ reason: 'defective' }` + `condition: 'defective'` でも `RETURN_WINDOW_EXPIRED`。期限判定は既存の `isWithinReturnWindow` に任せ、境界値は既存 test/returns.test.js と同じ考え方で設定する (TBD-01 には触れない)
- [ ] T020 [US2] `npm test && npm run lint` を実行し全 pass を確認・報告する。**いずれかが fail した場合は src/returns/return-service.js の判定ロジック (BR-10/BR-11/BR-09) を変更せず、止まって報告する**
- [ ] T021 [US2] ⛔ BLOCKED (Q-2 / PO回答待ち) US2 シナリオ3 (理由と状態の食い違い: 理由「不良品」・状態「開封済」、理由「サイズ違い」・状態「不良品」) のテストと実装を test/return-reason.test.js と src/returns/return-service.js に追加する。**PO が A/B/C を決定し期待値が決まるまで着手しない。** 選択肢 A は BR-10 (人間決定) の判定結果を変えるため、選ばれた場合も `docs/business-rules.md` の更新・承認が先 (research.md R-02)

**Checkpoint**: US1 + US2 (シナリオ1・2・Edge) が pass。シナリオ3 はブロック中として明示

---

## Phase 5: User Story 3 - 返品理由によって返金ルールを変える (Priority: P3)

**Goal**: PO 決定済みの理由別返金ルールを適用する

**状態**: ⛔ **本 feature のスコープ外** (research.md R-01, 暫定 A: 理由は記録のみ)

- [ ] T022 [US3] ⛔ BLOCKED (Q-1 / PO回答待ち) 理由別返金ルールを src/returns/refund-calc.js 等に実装する。**着手条件**: PO が理由別ルールを `docs/business-rules.md` に BR-xx として採番・承認し (FR-010)、人間承認済みのゴールデン期待値 (`test/golden/*.json`) が用意されていること。満たされたら別 feature として `/speckit-specify` → `/speckit-plan` から起こす。本 feature では何も変更しない

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T023 [P] src/cli.js のデモを `returns.requestReturn(order, [...])` から `returns.submitReturn(order, [{ sku: 'MUG-002', qty: 1, condition: 'unopened' }], { reason: 'wrong_size' })` に変更し、返品申請の出力に `RETURN_REASONS[ret.reason]` (表示名) を表示する。返金額の表示は変えない。`npm run demo` で理由が表示され、返金額が変更前と同じであることを確認 (quickstart.md §4)。T014 完了後なら US2 テスト (T016〜T019) と並列で実施可
- [ ] T024 specs/001-return-reason/quickstart.md の §1〜§4 を順に実行し、すべて期待どおりであることを確認・報告する (特に §1 の `git diff --stat main -- test/golden ...` が空)
- [ ] T025 最終確認として `npm test && npm run lint` を実行し結果を報告する。あわせて未解決事項 Q-1 (理由別返金ルール)・Q-2 (理由と状態の関係)・Q-3 (理由の単位, 暫定: 申請ごと)・Q-5 (BR 採番) と、R-04 のリスク (`requestReturn` 経由なら理由なし申請が作れる) を PR 説明に記載する

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: T001 (Q-4 承認) が **全体のゲート**。T002 は T001 と独立
- **Phase 2 (Foundational)**: T001 承認後。T003 → T004 (同一ファイル)。US1 以降をブロック
- **Phase 3 (US1)**: Phase 2 完了後。テスト T005〜T012 → red 確認 T013 → 実装 T014 → T015
- **Phase 4 (US2)**: T014 (`submitReturn`) に依存。T016〜T019 → T020。T021 は Q-2 待ち
- **Phase 5 (US3)**: Q-1 待ち。本 feature では実施しない
- **Phase 6 (Polish)**: T023 は T014 以降いつでも。T024・T025 は全実施タスク完了後

### User Story Dependencies

- **US1 (P1)**: Phase 2 のみに依存。単独でリリース可能 (MVP)
- **US2 (P2)**: US1 の `submitReturn` を使う (判定ロジック自体は既存 BR-10/11/09 のまま)。テストのみ追加
- **US3 (P3)**: ブロック中 (PO 決定 + business-rules 承認が必要)

### Within Each User Story

- テストを先に書き、fail を確認してから実装 (constitution 原則3)
- 1タスク = 変更ファイル 1〜3 (constitution 原則4)。各タスク後に `npm test && npm run lint`

### Parallel Opportunities

- T002 (ベースライン実行) は T001 の承認待ちの間に実施可
- T023 (src/cli.js) は T014 完了後、US2 テスト (test/return-reason.test.js) と別ファイルなので並列可
- それ以外のテストはすべて test/return-reason.test.js、実装はすべて src/returns/return-service.js に集中するため、同一ファイル競合を避けて **逐次** 実行する

---

## Parallel Example

```bash
# T014 (submitReturn 実装) 完了後に並列で実行できる:
Task: "T016-T019 US2 のテストを test/return-reason.test.js に追加"
Task: "T023 src/cli.js のデモを submitReturn + 理由表示に変更"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001: Q-4 の承認を得る (得られなければ停止)
2. T002: ベースライン記録
3. Phase 2: 定数追加と内部関数への切り出し (既存テストで安全確認)
4. Phase 3: US1 のテスト (red) → `submitReturn` 実装 (green)
5. **STOP and VALIDATE**: `npm test && npm run lint`、保護ファイルの diff が空であること

### Incremental Delivery

1. Setup + Foundational → 既存挙動そのままで `reason: null` が付く
2. US1 → 理由の記録・必須化 (MVP、PR 1本目の目安: T003〜T015)
3. US2 → BR-10/11/09 と理由の関係をテストで固定 (PR 2本目: T016〜T020)
4. Polish → CLI デモ (PR 3本目: T023)
5. US2 シナリオ3・US3 → PO 回答後に別タスク/別 feature

---

## Notes

- [P] = 別ファイル・依存なし
- BLOCKED タスク (T021, T022) は PO 回答まで着手しない。推測で実装しない (CLAUDE.md「判断に迷ったら」)
- 既存テスト・ゴールデン期待値が落ちたら、テストではなく実装を疑う。テストが誤りと思われる場合は止まって質問する
