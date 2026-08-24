import { apiSlice } from './apiSlice';
import type { Payment } from '../types';

export interface DriverPendingSettlement {
  driverId: string;
  driverName: string;
  totalPending: number;
  count: number;
}

export const paymentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
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

export const { useGetPendingByDriverQuery, useGetPendingForDriverQuery, useSettlePaymentsMutation } = paymentApi;
