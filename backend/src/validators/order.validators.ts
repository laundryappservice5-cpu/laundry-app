import { z } from 'zod';
import { ORDER_STAGES } from '../models/orderStages';

export const advanceOrderStatusSchema = z.object({
  status: z.enum(ORDER_STAGES),
  remarks: z.string().optional(),
  itemCount: z.number().int().nonnegative().optional(),
});

export const updateServiceStatusSchema = z.object({
  isCompleted: z.boolean(),
});

export const updateStageEntrySchema = z.object({
  itemCount: z.number().int().nonnegative().optional(),
  remarks: z.string().optional(),
});

export const assignDeliveryDriverSchema = z.object({
  driverId: z.string().min(1),
});

export const addOrderServiceSchema = z.object({
  serviceId: z.string().min(1),
});

export const createInStoreOrderSchema = z.object({
  customer: z.string().min(1),
  servicesRequested: z.array(z.string().min(1)).min(1),
  items: z.array(z.object({ clothType: z.string().min(1), quantity: z.number().int().min(1) })).min(1),
  isExpressDelivery: z.boolean().optional(),
  isInStoreDelivery: z.boolean().optional(),
  notes: z.string().optional(),
});

export const updateOrderItemsSchema = z.object({
  items: z.array(z.object({ clothType: z.string().min(1), quantity: z.number().int().min(1) })).min(1),
});

export const listOrdersQuerySchema = z.object({
  currentStatus: z.string().optional(),
  driver: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
