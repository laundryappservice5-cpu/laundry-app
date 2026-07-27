import { apiSlice } from './apiSlice';
import type { Bill, Customer, Order, Pickup } from '../types';

export interface GlobalSearchResult {
  customers: Customer[];
  pickups: Pickup[];
  orders: Order[];
  bills: Bill[];
}

export const searchApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    globalSearch: builder.query<GlobalSearchResult, string>({
      query: (q) => ({ url: '/search', params: { q } }),
    }),
  }),
});

export const { useLazyGlobalSearchQuery } = searchApi;
