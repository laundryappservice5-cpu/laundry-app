import { z } from 'zod';

export const createClothTypeSchema = z.object({
  name: z.string().min(1),
});

export const createServiceSchema = z.object({
  name: z.string().min(1),
});

export const updateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const setClothTypePriceSchema = z.object({
  service: z.string().min(1),
  price: z.number().nonnegative(),
});
