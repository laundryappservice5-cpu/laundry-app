import { z } from 'zod';

export const generateBillSchema = z
  .object({
    extraCharges: z.number().nonnegative().optional(),
    taxes: z.number().nonnegative().optional(),
    pickupCharge: z.number().nonnegative().optional(),
    deliveryCharge: z.number().nonnegative().optional(),
    discountAmount: z.number().nonnegative().optional(),
    discountReason: z.string().min(1).optional(),
  })
  .refine((data) => !data.discountAmount || data.discountReason, {
    message: 'A reason is required when applying a discount',
    path: ['discountReason'],
  });

export const applyDiscountSchema = z.object({
  discountAmount: z.number().positive(),
  reason: z.string().min(1),
});

export const recordPaymentSchema = z.object({
  splits: z
    .array(
      z.object({
        amount: z.number().positive(),
        method: z.enum(['CASH', 'UPI', 'CARD']),
      }),
    )
    .min(1),
});
