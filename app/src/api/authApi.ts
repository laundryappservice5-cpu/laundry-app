import { apiSlice } from './apiSlice';
import type { PublicUser } from '../types';

interface LoginResponse {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { mobileNumber: string; password: string; fcmToken?: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', data: body }),
    }),
    me: builder.query<PublicUser, void>({
      query: () => ({ url: '/auth/me' }),
    }),
    registerFcmToken: builder.mutation<{ message: string }, string>({
      query: (fcmToken) => ({ url: '/auth/fcm-token', method: 'POST', data: { fcmToken } }),
    }),
    changePassword: builder.mutation<{ message: string }, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', data: body }),
    }),
  }),
});

export const { useLoginMutation, useMeQuery, useRegisterFcmTokenMutation, useChangePasswordMutation } = authApi;
