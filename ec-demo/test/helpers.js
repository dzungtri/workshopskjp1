// テスト用ヘルパ: 全サービスを時計 (clock) 固定で組み立てる
import { createCatalog } from '../src/products.js';
import { createInventory } from '../src/inventory.js';
import { createFakeGateway } from '../src/payment/fake-gateway.js';
import { createOrderService } from '../src/orders/order-service.js';
import { createReturnService } from '../src/returns/return-service.js';
import { createRefundService } from '../src/returns/refund-service.js';

export const T0 = '2026-11-01T10:00:00Z';

export const DEFAULT_STOCK = {
  'TEA-001': 50, 'MUG-002': 50, 'TOWEL-003': 50, 'RICE-004': 50, 'CANDY-005': 50, 'SOAP-006': 50,
};

export function setup({ stock = DEFAULT_STOCK, mode = 'succeed' } = {}) {
  let now = T0;
  const clock = () => now;
  const catalog = createCatalog();
  const inventory = createInventory(stock);
  const gateway = createFakeGateway({ mode });
  return {
    clock,
    setNow: (iso) => { now = iso; },
    catalog,
    inventory,
    gateway,
    orders: createOrderService({ catalog, inventory, gateway, clock }),
    returns: createReturnService({ clock }),
    refunds: createRefundService({ gateway, clock }),
  };
}

// 受取済 (T0 に受取) の注文を作る
export function receivedOrder(ctx, lines, opts) {
  const order = ctx.orders.placeOrder(lines, opts);
  ctx.orders.pay(order);
  ctx.orders.ship(order);
  ctx.orders.markReceived(order);
  return order;
}

export const coupon = (over = {}) => ({
  code: 'TEST', type: 'percent', value: 10, minSubtotal: 0,
  expiresAt: '2026-12-31T23:59:59+09:00', ...over,
});
