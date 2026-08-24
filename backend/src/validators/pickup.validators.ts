import { z } from 'zod';

const addressSchema = z.object({
  address: z.string().min(3),
  landmark: z.string().optional(),
  area: z.string().optional(),
  geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
});

export const createPickupSchema = z.object({
  customer: z.string().min(1),
  pickupAddress: addressSchema,
  pickupDate: z.coerce.date(),
  pickupTime: z.string().min(1),
  servicesRequested: z.array(z.string()).min(1),
  specialInstructions: z.string().optional(),
  assignedDriver: z.string().optional(),
  isExpressPickup: z.boolean().optional(),
  isExpressDelivery: z.boolean().optional(),
  isInStoreDelivery: z.boolean().optional(),
  notes: z.string().optional(),
});

export const assignDriverSchema = z.object({
  driverId: z.string().min(1),
});

export const collectedItemsSchema = z.object({
  items: z.array(z.object({ clothType: z.string().min(1).optional(), service: z.string().min(1), quantity: z.number().int().min(1) })).min(1),
});

export const completePickupSchema = z.object({
  items: z.array(z.object({ clothType: z.string().min(1).optional(), service: z.string().min(1), quantity: z.number().int().min(1) })).min(1),
  images: z.array(z.string()).optional(),
  pickupRemarks: z.string().optional(),
  damagedItemNotes: z.string().optional(),
  gpsLocation: z.object({ lat: z.number(), lng: z.number() }).optional(),
});

export const cancelPickupSchema = z.object({
  reason: z.string().min(1),
});

export const listPickupsQuerySchema = z.object({
  status: z.string().optional(),
  driver: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
