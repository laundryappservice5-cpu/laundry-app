import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, paginated } from '../utils/apiResponse';
import { orderService } from '../services/order.service';
import { getPagination } from '../utils/pagination';
import { ApiError } from '../utils/ApiError';
import { OrderStage } from '../models/orderStages';
import { PaymentStatus } from '../models/Bill';

function splitCsv(value: unknown): string[] | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  return value.split(',').map((v) => v.trim()).filter(Boolean);
}

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const currentStatusList = splitCsv(req.query.currentStatus) as OrderStage[] | undefined;
  const [items, total] = await orderService.list(
    {
      currentStatus: currentStatusList && currentStatusList.length === 1 ? currentStatusList[0] : currentStatusList,
      excludeStatus: splitCsv(req.query.excludeStatus) as OrderStage[] | undefined,
      driver: req.query.driver as string | undefined,
      isExpress: req.query.isExpress === 'true',
      updatedToday: req.query.updatedToday === 'true',
      paymentStatus: req.query.paymentStatus as PaymentStatus | undefined,
    },
    skip,
    limit,
  );
  paginated(res, items, { page, limit, total });
});

export const myDeliveryJobs = asyncHandler(async (req: Request, res: Response) => {
  const items = await orderService.listForDriver(req.user!.userId);
  ok(res, items);
});

export const availableForDelivery = asyncHandler(async (_req: Request, res: Response) => {
  const items = await orderService.listAvailableForDelivery();
  ok(res, items);
});

export const myStoreDropoffs = asyncHandler(async (req: Request, res: Response) => {
  const items = await orderService.listMyStoreDropoffs(req.user!.userId);
  ok(res, items);
});

export const myOrderHistory = asyncHandler(async (req: Request, res: Response) => {
  const items = await orderService.listMyHistory(req.user!.userId);
  ok(res, items);
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  ok(res, order);
});

export const advanceStatus = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.advanceStatus(
    req.params.id,
    req.body.status,
    req.user!.userId,
    req.user!.role,
    req.body.remarks,
    req.body.itemCount,
  );
  ok(res, order);
});

export const updateStageEntry = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.updateStageEntry(req.params.id, req.user!.userId, req.user!.role, req.params.entryId, req.body);
  ok(res, order);
});

export const assignDeliveryDriver = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.assignDriver(req.params.id, req.user!.userId, req.user!.role, req.body.driverId);
  ok(res, order);
});

export const selfAssignDelivery = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.selfAssignDelivery(req.params.id, req.user!.userId, req.user!.role);
  ok(res, order);
});

export const createInStoreOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.createInStore(req.user!.userId, req.user!.role, req.body);
  ok(res, order, 201);
});

export const updateItems = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.updateItems(req.params.id, req.user!.userId, req.user!.role, req.body.items);
  ok(res, order);
});
