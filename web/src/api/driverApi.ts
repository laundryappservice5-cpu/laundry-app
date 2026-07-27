import { apiSlice } from './apiSlice';
import type { PublicUser } from '../types';

export const driverApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listDrivers: builder.query<PublicUser[], { active?: boolean } | void>({
      query: (params) => ({ url: '/drivers', params: params ?? undefined }),
      providesTags: ['Driver'],
    }),
    createDriver: builder.mutation<PublicUser, { name: string; mobileNumber: string; password: string; vehicleNumber?: string }>({
      query: (body) => ({ url: '/drivers', method: 'POST', data: body }),
      invalidatesTags: ['Driver'],
    }),
    setDriverActive: builder.mutation<PublicUser, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({ url: `/drivers/${id}/active`, method: 'PATCH', data: { isActive } }),
      invalidatesTags: ['Driver'],
    }),
  }),
});

export const { useListDriversQuery, useCreateDriverMutation, useSetDriverActiveMutation } = driverApi;
