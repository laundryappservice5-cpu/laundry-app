import { apiSlice } from './apiSlice';
import type { ClothType, Service } from '../types';

export const catalogApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listClothTypes: builder.query<ClothType[], void>({
      query: () => ({ url: '/cloth-types' }),
      providesTags: ['ClothType'],
    }),
    createClothType: builder.mutation<ClothType, { name: string }>({
      query: (body) => ({ url: '/cloth-types', method: 'POST', data: body }),
      invalidatesTags: ['ClothType'],
    }),
    listServices: builder.query<Service[], void>({
      query: () => ({ url: '/services' }),
      providesTags: ['Service'],
    }),
  }),
});

export const { useListClothTypesQuery, useCreateClothTypeMutation, useListServicesQuery } = catalogApi;
