import { DomainError } from './errors.js';
import { assertYen } from './money.js';

// クーポン例:
// { code: 'AUTUMN10', type: 'percent', value: 10, minSubtotal: 3000, expiresAt: '2026-12-31T23:59:59+09:00' }
// { code: 'WELCOME500', type: 'fixed', value: 500, minSubtotal: 2000, expiresAt: ... }

// BR-05: 1注文につきクーポンは1枚まで
export function pickSingleCoupon(coupons = []) {
  if (coupons.length > 1) {
    throw new DomainError('COUPON_LIMIT', 'only one coupon per order');
  }
  return coupons[0] ?? null;
}

// 割引額 (税抜小計に対して適用)。合計がマイナスにならないよう上限 = 小計 (BR-06)
export function calcDiscount(subtotal, coupon, now) {
  if (!coupon) return 0;
  if (Date.parse(now) > Date.parse(coupon.expiresAt)) {
    throw new DomainError('COUPON_EXPIRED', `${coupon.code} expired at ${coupon.expiresAt}`);
  }
  if (subtotal < coupon.minSubtotal) {
    throw new DomainError('COUPON_MIN_NOT_MET', `${coupon.code} requires subtotal >= ${coupon.minSubtotal}`);
  }

  let discount;
  if (coupon.type === 'percent') {
    discount = Math.floor((subtotal * coupon.value) / 100); // 切り捨て (BR-06)
  } else if (coupon.type === 'fixed') {
    discount = assertYen(coupon.value, 'coupon value');
  } else {
    throw new DomainError('COUPON_INVALID', `unknown coupon type: ${coupon.type}`);
  }
  return Math.min(discount, subtotal);
}
