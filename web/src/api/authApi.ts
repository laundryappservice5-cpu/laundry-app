import { apiSlice } from './apiSlice';
import type { PublicUser } from '../types';

interface LoginResponse {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { mobileNumber: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', data: body }),
    }),
    me: builder.query<PublicUser, void>({
      query: () => ({ url: '/auth/me' }),
    }),
    changePassword: builder.mutation<{ message: string }, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', data: body }),
    }),
    createAdmin: builder.mutation<PublicUser, { name: string; mobileNumber: string; password: string; confirmPassword: string }>({
      query: (body) => ({ url: '/auth/admins', method: 'POST', data: body }),
    }),
  }),
});

export const { useLoginMutation, useMeQuery, useChangePasswordMutation, useCreateAdminMutation } = authApi;
