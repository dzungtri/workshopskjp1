// ゴールデンテスト: test/golden/*.json は人間が承認した期待値 (変更禁止)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCatalog } from '../src/products.js';
import { priceOrder } from '../src/orders/pricing.js';
import { calcRefundAmount } from '../src/returns/refund-calc.js';

const load = (name) => JSON.parse(readFileSync(new URL(`./golden/${name}`, import.meta.url), 'utf8'));
const catalog = createCatalog();

const orders = load('orders.json');
for (const c of orders.cases) {
  test(`golden ${c.id}: ${c.description}`, () => {
    const { subtotal, discount, tax, total } = priceOrder(c.lines, catalog, c.coupon, orders._meta.now);
    assert.deepEqual({ subtotal, discount, tax, total }, c.expected);
  });
}

const refunds = load('refunds.json');
for (const c of refunds.cases) {
  test(`golden ${c.id}: ${c.description}`, () => {
    const order = priceOrder(c.lines, catalog, c.coupon, refunds._meta.now);
    assert.equal(order.total, c.expected.orderTotal);
    assert.equal(calcRefundAmount(order, c.returnLines), c.expected.refund);
  });
}
