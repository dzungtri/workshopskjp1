import { DomainError } from './errors.js';
import { assertYen } from './money.js';

// 架空の商品カタログ。price は税抜・整数円
export const SAMPLE_PRODUCTS = [
  { sku: 'TEA-001', name: '緑茶ティーバッグ 50袋', price: 1280 },
  { sku: 'MUG-002', name: '陶器マグカップ', price: 1980 },
  { sku: 'TOWEL-003', name: 'バスタオル', price: 2500 },
  { sku: 'RICE-004', name: 'お米 5kg', price: 3000 },
  { sku: 'CANDY-005', name: 'のど飴', price: 198 },
  { sku: 'SOAP-006', name: '固形石けん', price: 398 },
];

export function createCatalog(products = SAMPLE_PRODUCTS) {
  const bySku = new Map();
  for (const p of products) {
    assertYen(p.price, `price of ${p.sku}`);
    bySku.set(p.sku, { ...p });
  }
  return {
    get(sku) {
      const product = bySku.get(sku);
      if (!product) throw new DomainError('UNKNOWN_SKU', `unknown sku: ${sku}`);
      return product;
    },
    list: () => [...bySku.values()],
  };
}
