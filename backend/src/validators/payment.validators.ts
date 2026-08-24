import { z } from 'zod';

export const settlePaymentsSchema = z.object({
  paymentIds: z.array(z.string()).min(1),
});
