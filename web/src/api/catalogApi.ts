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
    setClothTypePrice: builder.mutation<ClothType, { id: string; service: string; price: number }>({
      query: ({ id, ...data }) => ({ url: `/cloth-types/${id}/price`, method: 'PATCH', data }),
      invalidatesTags: ['ClothType'],
    }),
    listServices: builder.query<Service[], void>({
      query: () => ({ url: '/services' }),
      providesTags: ['Service'],
    }),
  }),
});

export const {
  useListClothTypesQuery,
  useCreateClothTypeMutation,
  useSetClothTypePriceMutation,
  useListServicesQuery,
} = catalogApi;
