import { apiSlice } from './apiSlice';
import type { Order, OrderStage, PaymentStatus } from '../types';
import { withPagination, type Paginated } from './types';

export interface ListOrdersParams {
  currentStatus?: OrderStage | OrderStage[];
  excludeStatus?: OrderStage[];
  driver?: string;
  isExpress?: boolean;
  updatedToday?: boolean;
  paymentStatus?: PaymentStatus;
  page?: number;
  limit?: number;
}

export const orderApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listOrders: builder.query<Paginated<Order>, ListOrdersParams>({
      query: ({ currentStatus, excludeStatus, ...rest }) => ({
        url: '/orders',
        params: {
          ...rest,
          currentStatus: Array.isArray(currentStatus) ? currentStatus.join(',') : currentStatus,
          excludeStatus: excludeStatus?.join(','),
        },
      }),
      transformResponse: withPagination<Order>,
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
    updateStageEntry: builder.mutation<Order, { id: string; entryId: string; itemCount?: number; remarks?: string }>({
      query: ({ id, entryId, ...data }) => ({ url: `/orders/${id}/stages/${entryId}`, method: 'PATCH', data }),
      invalidatesTags: ['Order'],
    }),
    assignDeliveryDriver: builder.mutation<Order, { id: string; driverId: string }>({
      query: ({ id, driverId }) => ({ url: `/orders/${id}/assign-driver`, method: 'PATCH', data: { driverId } }),
      invalidatesTags: ['Order'],
    }),
    createWalkInOrder: builder.mutation<
      Order,
      {
        customer: string;
        items: { clothType: string; service: string; quantity: number }[];
        isExpressDelivery?: boolean;
        isInStoreDelivery?: boolean;
        notes?: string;
      }
    >({
      query: (data) => ({ url: '/orders/walk-in', method: 'POST', data }),
      invalidatesTags: ['Order'],
    }),
    updateOrderItems: builder.mutation<Order, { id: string; items: { clothType: string; service: string; quantity: number }[] }>({
      query: ({ id, items }) => ({ url: `/orders/${id}/items`, method: 'PATCH', data: { items } }),
      invalidatesTags: ['Order'],
    }),
  }),
});

export const {
  useListOrdersQuery,
  useGetOrderByIdQuery,
  useAdvanceOrderStatusMutation,
  useUpdateStageEntryMutation,
  useAssignDeliveryDriverMutation,
  useCreateWalkInOrderMutation,
  useUpdateOrderItemsMutation,
} = orderApi;
