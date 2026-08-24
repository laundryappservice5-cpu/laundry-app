import { z } from 'zod';

export const createClothTypeSchema = z.object({
  name: z.string().min(1),
  icon: z.string().min(1).optional(),
});

export const createServiceSchema = z.object({
  name: z.string().min(1),
  flatPrice: z.number().positive().optional(),
});

export const updateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  flatPrice: z.number().positive().nullable().optional(),
});

export const setClothTypePriceSchema = z.object({
  service: z.string().min(1),
  price: z.number().nonnegative(),
});

export const setClothTypeIconSchema = z.object({
  icon: z.string().min(1),
});
