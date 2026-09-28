import { z } from 'zod';

export const updateSettingsSchema = z.object({
  businessName: z.string().min(1).optional(),
  taxRatePercent: z.number().min(0).max(100).optional(),
  currency: z.enum(['INR', 'AED']).optional(),
  address: z.string().optional(),
  supportPhone: z.string().optional(),
  email: z.string().optional(),
  taxId: z.string().optional(),
  homePickupCharge: z.number().min(0).optional(),
  homeDeliveryCharge: z.number().min(0).optional(),
  latestApkUrl: z.union([z.string().url(), z.literal('')]).optional(),
  latestApkVersion: z.string().optional(),
  appVersion: z.union([z.literal(1), z.literal(2)]).optional(),
});
