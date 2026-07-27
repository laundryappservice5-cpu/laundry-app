import { apiSlice } from './apiSlice';

export interface PickedImage {
  uri: string;
  name: string;
  type: string;
}

export const uploadApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    uploadImages: builder.mutation<{ urls: string[] }, { files: PickedImage[]; folder?: string }>({
      query: ({ files, folder = 'pickups' }) => {
        const formData = new FormData();
        files.forEach((file) => {
          // React Native's FormData accepts {uri, name, type} objects for file fields.
          formData.append('images', file as unknown as Blob);
        });
        return { url: '/uploads', method: 'POST', data: formData, params: { folder } };
      },
    }),
  }),
});

export const { useUploadImagesMutation } = uploadApi;
