import { z } from 'zod';

export const loginSchema = z.object({
  mobileNumber: z.string().min(10).max(15),
  password: z.string().min(6),
  fcmToken: z.string().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export const createAdminSchema = z.object({
  name: z.string().min(2),
  mobileNumber: z.string().min(10).max(15),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const createDriverSchema = z.object({
  name: z.string().min(2),
  mobileNumber: z.string().min(10).max(15),
  password: z.string().min(6),
  vehicleNumber: z.string().optional(),
});

export const fcmTokenSchema = z.object({
  fcmToken: z.string().min(10),
});
