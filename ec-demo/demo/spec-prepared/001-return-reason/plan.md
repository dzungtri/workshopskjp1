# Implementation Plan: 返品理由 (Return Reason) の追加

**Branch**: `001-return-reason` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-return-reason/spec.md`

> ## ⚠️ PO確認待ち
>
> spec.md の NEEDS CLARIFICATION 3件は、指示により **暫定で選択肢 A を採用** して計画している。PO の回答で変わる可能性がある。
>
> | # | 論点 | 暫定対応 | 状態 |
> |---|------|----------|------|
> | Q-1 | 理由別の返金ルール (US3) | **A: 理由は記録のみ。返金ルールは変えない** | PO確認待ち |
> | Q-2 | 理由「不良品」と状態「不良品」の関係 (US2-3) | **A は採用しない**。返金可否は従来どおり状態のみで判定 (下記) | PO確認待ち + 要ユーザー確認 |
> | Q-3 | 理由の単位 | **A: 申請ごとに1つ** | PO確認待ち |
> | Q-4 | FR-001 (理由必須) と既存テストの両立 | 新入口 `submitReturn` を追加 (research.md R-04) | **要ユーザー/人間確認 (実装前)** |
> | Q-5 | 返品理由の BR-xx 採番 | 採番なし。コメントは spec の FR-xxx を参照 | PO確認待ち |
>
> **Q-2 について**: Q-2 の選択肢 A (「理由が不良品なら状態も不良品とみなす」) は、理由「不良品」・状態「開封済」の申請を **返金可能に変えてしまう**。これは BR-10 (人間決定)・FR-006・「返金ルールは変えない」という指示と矛盾するため、CLAUDE.md に従い実装せず報告する。US2 シナリオ3 は期待値が決まるまでテスト・実装しない。
>
> `docs/business-rules.md`・`src/payment/`・`test/golden/*.json`・既存テストは変更しない。

## Summary

返品申請に返品理由 (不良品 / サイズ違い / イメージ違い / その他) と任意の補足コメント (≤500文字) を記録する。既存の `src/returns/return-service.js` を拡張し、理由必須の新入口 `submitReturn(order, items, { reason, comment })` を追加する。理由は `Return` に1つ (申請単位) だけ保持し、`ret.lines` の形は変えないので、返金計算 (BR-12〜14) とゴールデンテストは影響を受けない。理由別の返金ルール (US3) と、理由と状態の食い違いの扱い (US2-3) は PO 決定待ちでスコープ外。

## Technical Context

**Language/Version**: Node.js 20+ (ESM, `"type": "module"`)

**Primary Dependencies**: なし (Node.js 標準のみ。constitution 原則5)

**Storage**: なし (インメモリのオブジェクト。`order.returns[]` に `Return` を追加)

**Testing**: `node --test` (`npm test`)、`npm run lint` (`node --check` による構文チェック)

**Target Platform**: Node.js 20 (ワークショップ用デモ、CLI `npm run demo`)

**Project Type**: 単一プロジェクトのライブラリ + CLI デモ

**Performance Goals**: 特になし (同期処理、検証は O(明細数))

**Constraints**: 金額は整数の円 (本機能では金額計算を変更しない)。時刻は `clock()` のみ。既存テスト・ゴールデン期待値を変えない

**Scale/Scope**: 変更ファイル 3〜4 (`src/returns/return-service.js`, 新規 `test/return-reason.test.js`, `src/cli.js`)。返品理由4値・エラーコード4種

暫定で決めた/未解決の事項は上の「PO確認待ち」表と [research.md](./research.md) を参照。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | 原則 | Phase 0 前 | Phase 1 後 | 根拠 |
|---|------|-----------|-----------|------|
| 1 | 業務ルールは人が決める (TBD は推測しない) | ⚠️ 条件付き PASS | ⚠️ 条件付き PASS | NEEDS CLARIFICATION 3件は指示により暫定 A。ただし BR-10 の結果を変える Q-2-A は不採用。US3 / US2-3 は実装しない。TBD-01/02/03 に触れない。`business-rules.md` 変更なし |
| 2 | 金額は整数の円 | PASS | PASS | 金額計算コードの変更なし。返金額が理由に依存しないことをテストで確認 |
| 3 | テストは Spec から作る (V-Model) | PASS | PASS | quickstart.md の表で FR / 受入シナリオ ↔ テストを対応付け。テストを先に書く |
| 4 | 小さく (1タスク = 1PR = 1〜3ファイル) | PASS | PASS | 下記「タスク分割の目安」参照 |
| 5 | 依存パッケージを増やさない | PASS | PASS | 新規依存なし |
| — | CLAUDE.md: payment / business-rules / golden / 既存テストを変更しない | PASS | ⚠️ 要確認 | 変更しない設計 (R-04)。ただし FR-001 を完全には API で強制できないトレードオフあり → Q-4 |
| — | CLAUDE.md: `clock()` 使用 | PASS | PASS | `requestedAt` は既存どおり `clock()` |

**判定**: 計画 (設計成果物) の作成は続行可。**実装 (`/speckit-implement`) の着手前に Q-4 の承認が必要**。Q-1〜Q-3, Q-5 は暫定値のまま実装可能だが、PO 回答で変わった場合は plan を更新する。

## Project Structure

### Documentation (this feature)

```text
specs/001-return-reason/
├── spec.md
├── plan.md              # このファイル
├── research.md          # Phase 0: 暫定決定と未解決事項
├── data-model.md        # Phase 1: Return / ReturnReason
├── quickstart.md        # Phase 1: 検証手順とシナリオ対応表
├── contracts/
│   └── return-service.md  # Phase 1: return-service の公開 API
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks で作成。本コマンドでは作らない)
```

### Source Code (repository root)

```text
src/
├── returns/
│   ├── return-service.js   # 変更: RETURN_REASONS, submitReturn, 理由/コメント検証, reason/comment の記録
│   ├── refund-calc.js      # 変更なし (BR-12)
│   └── refund-service.js   # 変更なし (BR-13, BR-14)
├── payment/                # 変更禁止
└── cli.js                  # 変更: デモを submitReturn + 理由付きに

test/
├── return-reason.test.js   # 新規: quickstart.md のシナリオ
├── returns.test.js         # 変更しない
├── refunds.test.js         # 変更しない
├── golden.test.js          # 変更しない
├── helpers.js              # 変更しない
└── golden/*.json           # 変更禁止
```

**Structure Decision**: 既存の単一プロジェクト構成をそのまま使い、`src/returns/return-service.js` のみを拡張する。理由の定義は小さいため別モジュールに分けず同ファイルに置く (変更ファイル数を最小化)。

### タスク分割の目安 (/speckit-tasks への入力)

1. **T1 (P1)**: `test/return-reason.test.js` に US1 のテストを先に書く (red) → `return-service.js` に `RETURN_REASONS` / `submitReturn` / 検証を実装 (green)。変更 2 ファイル
2. **T2 (P1)**: 不変条件テスト追加 (返金額が理由に非依存、BR-13 冪等、FR-009 旧経路、FR-005 拒否時不変)。変更 1 ファイル
3. **T3 (P2)**: US2 シナリオ1・2 と Edge (期限・部分返品) のテスト。変更 1 ファイル (実装変更は不要の見込み)
4. **T4**: `src/cli.js` のデモを理由付きに。変更 1 ファイル
5. **ブロック中**: US2 シナリオ3 (Q-2)、US3 (Q-1) — PO 回答後に別タスク/別 feature

各タスク後に `npm test && npm run lint`。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 入口が2つ (`submitReturn` と旧 `requestReturn`) | 既存テストを変更せずに FR-001 (理由必須) を満たすため | `requestReturn` を必須化すると既存テストが失敗し、テスト変更には人間承認が必要 (Q-4)。承認されれば入口を1つにできる |
