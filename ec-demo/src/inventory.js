import { DomainError } from './errors.js';

export const DEFAULT_REORDER_THRESHOLD = 5; // BR-04: これを下回ったら「要発注」

// 在庫: onHand (実在庫) と reserved (引当済) を分けて持つ
export function createInventory(initialStock, { reorderThreshold = DEFAULT_REORDER_THRESHOLD } = {}) {
  const onHand = new Map(Object.entries(initialStock));
  const reserved = new Map();
  const events = []; // 発生したイベント (例: 要発注)

  const qty = (map, sku) => map.get(sku) ?? 0;
  const available = (sku) => qty(onHand, sku) - qty(reserved, sku);

  return {
    events,
    available,

    // 注文時に引当 (BR-03)
    reserve(sku, n) {
      const before = available(sku);
      if (n > before) {
        throw new DomainError('OUT_OF_STOCK', `${sku}: requested ${n}, available ${before}`);
      }
      reserved.set(sku, qty(reserved, sku) + n);
      // 閾値を下回った瞬間に1回だけ通知
      if (before >= reorderThreshold && available(sku) < reorderThreshold) {
        events.push({ type: '要発注', sku, available: available(sku) });
      }
    },

    // 決済失敗時などに引当を戻す (BR-03)
    release(sku, n) {
      reserved.set(sku, Math.max(0, qty(reserved, sku) - n));
    },

    // 決済成功時に引当を確定 (実在庫から減らす)
    commit(sku, n) {
      reserved.set(sku, qty(reserved, sku) - n);
      onHand.set(sku, qty(onHand, sku) - n);
    },
  };
}
