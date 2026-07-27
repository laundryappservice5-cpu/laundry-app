import sharp from 'sharp';
import { getCloudinary } from '../config/cloudinary';
import { isCloudinaryConfigured } from '../config/env';
import { ApiError } from '../utils/ApiError';

export const uploadService = {
  async uploadImage(buffer: Buffer, folder: string): Promise<string> {
    if (!isCloudinaryConfigured()) {
      throw ApiError.serviceUnavailable('Image storage (Cloudinary) is not configured yet');
    }
    const compressed = await sharp(buffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();

    const cloudinary = getCloudinary();

    return new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `laundry/${folder}`, resource_type: 'image' },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }
          resolve(result.secure_url);
        },
      );
      uploadStream.end(compressed);
    });
  },
};
