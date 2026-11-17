import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, coupon } from './helpers.js';

test('BR-08: 消費税は合計に対して切り捨て (行ごとではない)', () => {
  const ctx = setup();
  // 198円 + 398円: 行ごとなら 19 + 39 = 58円、合計なら floor(59.6) = 59円
  const order = ctx.orders.placeOrder([{ sku: 'CANDY-005', qty: 1 }, { sku: 'SOAP-006', qty: 1 }]);
  assert.equal(order.subtotal, 596);
  assert.equal(order.tax, 59);
  assert.equal(order.total, 655);
});

test('BR-01: 注文でも1商品10個を超えると拒否', () => {
  const ctx = setup();
  assert.throws(() => ctx.orders.placeOrder([{ sku: 'TEA-001', qty: 11 }]), { code: 'QTY_LIMIT' });
});

test('BR-05: 注文時にクーポン2枚は拒否', () => {
  const ctx = setup();
  const lines = [{ sku: 'RICE-004', qty: 2 }];
  assert.throws(() => ctx.orders.placeOrder(lines, { coupons: [coupon(), coupon()] }), { code: 'COUPON_LIMIT' });
});

test('BR-02: 決済成功で 注文済 → 決済済、正常フローの遷移', () => {
  const ctx = setup();
  const order = ctx.orders.placeOrder([{ sku: 'MUG-002', qty: 1 }]);
  assert.equal(order.status, '注文済');
  assert.equal(ctx.orders.pay(order).ok, true);
  ctx.orders.ship(order);
  ctx.orders.markReceived(order);
  assert.deepEqual(order.history.map((h) => h.to), ['決済済', '発送済', '受取済']);
  assert.equal(ctx.gateway.charges[0].amount, order.total);
});

test('BR-02: 決済前の発送など不正な遷移は例外', () => {
  const ctx = setup();
  const order = ctx.orders.placeOrder([{ sku: 'MUG-002', qty: 1 }]);
  assert.throws(() => ctx.orders.ship(order), { code: 'INVALID_TRANSITION' });
  ctx.orders.pay(order);
  assert.throws(() => ctx.orders.pay(order), { code: 'INVALID_TRANSITION' });
  assert.throws(() => ctx.orders.markReceived(order), { code: 'INVALID_TRANSITION' });
});

test('BR-02: 決済失敗の注文は発送できない', () => {
  const ctx = setup({ mode: 'fail' });
  const order = ctx.orders.placeOrder([{ sku: 'MUG-002', qty: 1 }]);
  ctx.orders.pay(order);
  assert.throws(() => ctx.orders.ship(order), { code: 'INVALID_TRANSITION' });
});
