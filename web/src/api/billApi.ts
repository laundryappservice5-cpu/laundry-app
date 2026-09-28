import { apiSlice } from './apiSlice';
import type { Bill, Payment, PaymentLeg } from '../types';

export const billApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBillById: builder.query<Bill, string>({
      query: (id) => ({ url: `/bills/${id}` }),
      providesTags: ['Bill'],
    }),
    generateBill: builder.mutation<
      Bill,
      {
        orderId: string;
        extraCharges?: number;
        taxes?: number;
        pickupCharge?: number;
        deliveryCharge?: number;
        discountAmount?: number;
        discountReason?: string;
      }
    >({
      query: ({ orderId, ...data }) => ({ url: `/bills/orders/${orderId}/generate`, method: 'POST', data }),
      invalidatesTags: ['Bill', 'Order'],
    }),
    applyDiscount: builder.mutation<Bill, { id: string; discountAmount: number; reason: string }>({
      query: ({ id, discountAmount, reason }) => ({ url: `/bills/${id}/discount`, method: 'PATCH', data: { discountAmount, reason } }),
      invalidatesTags: ['Bill'],
    }),
    removeDiscount: builder.mutation<Bill, { id: string }>({
      query: ({ id }) => ({ url: `/bills/${id}/discount`, method: 'DELETE' }),
      invalidatesTags: ['Bill'],
    }),
    recordPayment: builder.mutation<{ bill: Bill; payments: Payment[] }, { id: string; splits: PaymentLeg[] }>({
      query: ({ id, splits }) => ({ url: `/bills/${id}/payments`, method: 'POST', data: { splits } }),
      invalidatesTags: ['Bill', 'Order'],
    }),
  }),
});

export const {
  useGetBillByIdQuery,
  useGenerateBillMutation,
  useApplyDiscountMutation,
  useRemoveDiscountMutation,
  useRecordPaymentMutation,
} = billApi;
