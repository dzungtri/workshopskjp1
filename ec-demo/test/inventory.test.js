import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInventory } from '../src/inventory.js';
import { setup } from './helpers.js';

test('BR-03: 注文で在庫を引当、在庫不足なら拒否', () => {
  const ctx = setup({ stock: { 'TEA-001': 3, 'MUG-002': 1 } });
  ctx.orders.placeOrder([{ sku: 'TEA-001', qty: 2 }]);
  assert.equal(ctx.inventory.available('TEA-001'), 1);
  assert.throws(
    () => ctx.orders.placeOrder([{ sku: 'TEA-001', qty: 1 }, { sku: 'MUG-002', qty: 2 }]),
    { code: 'OUT_OF_STOCK' },
  );
  assert.equal(ctx.inventory.available('TEA-001'), 1, '途中まで引当した分は戻る');
});

test('BR-03: 決済失敗で引当を解放し、注文はキャンセル', () => {
  const ctx = setup({ mode: 'fail' });
  const order = ctx.orders.placeOrder([{ sku: 'RICE-004', qty: 3 }]);
  assert.equal(ctx.inventory.available('RICE-004'), 47);
  const res = ctx.orders.pay(order);
  assert.equal(res.ok, false);
  assert.equal(order.status, 'キャンセル');
  assert.equal(ctx.inventory.available('RICE-004'), 50);
});

test('BR-04: 閾値を下回ったら「要発注」イベントを1回だけ出す', () => {
  const inv = createInventory({ 'TEA-001': 7 }, { reorderThreshold: 5 });
  inv.reserve('TEA-001', 2); // 残 5: まだ閾値以上
  assert.equal(inv.events.length, 0);
  inv.reserve('TEA-001', 1); // 残 4: 下回った
  inv.reserve('TEA-001', 1); // 残 3: 通知済みなので出さない
  assert.deepEqual(inv.events, [{ type: '要発注', sku: 'TEA-001', available: 4 }]);
});
