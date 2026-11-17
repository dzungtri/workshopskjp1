import { DomainError } from './errors.js';

// 金額は常に「整数の円 (JPY)」。小数 (float) は使わない (BR-00)
export const TAX_RATE_PERCENT = 10; // 消費税 10% (BR-07)

export function assertYen(amount, label = 'amount') {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new DomainError('INVALID_MONEY', `${label} must be a non-negative integer JPY: ${amount}`);
  }
  return amount;
}

// 消費税: 注文合計に1回だけ掛けて切り捨て (行ごとではない) (BR-08)
export function taxOn(taxableAmount) {
  assertYen(taxableAmount, 'taxable');
  return Math.floor((taxableAmount * TAX_RATE_PERCENT) / 100);
}
