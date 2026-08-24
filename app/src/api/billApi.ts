import { apiSlice } from './apiSlice';
import type { Bill, PaymentLeg } from '../types';

export const billApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBillById: builder.query<Bill, string>({
      query: (id) => ({ url: `/bills/${id}` }),
      providesTags: ['Bill'],
    }),
    recordPayment: builder.mutation<{ bill: Bill }, { id: string; splits: PaymentLeg[] }>({
      query: ({ id, splits }) => ({ url: `/bills/${id}/payments`, method: 'POST', data: { splits } }),
      invalidatesTags: ['Bill', 'Order'],
    }),
  }),
});

export const { useGetBillByIdQuery, useRecordPaymentMutation } = billApi;
