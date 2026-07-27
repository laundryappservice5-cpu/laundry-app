import { apiSlice } from './apiSlice';
import type { Currency } from '../utils/currencyStore';

export interface Settings {
  _id: string;
  businessName: string;
  taxRatePercent: number;
  currency: Currency;
  address?: string;
  supportPhone?: string;
  homePickupCharge: number;
  homeDeliveryCharge: number;
}

export const settingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query<Settings, void>({
      query: () => ({ url: '/settings' }),
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation<
      Settings,
      Partial<
        Pick<
          Settings,
          'businessName' | 'taxRatePercent' | 'currency' | 'address' | 'supportPhone' | 'homePickupCharge' | 'homeDeliveryCharge'
        >
      >
    >({
      query: (data) => ({ url: '/settings', method: 'PATCH', data }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
