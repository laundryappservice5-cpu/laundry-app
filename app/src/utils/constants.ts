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

export const PICKUP_STATUS_LABELS: Record<PickupStatus, string> = {
  CREATED: 'Created',
  DRIVER_ASSIGNED: 'Driver Assigned',
  ACCEPTED: 'Accepted',
  PICKED_UP: 'Picked Up',
  CANCELLED: 'Cancelled',
};

// Royal Fresh Laundry brand palette — navy & gold, matching the crest.
export const COLORS = {
  primary: '#14213D',
  primaryDark: '#0A1224',
  secondary: '#C9A227',
  success: '#2E9E5B',
  warning: '#D4AF37',
  error: '#E33E4C',
  background: '#F7F5F0',
  surface: '#FFFFFF',
  textPrimary: '#14213D',
  textSecondary: '#6B7280',
  border: '#E5E1D6',
};

export const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD'] as const;
