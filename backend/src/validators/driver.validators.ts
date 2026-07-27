import { z } from 'zod';

export { createDriverSchema } from './auth.validators';

export const setDriverActiveSchema = z.object({
  isActive: z.boolean(),
});
