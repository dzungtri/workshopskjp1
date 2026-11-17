import { DomainError } from '../errors.js';
import { ORDER_STATUS, transition } from '../orders/order-status.js';

export const RETURN_WINDOW_DAYS = 8; // BR-09: 受取日から8日以内
const DAY_MS = 24 * 60 * 60 * 1000;
// 暫定実装: 受取時刻からの経過時間で判定 (タイムゾーンの扱いは TBD-01)
const RETURN_WINDOW_MS = RETURN_WINDOW_DAYS * DAY_MS;

const REFUNDABLE = new Set(['unopened', 'defective']); // BR-10
const CONDITIONS = new Set(['unopened', 'opened', 'used', 'defective']);

export function isWithinReturnWindow(receivedAt, now) {
  return Date.parse(now) - Date.parse(receivedAt) <= RETURN_WINDOW_MS;
}

function returnedQty(order, sku) {
  return order.returns
    .flatMap((r) => r.lines)
    .filter((l) => l.sku === sku)
    .reduce((sum, l) => sum + l.qty, 0);
}

function validateItem(order, { sku, qty, condition }) {
  const line = order.lines.find((l) => l.sku === sku);
  if (!line) throw new DomainError('UNKNOWN_LINE', `${sku} is not in ${order.id}`);
  if (!Number.isInteger(qty) || qty < 1) throw new DomainError('INVALID_QTY', `${sku}: bad qty`);
  if (qty + returnedQty(order, sku) > line.qty) {
    throw new DomainError('RETURN_QTY_EXCEEDED', `${sku}: more than purchased`);
  }
  if (!CONDITIONS.has(condition)) throw new DomainError('INVALID_CONDITION', `${sku}: ${condition}`);
  if (!REFUNDABLE.has(condition)) {
    throw new DomainError('NOT_REFUNDABLE', `${sku}: opened/used items cannot be refunded`);
  }
}

export function createReturnService({ clock }) {
  let seq = 0;
  const RETURNABLE = [ORDER_STATUS.RECEIVED, ORDER_STATUS.RETURN_REQUESTED, ORDER_STATUS.REFUNDED];

  return {
    // items: [{ sku, qty, condition: 'unopened' | 'opened' | 'used' | 'defective' }]
    requestReturn(order, items) {
      const now = clock();
      if (!RETURNABLE.includes(order.status)) {
        throw new DomainError('NOT_RETURNABLE_STATUS', `${order.id} is ${order.status}`);
      }
      if (!isWithinReturnWindow(order.receivedAt, now)) {
        throw new DomainError('RETURN_WINDOW_EXPIRED', `${order.id}: over ${RETURN_WINDOW_DAYS} days`);
      }
      if (items.length === 0) throw new DomainError('EMPTY_RETURN', 'no items');
      for (const item of items) validateItem(order, item);

      const ret = {
        id: `RET-${++seq}`,
        orderId: order.id,
        lines: items.map(({ sku, qty, condition }) => ({ sku, qty, condition })),
        status: '申請中',
        requestedAt: now,
      };
      order.returns.push(ret);
      if (order.status !== ORDER_STATUS.RETURN_REQUESTED) {
        transition(order, ORDER_STATUS.RETURN_REQUESTED, now);
      }
      return ret;
    },
  };
}
