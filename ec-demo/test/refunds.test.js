import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcRefundAmount } from '../src/returns/refund-calc.js';
import { setup, receivedOrder, coupon } from './helpers.js';

test('BR-12: クーポン利用注文の部分返品は割引を按分する', () => {
  const ctx = setup();
  // 小計 1194, 15%割引 179, 税 101, 合計 1116
  const order = receivedOrder(ctx, [{ sku: 'SOAP-006', qty: 3 }], { coupons: [coupon({ value: 15 })] });
  assert.equal(order.total, 1116);
  // 398 − ceil(179 × 398 / 1194 = 59.67 → 60) = 338, 税 33 → 371
  assert.equal(calcRefundAmount(order, [{ sku: 'SOAP-006', qty: 1 }]), 371);
});

test('BR-12: 全数返品なら支払額と一致する', () => {
  const ctx = setup();
  const order = receivedOrder(ctx, [{ sku: 'SOAP-006', qty: 3 }], { coupons: [coupon({ value: 15 })] });
  assert.equal(calcRefundAmount(order, [{ sku: 'SOAP-006', qty: 3 }]), order.total);
});

test('BR-13: 同じ返品を2回返金しても決済への返金は1回だけ (冪等)', () => {
  const ctx = setup();
  const order = receivedOrder(ctx, [{ sku: 'MUG-002', qty: 2 }]);
  ctx.setNow('2026-11-03T10:00:00Z');
  const ret = ctx.returns.requestReturn(order, [{ sku: 'MUG-002', qty: 1, condition: 'unopened' }]);

  const first = ctx.refunds.refund(order, ret);
  const second = ctx.refunds.refund(order, ret);
  assert.deepEqual(second, first);
  assert.equal(ctx.gateway.refunds.length, 1);
  assert.equal(order.refundedTotal, 2178); // 1980 + 税 198
});

test('BR-14: 返金失敗時は状態を変えない', () => {
  const ctx = setup();
  const order = receivedOrder(ctx, [{ sku: 'MUG-002', qty: 1 }]);
  ctx.setNow('2026-11-03T10:00:00Z');
  const ret = ctx.returns.requestReturn(order, [{ sku: 'MUG-002', qty: 1, condition: 'defective' }]);
  ctx.gateway.setMode('fail');
  assert.throws(() => ctx.refunds.refund(order, ret), { code: 'REFUND_FAILED' });
  assert.equal(order.refundedTotal, 0);
  assert.equal(order.status, '返品申請');
});
