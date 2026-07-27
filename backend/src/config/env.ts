import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean),

  mongodbUri: required('MONGODB_URI'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '180d',
  },

  rootAdmin: {
    mobileNumber: process.env.ROOT_ADMIN_MOBILE,
    password: process.env.ROOT_ADMIN_PASSWORD,
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  },

  fcm: {
    serviceAccountJson: process.env.FCM_SERVICE_ACCOUNT_JSON ?? '',
  },

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000),
    max: Number(process.env.RATE_LIMIT_MAX ?? 300),
  },
};

export const isCloudinaryConfigured = (): boolean =>
  Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);

export const isFcmConfigured = (): boolean => Boolean(env.fcm.serviceAccountJson);
