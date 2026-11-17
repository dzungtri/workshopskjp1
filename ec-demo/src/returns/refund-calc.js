import { DomainError } from '../errors.js';
import { taxOn } from '../money.js';

// 按分返金 (prorated refund) — BR-12。式は docs/business-rules.md と一致させること
//   returnedSubtotal  = Σ(税抜単価 × 返品数量)
//   allocatedDiscount = ceil(order.discount × returnedSubtotal / order.subtotal)
//   refundTaxable     = returnedSubtotal − allocatedDiscount
//   refund            = refundTaxable + floor(refundTaxable × 10%)
export function calcRefundAmount(order, returnLines) {
  let returnedSubtotal = 0;
  for (const { sku, qty } of returnLines) {
    const line = order.lines.find((l) => l.sku === sku);
    if (!line) throw new DomainError('UNKNOWN_LINE', `${sku} is not in ${order.id}`);
    returnedSubtotal += line.unitPrice * qty;
  }

  const allocatedDiscount =
    order.subtotal === 0 ? 0 : Math.ceil((order.discount * returnedSubtotal) / order.subtotal);
  const refundTaxable = returnedSubtotal - allocatedDiscount;
  return refundTaxable + taxOn(refundTaxable);
}
