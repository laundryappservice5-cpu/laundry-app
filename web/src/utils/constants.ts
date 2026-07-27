import type { OrderStage, PickupStatus } from '../types';

export const ORDER_STAGE_LABELS: Record<OrderStage, string> = {
  PICKUP_CREATED: 'Pickup Created',
  DRIVER_ASSIGNED: 'Driver Assigned',
  PICKED_UP: 'Picked Up',
  RECEIVED_AT_LAUNDRY: 'Delivered to Store',
  READY_FOR_DELIVERY: 'Ready for Delivery',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
};

export const ORDER_STAGE_LIST: OrderStage[] = [
  'PICKUP_CREATED',
  'DRIVER_ASSIGNED',
  'PICKED_UP',
  'RECEIVED_AT_LAUNDRY',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export const PICKUP_STATUS_LABELS: Record<PickupStatus, string> = {
  CREATED: 'Created',
  DRIVER_ASSIGNED: 'Driver Assigned',
  ACCEPTED: 'Accepted',
  PICKED_UP: 'Picked Up',
  CANCELLED: 'Cancelled',
};

export const PICKUP_STATUS_COLORS: Record<PickupStatus, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  CREATED: 'default',
  DRIVER_ASSIGNED: 'info',
  ACCEPTED: 'warning',
  PICKED_UP: 'success',
  CANCELLED: 'error',
};

export const ORDER_STAGE_COLORS: Record<OrderStage, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  PICKUP_CREATED: 'default',
  DRIVER_ASSIGNED: 'info',
  PICKED_UP: 'info',
  RECEIVED_AT_LAUNDRY: 'warning',
  READY_FOR_DELIVERY: 'success',
  OUT_FOR_DELIVERY: 'success',
  DELIVERED: 'success',
};

export const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD'] as const;
