import { apiSlice } from './apiSlice';
import type { Currency } from '../utils/currencyStore';

export interface Settings {
  _id: string;
  businessName: string;
  taxRatePercent: number;
  currency: Currency;
  address?: string;
  supportPhone?: string;
}

export const settingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query<Settings, void>({
      query: () => ({ url: '/settings' }),
      providesTags: ['Settings'],
    }),
  }),
});

export const { useGetSettingsQuery } = settingsApi;
