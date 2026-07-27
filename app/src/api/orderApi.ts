import { apiSlice } from './apiSlice';
import type { Order, OrderStage } from '../types';

export const orderApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    myDeliveryJobs: builder.query<Order[], void>({
      query: () => ({ url: '/orders/my-deliveries' }),
      providesTags: ['Order'],
    }),
    availableForDelivery: builder.query<Order[], void>({
      query: () => ({ url: '/orders/available-for-delivery' }),
      providesTags: ['Order'],
    }),
    myStoreDropoffs: builder.query<Order[], void>({
      query: () => ({ url: '/orders/my-store-dropoffs' }),
      providesTags: ['Order'],
    }),
    myOrderHistory: builder.query<Order[], void>({
      query: () => ({ url: '/orders/my-history' }),
      providesTags: ['Order'],
    }),
    getOrderById: builder.query<Order, string>({
      query: (id) => ({ url: `/orders/${id}` }),
      providesTags: ['Order'],
    }),
    advanceOrderStatus: builder.mutation<Order, { id: string; status: OrderStage; remarks?: string; itemCount?: number }>({
      query: ({ id, ...data }) => ({ url: `/orders/${id}/status`, method: 'PATCH', data }),
      invalidatesTags: ['Order'],
    }),
    selfAssignDelivery: builder.mutation<Order, string>({
      query: (id) => ({ url: `/orders/${id}/self-assign`, method: 'PATCH' }),
      invalidatesTags: ['Order'],
    }),
  }),
});

export const {
  useMyDeliveryJobsQuery,
  useAvailableForDeliveryQuery,
  useMyStoreDropoffsQuery,
  useMyOrderHistoryQuery,
  useGetOrderByIdQuery,
  useAdvanceOrderStatusMutation,
  useSelfAssignDeliveryMutation,
} = orderApi;
