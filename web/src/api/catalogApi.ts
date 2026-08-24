import { apiSlice } from './apiSlice';
import type { ClothType, Service } from '../types';

export const catalogApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listClothTypes: builder.query<ClothType[], void>({
      query: () => ({ url: '/cloth-types' }),
      providesTags: ['ClothType'],
    }),
    createClothType: builder.mutation<ClothType, { name: string; icon?: string }>({
      query: (body) => ({ url: '/cloth-types', method: 'POST', data: body }),
      invalidatesTags: ['ClothType'],
    }),
    setClothTypePrice: builder.mutation<ClothType, { id: string; service: string; price: number }>({
      query: ({ id, ...data }) => ({ url: `/cloth-types/${id}/price`, method: 'PATCH', data }),
      invalidatesTags: ['ClothType'],
    }),
    setClothTypeIcon: builder.mutation<ClothType, { id: string; icon: string }>({
      query: ({ id, icon }) => ({ url: `/cloth-types/${id}/icon`, method: 'PATCH', data: { icon } }),
      invalidatesTags: ['ClothType'],
    }),
    deleteClothType: builder.mutation<{ deleted: true }, string>({
      query: (id) => ({ url: `/cloth-types/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ClothType'],
    }),
    listServices: builder.query<Service[], void>({
      query: () => ({ url: '/services' }),
      providesTags: ['Service'],
    }),
    updateService: builder.mutation<Service, { id: string; flatPrice?: number | null; name?: string; isActive?: boolean }>({
      query: ({ id, ...data }) => ({ url: `/services/${id}`, method: 'PATCH', data }),
      invalidatesTags: ['Service'],
    }),
    deleteService: builder.mutation<{ deleted: true }, string>({
      query: (id) => ({ url: `/services/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Service'],
    }),
  }),
});

export const {
  useListClothTypesQuery,
  useCreateClothTypeMutation,
  useSetClothTypePriceMutation,
  useSetClothTypeIconMutation,
  useDeleteClothTypeMutation,
  useListServicesQuery,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} = catalogApi;
