import { pickSingleCoupon } from '../coupons.js';
import { priceOrder } from './pricing.js';
import { ORDER_STATUS, transition } from './order-status.js';

// 注文サービス。clock() は現在時刻 (ISO 文字列) を返す関数 (テストで固定できる)
export function createOrderService({ catalog, inventory, gateway, clock }) {
  const orders = new Map();
  let seq = 0;

  function reserveAll(lines) {
    const done = [];
    try {
      for (const l of lines) {
        inventory.reserve(l.sku, l.qty);
        done.push(l);
      }
    } catch (err) {
      for (const l of done) inventory.release(l.sku, l.qty); // 途中失敗は全部戻す
      throw err;
    }
  }

  return {
    get: (id) => orders.get(id),

    placeOrder(lines, { coupons = [] } = {}) {
      const now = clock();
      const coupon = pickSingleCoupon(coupons);
      const priced = priceOrder(lines, catalog, coupon, now);
      reserveAll(priced.lines);

      const order = {
        id: `ORD-${++seq}`,
        ...priced,
        couponCode: coupon?.code ?? null,
        status: ORDER_STATUS.PLACED,
        createdAt: now,
        history: [],
        returns: [],
        refundedTotal: 0,
      };
      orders.set(order.id, order);
      return order;
    },

    // 決済成功 → 決済済 + 在庫確定 / 失敗 → キャンセル + 引当解放 (BR-03, BR-02)
    pay(order) {
      const result = gateway.charge({ orderId: order.id, amount: order.total });
      if (!result.ok) {
        for (const l of order.lines) inventory.release(l.sku, l.qty);
        transition(order, ORDER_STATUS.CANCELLED, clock());
        return result;
      }
      transition(order, ORDER_STATUS.PAID, clock());
      for (const l of order.lines) inventory.commit(l.sku, l.qty);
      order.paymentId = result.paymentId;
      return result;
    },

    ship(order) {
      transition(order, ORDER_STATUS.SHIPPED, clock());
    },

    markReceived(order) {
      transition(order, ORDER_STATUS.RECEIVED, clock());
      order.receivedAt = clock(); // 返品期限の起点 (BR-09)
    },
  };
}
