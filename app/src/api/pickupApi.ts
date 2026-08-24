import { apiSlice } from './apiSlice';
import type { Pickup } from '../types';

export const pickupApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    myAssignedPickups: builder.query<Pickup[], void>({
      query: () => ({ url: '/pickups/my-assigned' }),
      providesTags: ['Pickup'],
    }),
    availablePickups: builder.query<Pickup[], void>({
      query: () => ({ url: '/pickups/available' }),
      providesTags: ['Pickup'],
    }),
    myPickupHistory: builder.query<Pickup[], void>({
      query: () => ({ url: '/pickups/my-history' }),
      providesTags: ['Pickup'],
    }),
    getPickupById: builder.query<Pickup, string>({
      query: (id) => ({ url: `/pickups/${id}` }),
      providesTags: ['Pickup'],
    }),
    selfAssignPickup: builder.mutation<Pickup, string>({
      query: (id) => ({ url: `/pickups/${id}/self-assign`, method: 'PATCH' }),
      invalidatesTags: ['Pickup'],
    }),
    acceptPickup: builder.mutation<Pickup, string>({
      query: (id) => ({ url: `/pickups/${id}/accept`, method: 'PATCH' }),
      invalidatesTags: ['Pickup'],
    }),
    updateCollectedItems: builder.mutation<Pickup, { id: string; items: { clothType?: string; service: string; quantity: number }[] }>({
      query: ({ id, items }) => ({ url: `/pickups/${id}/collected-items`, method: 'PATCH', data: { items } }),
      invalidatesTags: ['Pickup'],
    }),
    completePickup: builder.mutation<
      { pickup: Pickup; order: unknown },
      {
        id: string;
        items: { clothType?: string; service: string; quantity: number }[];
        images?: string[];
        pickupRemarks?: string;
        damagedItemNotes?: string;
      }
    >({
      query: ({ id, ...data }) => ({ url: `/pickups/${id}/complete`, method: 'PATCH', data }),
      invalidatesTags: ['Pickup', 'Order'],
    }),
  }),
});

export const {
  useMyAssignedPickupsQuery,
  useAvailablePickupsQuery,
  useMyPickupHistoryQuery,
  useGetPickupByIdQuery,
  useSelfAssignPickupMutation,
  useAcceptPickupMutation,
  useUpdateCollectedItemsMutation,
  useCompletePickupMutation,
} = pickupApi;
