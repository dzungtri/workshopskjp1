# ec-demo Constitution (架空ECサイト)

## 原則
1. **業務ルールは人が決める**: `docs/business-rules.md` が正。未決定 (TBD) は推測せず `[NEEDS CLARIFICATION]` にする
2. **金額は整数の円**: float を使わない。端数処理は business-rules に従う
3. **テストは Spec から作る (V-Model)**: 各要件 (FR-xxx) と受入シナリオ (Given/When/Then) に対応するテストを先に書く
4. **小さく**: 1タスク = 1 PR = 変更ファイル 1〜3
5. **依存パッケージを増やさない**: Node.js 標準のみ (node --test)

## ガバナンス
- spec.md と business-rules.md の変更は人がレビューする
