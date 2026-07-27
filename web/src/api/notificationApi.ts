import { apiSlice } from './apiSlice';
import type { AppNotification } from '../types';

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listNotifications: builder.query<AppNotification[], { page?: number; limit?: number } | void>({
      query: (params) => ({ url: '/notifications', params: params ?? undefined }),
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation<AppNotification, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const { useListNotificationsQuery, useMarkNotificationReadMutation } = notificationApi;
