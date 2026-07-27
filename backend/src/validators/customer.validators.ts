import { z } from 'zod';

const addressSchema = z.object({
  label: z.string().optional(),
  address: z.string().min(3),
  landmark: z.string().optional(),
  area: z.string().optional(),
  geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
  isDefault: z.boolean().optional(),
});

export const createCustomerSchema = z.object({
  name: z.string().min(2),
  mobileNumber: z.string().min(10).max(15),
  alternateMobile: z.string().optional(),
  addresses: z.array(addressSchema).optional(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial().omit({ mobileNumber: true });

export const addAddressSchema = addressSchema;

export const searchCustomerQuerySchema = z.object({
  q: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
