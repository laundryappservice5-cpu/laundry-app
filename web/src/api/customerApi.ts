import { apiSlice } from './apiSlice';
import type { Customer, Order, Pickup } from '../types';
import { withPagination, type Paginated } from './types';

interface CustomerWithHistory {
  customer: Customer;
  pickupHistory: Pickup[];
  orderHistory: Order[];
}

export const customerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    searchCustomers: builder.query<Paginated<Customer>, { q: string; page?: number; limit?: number }>({
      query: ({ q, page = 1, limit = 20 }) => ({ url: '/customers/search', params: { q, page, limit } }),
      transformResponse: withPagination<Customer>,
      providesTags: ['Customer'],
    }),
    getCustomerByMobile: builder.query<CustomerWithHistory, string>({
      query: (mobileNumber) => ({ url: `/customers/by-mobile/${mobileNumber}` }),
      providesTags: ['Customer'],
    }),
    getCustomerById: builder.query<CustomerWithHistory, string>({
      query: (id) => ({ url: `/customers/${id}` }),
      providesTags: ['Customer'],
    }),
    createCustomer: builder.mutation<Customer, Partial<Customer>>({
      query: (body) => ({ url: '/customers', method: 'POST', data: body }),
      invalidatesTags: ['Customer'],
    }),
    updateCustomer: builder.mutation<Customer, { id: string; data: Partial<Customer> }>({
      query: ({ id, data }) => ({ url: `/customers/${id}`, method: 'PATCH', data }),
      invalidatesTags: ['Customer'],
    }),
  }),
});

export const {
  useSearchCustomersQuery,
  useLazySearchCustomersQuery,
  useGetCustomerByMobileQuery,
  useLazyGetCustomerByMobileQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
} = customerApi;
