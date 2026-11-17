# 業務ルール (Business Rules)

> 架空のECサイトのルールです。**このファイルは人間 (PO) の承認なしに変更しないこと。**
> 「決定者」列の意味:
> - **人間 (Human decision)** … ビジネス判断。AIが勝手に決めたり変えたりしてはいけない
> - **実装詳細** … 実装者 (AI含む) が決めてよい
> - **未決定 (TBD – ask PO)** … まだ決まっていない。エージェントは推測で実装せず、**止まって質問する**

## ルール一覧

| ID | 領域 | ルール | 決定者 | 実装箇所 |
|----|------|--------|--------|----------|
| BR-00 | 金額 | 金額はすべて整数の円 (integer JPY)。float は使わない | 人間 (Human decision) | `src/money.js` |
| BR-01 | カート/注文 | 1注文・1商品あたり最大10個。超えたら拒否 (reject) | 人間 (Human decision) | `src/cart.js` |
| BR-02 | 注文 | 状態遷移: 注文済 → 決済済 → 発送済 → 受取済 → 返品申請 → 返金済。決済失敗は 注文済 → キャンセル。それ以外の遷移は例外 | 人間 (Human decision) | `src/orders/order-status.js` |
| BR-03 | 在庫 | 注文時に在庫を引当 (reserve)。決済失敗で解放 (release)、決済成功で確定 (commit) | 人間 (Human decision) | `src/inventory.js` |
| BR-04 | 在庫 | 有効在庫が発注点 (reorder threshold = 5) を下回ったら「要発注 (reorder required)」イベントを出す。通知は下回った時に1回 | 発注点の値: 人間 / 通知方法: 実装詳細 | `src/inventory.js` |
| BR-05 | クーポン | 1注文につきクーポンは1枚まで | 人間 (Human decision) | `src/coupons.js` |
| BR-06 | クーポン | 最低購入金額 (税抜小計で判定)・有効期限あり。定率 (percent) は切り捨て、定額 (fixed) は小計が上限 → 合計はマイナスにならない | 人間 (Human decision) | `src/coupons.js` |
| BR-07 | 税 | 消費税 10% | 人間 (Human decision) | `src/money.js` |
| BR-08 | 税 | **端数処理: 注文合計 (割引後の税抜金額) に対して1回だけ切り捨て (round down)。行ごとには計算しない** | 人間 (Human decision) ※2026-11-10 PO決定 | `src/money.js` |
| BR-09 | 返品 | 受取日から8日以内 (受取時刻 + 8×24時間まで) | 人間 (Human decision) ※境界の扱いは TBD-01 | `src/returns/return-service.js` |
| BR-10 | 返品 | 開封済 (opened)・使用済 (used) は返金不可。ただし不良品 (defective) は可 | 人間 (Human decision) | `src/returns/return-service.js` |
| BR-11 | 返品 | 部分返品 (partial return) 可。複数回に分けてよいが購入数量を超えない | 人間 (Human decision) | `src/returns/return-service.js` |
| BR-12 | 返金 | クーポン利用注文の返金は割引を按分 (prorate)。式は下記 | 人間 (Human decision) | `src/returns/refund-calc.js` |
| BR-13 | 返金 | 返金は冪等 (idempotent)。同じ返品に対して二重返金しない | 人間 (Human decision) | `src/returns/refund-service.js` |
| BR-14 | 返金 | 累計返金額は支払額を超えない。決済側で返金失敗した場合は状態を変えない | 人間 (Human decision) | `src/returns/refund-service.js` |
| BR-15 | 実装 | 冪等キーの形式 (`refund:<返品ID>`)、ID採番、エラーコード名 | 実装詳細 | `src/returns/refund-service.js` |
| BR-16 | 実装 | 「要発注」イベントの保持方法 (配列に積む) | 実装詳細 | `src/inventory.js` |
| TBD-01 | 返品 | 8日目 23:59 に**別タイムゾーン**から申請された場合、期限内か? (JSTの暦日で判定? 経過時間で判定?) 現在は暫定で経過時間判定 | **未決定 (TBD – ask PO)** | — |
| TBD-02 | 返金 | 部分返品を複数回行うと按分の切り上げで合計が支払額より数円少なくなる。最後の返品で差額を調整するか? | **未決定 (TBD – ask PO)** | — |
| TBD-03 | 決済 | 決済失敗後の再決済 (リトライ) を許可するか? 現在はキャンセル扱い | **未決定 (TBD – ask PO)** | — |

## BR-08 消費税の端数処理 (人間による決定)

- 決定: **注文合計に対して切り捨て**。行ごと (per line) ではない
- 例: 198円 + 398円 → 税抜 596円 → 税 floor(59.6) = **59円** (行ごとなら 19 + 39 = 58円)
- 決定者: プロダクトオーナー (架空)、2026-11-10。**AIはこの方針を変更しないこと**

## BR-12 按分返金の計算式 (hard case)

記号: `S` = 注文の税抜小計, `D` = 注文の割引額, `R` = 返品する商品の税抜小計 (Σ 単価 × 返品数)

```
allocatedDiscount = ceil(D × R / S)        … 割引の按分 (切り上げ = 返金を多くしない側)
refundTaxable     = R − allocatedDiscount
refund            = refundTaxable + floor(refundTaxable × 10%)
```

- 全数返品なら `allocatedDiscount = D` となり、返金額 = 支払額 (total) に一致する
- 例 (R-04): S=1194, D=179, R=398 → ceil(59.67)=60 → 338 → 税 33 → **返金 371円**
- 期待値は `test/golden/refunds.json` (人間承認済み) を正とする
- 分割返品時の端数差 → TBD-02
