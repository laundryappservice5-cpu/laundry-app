import { apiSlice } from './apiSlice';
import type { Pickup, PickupStatus } from '../types';
import { withPagination, type Paginated } from './types';

export interface ListPickupsParams {
  status?: PickupStatus | PickupStatus[];
  driver?: string;
  createdToday?: boolean;
  page?: number;
  limit?: number;
}

export interface CreatePickupPayload {
  customer: string;
  pickupAddress: { address: string; landmark?: string; area?: string; geo?: { lat: number; lng: number } };
  pickupDate: string;
  pickupTime: string;
  servicesRequested: string[];
  specialInstructions?: string;
  assignedDriver?: string;
  isExpressPickup?: boolean;
  isExpressDelivery?: boolean;
  isInStoreDelivery?: boolean;
  notes?: string;
}

export const pickupApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listPickups: builder.query<Paginated<Pickup>, ListPickupsParams>({
      query: ({ status, ...rest }) => ({
        url: '/pickups',
        params: { ...rest, status: Array.isArray(status) ? status.join(',') : status },
      }),
      transformResponse: withPagination<Pickup>,
      providesTags: ['Pickup'],
    }),
    getPickupById: builder.query<Pickup, string>({
      query: (id) => ({ url: `/pickups/${id}` }),
      providesTags: ['Pickup'],
    }),
    createPickup: builder.mutation<Pickup, CreatePickupPayload>({
      query: (body) => ({ url: '/pickups', method: 'POST', data: body }),
      invalidatesTags: ['Pickup'],
    }),
    assignDriver: builder.mutation<Pickup, { id: string; driverId: string }>({
      query: ({ id, driverId }) => ({ url: `/pickups/${id}/assign-driver`, method: 'PATCH', data: { driverId } }),
      invalidatesTags: ['Pickup'],
    }),
    cancelPickup: builder.mutation<Pickup, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/pickups/${id}/cancel`, method: 'PATCH', data: { reason } }),
      invalidatesTags: ['Pickup'],
    }),
    updatePickupItems: builder.mutation<Pickup, { id: string; items: { clothType: string; service: string; quantity: number }[] }>({
      query: ({ id, items }) => ({ url: `/pickups/${id}/items`, method: 'PATCH', data: { items } }),
      invalidatesTags: ['Pickup', 'Order'],
    }),
  }),
});

export const {
  useListPickupsQuery,
  useGetPickupByIdQuery,
  useCreatePickupMutation,
  useAssignDriverMutation,
  useCancelPickupMutation,
  useUpdatePickupItemsMutation,
} = pickupApi;
