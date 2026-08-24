import { apiSlice } from './apiSlice';
import type { Currency } from '../utils/currencyStore';

export interface Settings {
  _id: string;
  businessName: string;
  taxRatePercent: number;
  currency: Currency;
  address?: string;
  supportPhone?: string;
  email?: string;
  taxId?: string;
  homePickupCharge: number;
  homeDeliveryCharge: number;
  latestApkUrl?: string;
  latestApkVersion?: string;
}

export interface PublicAppInfo {
  businessName: string;
  latestApkUrl?: string;
  latestApkVersion?: string;
  updatedAt: string;
}

export const settingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query<Settings, void>({
      query: () => ({ url: '/settings' }),
      providesTags: ['Settings'],
    }),
    getPublicAppInfo: builder.query<PublicAppInfo, void>({
      query: () => ({ url: '/settings/app-info' }),
    }),
    updateSettings: builder.mutation<
      Settings,
      Partial<
        Pick<
          Settings,
          | 'businessName'
          | 'taxRatePercent'
          | 'currency'
          | 'address'
          | 'supportPhone'
          | 'email'
          | 'taxId'
          | 'homePickupCharge'
          | 'homeDeliveryCharge'
          | 'latestApkUrl'
          | 'latestApkVersion'
        >
      >
    >({
      query: (data) => ({ url: '/settings', method: 'PATCH', data }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const { useGetSettingsQuery, useGetPublicAppInfoQuery, useUpdateSettingsMutation } = settingsApi;
