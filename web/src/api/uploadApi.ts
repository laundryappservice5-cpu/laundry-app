import { apiSlice } from './apiSlice';

export const uploadApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    uploadImages: builder.mutation<{ urls: string[] }, { files: File[]; folder?: string }>({
      query: ({ files, folder = 'misc' }) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('images', file));
        return { url: '/uploads', method: 'POST', data: formData, params: { folder } };
      },
    }),
  }),
});

export const { useUploadImagesMutation } = uploadApi;
