// 偽の決済ゲートウェイ (外部決済サービスのアダプタ役)
// ⚠ このディレクトリは人間の承認なしに変更しないこと (CLAUDE.md 参照)
import { assertYen } from '../money.js';

export function createFakeGateway({ mode = 'succeed' } = {}) {
  let seq = 0;
  const charges = [];
  const refunds = [];
  const refundsByKey = new Map(); // idempotencyKey -> 結果

  return {
    charges,
    refunds,

    // 'succeed' | 'fail' を切り替えてテスト・デモに使う
    setMode(next) {
      mode = next;
    },

    charge({ orderId, amount }) {
      assertYen(amount, 'charge amount');
      if (mode === 'fail') return { ok: false, reason: 'CARD_DECLINED' };
      const charge = { paymentId: `PAY-${++seq}`, orderId, amount };
      charges.push(charge);
      return { ok: true, paymentId: charge.paymentId };
    },

    // 同じ idempotencyKey なら2回目以降は前回の結果を返す
    refund({ paymentId, amount, idempotencyKey }) {
      assertYen(amount, 'refund amount');
      if (refundsByKey.has(idempotencyKey)) return refundsByKey.get(idempotencyKey);
      if (mode === 'fail') return { ok: false, reason: 'REFUND_DECLINED' };
      if (!charges.some((c) => c.paymentId === paymentId)) {
        return { ok: false, reason: 'UNKNOWN_PAYMENT' };
      }
      const refund = { ok: true, refundId: `RF-${++seq}`, paymentId, amount };
      refunds.push(refund);
      refundsByKey.set(idempotencyKey, refund);
      return refund;
    },
  };
}
