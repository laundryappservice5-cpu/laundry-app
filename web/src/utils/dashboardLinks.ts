import type { DashboardStats } from '../types';

export const DASHBOARD_CARD_LINKS: Record<keyof DashboardStats, string> = {
  todaysPickups: '/pickups?createdToday=true',
  pendingPickups: '/pickups?status=PENDING',
  laundryInProgress: '/orders?status=IN_PROGRESS',
  readyForDelivery: '/orders?status=READY_FOR_DELIVERY',
  expressOrders: '/orders?express=true',
  deliveredOrdersToday: '/orders?status=DELIVERED&updatedToday=true',
  pendingPayments: '/orders?paymentStatus=PENDING',
  dailyRevenue: '/reports?tab=payments',
  monthlyRevenue: '/reports?tab=payments',
  customerCount: '/customers',
  driverCount: '/drivers?active=true',
  todaysOrders: '/orders',
  yesterdaysOrders: '/orders',
  pendingOrders: '/orders?status=PICKED_UP',
  completedOrders: '/orders?status=DELIVERED',
  cancelledOrders: '/orders',
  yesterdaysRevenue: '/reports?tab=payments',
  lastMonthRevenue: '/reports?tab=payments',
  pendingPaymentsAmount: '/orders?paymentStatus=PENDING',
};
