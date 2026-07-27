import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAccessTokenForClient, setAccessTokenForClient } from './tokenStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

export const axiosClient = axios.create({ baseURL: API_BASE_URL });

let onUnauthorized: (() => void) | null = null;
let onTokenRefreshed: ((accessToken: string) => void) | null = null;

export function registerAuthHandlers(handlers: {
  onUnauthorized: () => void;
  onTokenRefreshed: (accessToken: string) => void;
}): void {
  onUnauthorized = handlers.onUnauthorized;
  onTokenRefreshed = handlers.onTokenRefreshed;
}

axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessTokenForClient();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
  const accessToken = res.data.data.accessToken as string;
  setAccessTokenForClient(accessToken);
  onTokenRefreshed?.(accessToken);
  return accessToken;
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      originalRequest._retry = true;
      try {
        refreshPromise = refreshPromise ?? refreshAccessToken();
        const newToken = await refreshPromise;
        refreshPromise = null;
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        onUnauthorized?.();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
