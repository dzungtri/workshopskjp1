// デモ用 CLI: 注文 → 決済 → 発送 → 受取 → 部分返品 → 返金 を一通り実行して表示する
// 実行: npm run demo
import { createCatalog } from './products.js';
import { createInventory } from './inventory.js';
import { createFakeGateway } from './payment/fake-gateway.js';
import { createOrderService } from './orders/order-service.js';
import { createReturnService } from './returns/return-service.js';
import { createRefundService } from './returns/refund-service.js';

let now = '2026-11-01T10:00:00+09:00';
const clock = () => now;

const catalog = createCatalog();
const inventory = createInventory({ 'RICE-004': 8, 'MUG-002': 20, 'TEA-001': 20 });
const gateway = createFakeGateway();
const orders = createOrderService({ catalog, inventory, gateway, clock });
const returns = createReturnService({ clock });
const refunds = createRefundService({ gateway, clock });

const coupon = { code: 'AUTUMN10', type: 'percent', value: 10, minSubtotal: 3000, expiresAt: '2026-12-31T23:59:59+09:00' };
const order = orders.placeOrder(
  [{ sku: 'RICE-004', qty: 4 }, { sku: 'MUG-002', qty: 1 }, { sku: 'TEA-001', qty: 1 }],
  { coupons: [coupon] },
);
console.log('注文:', { id: order.id, subtotal: order.subtotal, discount: order.discount, tax: order.tax, total: order.total });
console.log('在庫イベント:', inventory.events);

orders.pay(order);
orders.ship(order);
orders.markReceived(order);

now = '2026-11-05T10:00:00+09:00';
const ret = returns.requestReturn(order, [{ sku: 'MUG-002', qty: 1, condition: 'unopened' }]);
console.log('返金:', refunds.refund(order, ret));
console.log('ステータス履歴:', order.history.map((h) => h.to).join(' → '));
