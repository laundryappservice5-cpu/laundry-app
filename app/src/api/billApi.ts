import { apiSlice } from './apiSlice';
import type { Bill, PaymentMethod } from '../types';

export const billApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBillById: builder.query<Bill, string>({
      query: (id) => ({ url: `/bills/${id}` }),
      providesTags: ['Bill'],
    }),
    recordPayment: builder.mutation<{ bill: Bill }, { id: string; amount: number; method: PaymentMethod }>({
      query: ({ id, amount, method }) => ({ url: `/bills/${id}/payments`, method: 'POST', data: { amount, method } }),
      invalidatesTags: ['Bill', 'Order'],
    }),
  }),
});

export const { useGetBillByIdQuery, useRecordPaymentMutation } = billApi;
