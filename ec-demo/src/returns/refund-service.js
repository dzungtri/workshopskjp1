import { DomainError } from '../errors.js';
import { ORDER_STATUS, transition } from '../orders/order-status.js';
import { calcRefundAmount } from './refund-calc.js';

// 返金サービス。同じ返品に対して返金は1回だけ (冪等, BR-13)
export function createRefundService({ gateway, clock }) {
  const completed = new Map(); // idempotencyKey -> 返金結果

  return {
    refund(order, ret) {
      const key = `refund:${ret.id}`; // 冪等キー = 返品ID
      if (completed.has(key)) return completed.get(key);

      const amount = calcRefundAmount(order, ret.lines);
      if (order.refundedTotal + amount > order.total) {
        throw new DomainError('REFUND_EXCEEDS_PAID', `${order.id}: refund > paid`); // BR-14
      }

      const res = gateway.refund({ paymentId: order.paymentId, amount, idempotencyKey: key });
      if (!res.ok) throw new DomainError('REFUND_FAILED', res.reason);

      order.refundedTotal += amount;
      ret.status = '返金済';
      if (order.status === ORDER_STATUS.RETURN_REQUESTED) {
        transition(order, ORDER_STATUS.REFUNDED, clock());
      }

      const result = { refundId: res.refundId, returnId: ret.id, amount, at: clock() };
      completed.set(key, result);
      return result;
    },
  };
}
