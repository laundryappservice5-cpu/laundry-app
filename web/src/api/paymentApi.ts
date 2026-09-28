import { apiSlice } from './apiSlice';
import type { Payment, PaymentListRow, PaymentSummary } from '../types';
import { withPagination, type Paginated } from './types';

export interface DriverPendingSettlement {
  driverId: string;
  driverName: string;
  totalPending: number;
  count: number;
}

export interface ListPaymentsParams {
  dateFrom?: string;
  dateTo?: string;
  method?: string;
  minAmount?: number;
  maxAmount?: number;
  orderId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const paymentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listPayments: builder.query<Paginated<PaymentListRow>, ListPaymentsParams>({
      query: (params) => ({ url: '/payments', params }),
      transformResponse: withPagination<PaymentListRow>,
      providesTags: ['Settlement'],
    }),
    getPaymentSummary: builder.query<PaymentSummary, void>({
      query: () => ({ url: '/payments/summary' }),
      providesTags: ['Settlement'],
    }),
    getPendingByDriver: builder.query<DriverPendingSettlement[], void>({
      query: () => ({ url: '/payments/pending-by-driver' }),
      providesTags: ['Settlement'],
    }),
    getPendingForDriver: builder.query<Payment[], string>({
      query: (driverId) => ({ url: `/payments/pending/${driverId}` }),
      providesTags: ['Settlement'],
    }),
    settlePayments: builder.mutation<Payment[], { paymentIds: string[] }>({
      query: ({ paymentIds }) => ({ url: '/payments/settle', method: 'PATCH', data: { paymentIds } }),
      invalidatesTags: ['Settlement', 'Report'],
    }),
  }),
});

export const {
  useListPaymentsQuery,
  useGetPaymentSummaryQuery,
  useGetPendingByDriverQuery,
  useGetPendingForDriverQuery,
  useSettlePaymentsMutation,
} = paymentApi;
