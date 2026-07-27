import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import { axiosClient } from '../utils/axiosClient';
import type { ApiError } from '../types';

interface AxiosBaseQueryArgs {
  url: string;
  method?: AxiosRequestConfig['method'];
  data?: unknown;
  params?: unknown;
}

const axiosBaseQuery: BaseQueryFn<AxiosBaseQueryArgs, unknown, ApiError> = async ({ url, method = 'GET', data, params }) => {
  try {
    const result = await axiosClient.request({ url, method, data, params });
    return { data: result.data.data, meta: result.data.meta };
  } catch (err) {
    const axiosError = err as AxiosError<ApiError>;
    return {
      error: axiosError.response?.data ?? { success: false, message: axiosError.message },
    };
  }
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery,
  tagTypes: [
    'Customer',
    'ClothType',
    'Service',
    'Driver',
    'Pickup',
    'Order',
    'Bill',
    'Notification',
    'Report',
    'Settings',
  ],
  endpoints: () => ({}),
});
