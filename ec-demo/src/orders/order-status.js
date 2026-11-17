import { DomainError } from '../errors.js';

// 注文ステータス (BR-02)
export const ORDER_STATUS = Object.freeze({
  PLACED: '注文済',
  PAID: '決済済',
  SHIPPED: '発送済',
  RECEIVED: '受取済',
  RETURN_REQUESTED: '返品申請',
  REFUNDED: '返金済',
  CANCELLED: 'キャンセル',
});

const S = ORDER_STATUS;

// 許可された遷移だけを列挙する。ここに無い遷移は例外
const ALLOWED = {
  [S.PLACED]: [S.PAID, S.CANCELLED],
  [S.PAID]: [S.SHIPPED],
  [S.SHIPPED]: [S.RECEIVED],
  [S.RECEIVED]: [S.RETURN_REQUESTED],
  [S.RETURN_REQUESTED]: [S.REFUNDED],
  [S.REFUNDED]: [S.RETURN_REQUESTED], // 部分返品の2回目以降 (BR-11)
  [S.CANCELLED]: [],
};

export function transition(order, to, at) {
  if (!ALLOWED[order.status]?.includes(to)) {
    throw new DomainError('INVALID_TRANSITION', `${order.id}: ${order.status} → ${to}`);
  }
  order.history.push({ from: order.status, to, at });
  order.status = to;
}
