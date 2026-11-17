import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, receivedOrder } from './helpers.js';

const LINES = [{ sku: 'TEA-001', qty: 2 }, { sku: 'MUG-002', qty: 1 }];

test('BR-09: 受取からちょうど8日後は返品できる', () => {
  const ctx = setup();
  const order = receivedOrder(ctx, LINES); // 受取: 2026-11-01T10:00Z
  ctx.setNow('2026-11-09T10:00:00Z');
  const ret = ctx.returns.requestReturn(order, [{ sku: 'MUG-002', qty: 1, condition: 'unopened' }]);
  assert.equal(ret.status, '申請中');
  assert.equal(order.status, '返品申請');
});

test('BR-09: 返品期限 (8日) を過ぎた返品は拒否され、返金されない', () => {
  const ctx = setup();
  const order = receivedOrder(ctx, LINES);
  ctx.setNow('2026-11-09T22:00:00Z'); // 8日12時間後
  assert.throws(() => {
    const ret = ctx.returns.requestReturn(order, [{ sku: 'MUG-002', qty: 1, condition: 'unopened' }]);
    ctx.refunds.refund(order, ret);
  }, { code: 'RETURN_WINDOW_EXPIRED' });
  assert.equal(ctx.gateway.refunds.length, 0);
});

test('BR-10: 開封済・使用済は返金不可、不良品は可', () => {
  const ctx = setup();
  const order = receivedOrder(ctx, LINES);
  ctx.setNow('2026-11-03T10:00:00Z');
  for (const condition of ['opened', 'used']) {
    assert.throws(
      () => ctx.returns.requestReturn(order, [{ sku: 'TEA-001', qty: 1, condition }]),
      { code: 'NOT_REFUNDABLE' },
    );
  }
  const ret = ctx.returns.requestReturn(order, [{ sku: 'TEA-001', qty: 1, condition: 'defective' }]);
  assert.equal(ret.lines[0].condition, 'defective');
});

test('BR-11: 部分返品を複数回できるが、購入数は超えられない', () => {
  const ctx = setup();
  const order = receivedOrder(ctx, LINES);
  ctx.setNow('2026-11-03T10:00:00Z');
  const r1 = ctx.returns.requestReturn(order, [{ sku: 'TEA-001', qty: 1, condition: 'unopened' }]);
  ctx.refunds.refund(order, r1);
  assert.equal(order.status, '返金済');

  const r2 = ctx.returns.requestReturn(order, [{ sku: 'TEA-001', qty: 1, condition: 'unopened' }]);
  ctx.refunds.refund(order, r2);
  assert.throws(
    () => ctx.returns.requestReturn(order, [{ sku: 'TEA-001', qty: 1, condition: 'unopened' }]),
    { code: 'RETURN_QTY_EXCEEDED' },
  );
});

test('受取前の注文は返品できない', () => {
  const ctx = setup();
  const order = ctx.orders.placeOrder(LINES);
  ctx.orders.pay(order);
  assert.throws(
    () => ctx.returns.requestReturn(order, [{ sku: 'TEA-001', qty: 1, condition: 'unopened' }]),
    { code: 'NOT_RETURNABLE_STATUS' },
  );
});
