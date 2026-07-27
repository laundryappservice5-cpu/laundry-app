import { z } from 'zod';

export const updateSettingsSchema = z.object({
  businessName: z.string().min(1).optional(),
  taxRatePercent: z.number().min(0).max(100).optional(),
  currency: z.enum(['INR', 'AED']).optional(),
  address: z.string().optional(),
  supportPhone: z.string().optional(),
  homePickupCharge: z.number().min(0).optional(),
  homeDeliveryCharge: z.number().min(0).optional(),
});
