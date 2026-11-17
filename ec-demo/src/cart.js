import { DomainError } from './errors.js';

export const MAX_QTY_PER_ITEM = 10; // BR-01: 1注文・1商品あたりの上限

export function assertQty(sku, qty) {
  if (!Number.isInteger(qty) || qty < 1) {
    throw new DomainError('INVALID_QTY', `${sku}: qty must be a positive integer`);
  }
  if (qty > MAX_QTY_PER_ITEM) {
    throw new DomainError('QTY_LIMIT', `${sku}: max ${MAX_QTY_PER_ITEM} per order`);
  }
}

export function createCart(catalog) {
  const lines = new Map(); // sku -> qty

  return {
    add(sku, qty = 1) {
      catalog.get(sku); // 存在チェック
      assertQty(sku, qty);
      assertQty(sku, (lines.get(sku) ?? 0) + qty); // 合算後も上限内か
      lines.set(sku, (lines.get(sku) ?? 0) + qty);
    },
    remove(sku) {
      lines.delete(sku);
    },
    lines: () => [...lines].map(([sku, qty]) => ({ sku, qty })),
  };
}
