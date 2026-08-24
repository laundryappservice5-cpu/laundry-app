import { apiSlice } from './apiSlice';
import type { Bill, DashboardStats, Order, PaymentReportRow } from '../types';
import { withPagination, type Paginated } from './types';

interface RevenuePoint {
  _id: string;
  total: number;
}

interface OrderStatusPoint {
  _id: string;
  count: number;
}

interface DriverPerformance {
  driverName: string;
  completedOrders: number;
}

interface AdminPerformance {
  adminName: string;
  billsGenerated: number;
  totalRevenue: number;
}

interface RepeatCustomer {
  name: string;
  mobileNumber: string;
  orderCount: number;
}

export const reportApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<DashboardStats, void>({
      query: () => ({ url: '/reports/dashboard' }),
      providesTags: ['Report'],
    }),
    getRevenueChart: builder.query<RevenuePoint[], { days?: number }>({
      query: ({ days = 30 }) => ({ url: '/reports/revenue-chart', params: { days } }),
      providesTags: ['Report'],
    }),
    getOrderStatusChart: builder.query<OrderStatusPoint[], void>({
      query: () => ({ url: '/reports/order-status-chart' }),
      providesTags: ['Report'],
    }),
    getDriverPerformance: builder.query<DriverPerformance[], void>({
      query: () => ({ url: '/reports/driver-performance' }),
    }),
    getAdminPerformance: builder.query<AdminPerformance[], void>({
      query: () => ({ url: '/reports/admin-performance' }),
    }),
    getDiscountsReport: builder.query<Bill[], void>({
      query: () => ({ url: '/reports/discounts' }),
    }),
    getPaymentsReport: builder.query<Paginated<PaymentReportRow>, { page?: number; limit?: number }>({
      query: (params) => ({ url: '/reports/payments', params }),
      transformResponse: withPagination<PaymentReportRow>,
    }),
    getRepeatCustomers: builder.query<RepeatCustomer[], void>({
      query: () => ({ url: '/reports/repeat-customers' }),
    }),
    getPendingVsCompleted: builder.query<{ pending: number; completed: number }, void>({
      query: () => ({ url: '/reports/pending-vs-completed' }),
    }),
    getExpressOrders: builder.query<Order[], void>({
      query: () => ({ url: '/reports/express-orders' }),
    }),
  }),
});

export const {
  useGetDashboardQuery,
  useGetRevenueChartQuery,
  useGetOrderStatusChartQuery,
  useGetDriverPerformanceQuery,
  useGetAdminPerformanceQuery,
  useGetDiscountsReportQuery,
  useGetPaymentsReportQuery,
  useGetRepeatCustomersQuery,
  useGetPendingVsCompletedQuery,
  useGetExpressOrdersQuery,
} = reportApi;
