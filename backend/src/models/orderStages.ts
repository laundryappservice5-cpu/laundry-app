export const ORDER_STAGES = [
  'PICKUP_CREATED',
  'DRIVER_ASSIGNED',
  'PICKED_UP',
  'RECEIVED_AT_LAUNDRY',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
] as const;

export type OrderStage = (typeof ORDER_STAGES)[number];

export function isForwardTransition(current: OrderStage, next: OrderStage): boolean {
  return ORDER_STAGES.indexOf(next) > ORDER_STAGES.indexOf(current);
}

export function isAtOrPastStage(current: OrderStage, target: OrderStage): boolean {
  return ORDER_STAGES.indexOf(current) >= ORDER_STAGES.indexOf(target);
}
