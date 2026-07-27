import { apiSlice } from './apiSlice';
import type { ClothType } from '../types';

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
  }),
});

export const { useListClothTypesQuery, useCreateClothTypeMutation } = catalogApi;
