import { DomainError } from '../errors.js';
import { taxOn } from '../money.js';
import { assertQty } from '../cart.js';
import { calcDiscount } from '../coupons.js';

// 注文金額の計算 (純粋関数)
//   subtotal = Σ(税抜単価 × 数量)
//   discount = クーポン割引 (小計に対して)
//   tax      = floor((subtotal - discount) × 10%)  ← 合計に1回だけ (BR-08)
//   total    = subtotal - discount + tax
export function priceOrder(lines, catalog, coupon, now) {
  if (lines.length === 0) throw new DomainError('EMPTY_ORDER', 'order has no lines');

  const priced = lines.map(({ sku, qty }) => {
    assertQty(sku, qty);
    const { name, price } = catalog.get(sku);
    return { sku, name, qty, unitPrice: price, lineTotal: price * qty };
  });

  const subtotal = priced.reduce((sum, l) => sum + l.lineTotal, 0);
  const discount = calcDiscount(subtotal, coupon, now);
  const tax = taxOn(subtotal - discount);
  return { lines: priced, subtotal, discount, tax, total: subtotal - discount + tax };
}
