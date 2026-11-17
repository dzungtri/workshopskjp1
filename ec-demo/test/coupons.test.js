import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcDiscount, pickSingleCoupon } from '../src/coupons.js';
import { coupon } from './helpers.js';

const NOW = '2026-11-17T10:00:00+09:00';

test('BR-06: 定率クーポンは小計に対して切り捨て', () => {
  assert.equal(calcDiscount(1194, coupon({ type: 'percent', value: 15 }), NOW), 179); // 179.1
});

test('BR-06: 定額クーポンで合計がマイナスにならない', () => {
  assert.equal(calcDiscount(198, coupon({ type: 'fixed', value: 1000 }), NOW), 198);
});

test('BR-06: 最低購入金額に満たないと拒否', () => {
  assert.throws(() => calcDiscount(2999, coupon({ minSubtotal: 3000 }), NOW), { code: 'COUPON_MIN_NOT_MET' });
  assert.equal(calcDiscount(3000, coupon({ minSubtotal: 3000 }), NOW), 300);
});

test('BR-06: 有効期限切れは拒否', () => {
  const c = coupon({ expiresAt: '2026-11-17T09:59:59+09:00' });
  assert.throws(() => calcDiscount(5000, c, NOW), { code: 'COUPON_EXPIRED' });
});

test('BR-05: クーポンは1注文1枚まで', () => {
  assert.throws(() => pickSingleCoupon([coupon(), coupon({ code: 'B' })]), { code: 'COUPON_LIMIT' });
  assert.equal(pickSingleCoupon([]), null);
});
