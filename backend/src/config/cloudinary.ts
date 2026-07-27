import { v2 as cloudinary } from 'cloudinary';
import { env, isCloudinaryConfigured } from './env';

let configured = false;

export function getCloudinary(): typeof cloudinary {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.',
    );
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: env.cloudinary.cloudName,
      api_key: env.cloudinary.apiKey,
      api_secret: env.cloudinary.apiSecret,
    });
    configured = true;
  }
  return cloudinary;
}
