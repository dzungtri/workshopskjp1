import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCart, MAX_QTY_PER_ITEM } from '../src/cart.js';
import { createCatalog } from '../src/products.js';

test('BR-01: 1商品10個までは追加できる', () => {
  const cart = createCart(createCatalog());
  cart.add('TEA-001', MAX_QTY_PER_ITEM);
  assert.deepEqual(cart.lines(), [{ sku: 'TEA-001', qty: 10 }]);
});

test('BR-01: 合算で上限を超えると拒否', () => {
  const cart = createCart(createCatalog());
  cart.add('TEA-001', 6);
  assert.throws(() => cart.add('TEA-001', 5), { code: 'QTY_LIMIT' });
  assert.deepEqual(cart.lines(), [{ sku: 'TEA-001', qty: 6 }]);
});

test('数量は正の整数のみ・存在しない商品は拒否', () => {
  const cart = createCart(createCatalog());
  assert.throws(() => cart.add('TEA-001', 0), { code: 'INVALID_QTY' });
  assert.throws(() => cart.add('TEA-001', 1.5), { code: 'INVALID_QTY' });
  assert.throws(() => cart.add('NOPE-999', 1), { code: 'UNKNOWN_SKU' });
});
