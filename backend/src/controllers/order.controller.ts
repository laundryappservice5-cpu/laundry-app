import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, paginated } from '../utils/apiResponse';
import { orderService } from '../services/order.service';
import { getPagination } from '../utils/pagination';
import { ApiError } from '../utils/ApiError';
import { OrderStage } from '../models/orderStages';
import { PaymentStatus, IBill } from '../models/Bill';
import { buildCsv } from '../utils/csv';
import type { IOrder } from '../models/Order';
import type { ICustomer } from '../models/Customer';

function splitCsv(value: unknown): string[] | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  return value.split(',').map((v) => v.trim()).filter(Boolean);
}

function buildOrderFilterFromQuery(req: Request) {
  const currentStatusList = splitCsv(req.query.currentStatus) as OrderStage[] | undefined;
  return {
    currentStatus: currentStatusList && currentStatusList.length === 1 ? currentStatusList[0] : currentStatusList,
    excludeStatus: splitCsv(req.query.excludeStatus) as OrderStage[] | undefined,
    driver: req.query.driver as string | undefined,
    isExpress: req.query.isExpress === 'true',
    updatedToday: req.query.updatedToday === 'true',
    paymentStatus: req.query.paymentStatus as PaymentStatus | undefined,
    search: req.query.search as string | undefined,
    service: req.query.service as string | undefined,
    dateFrom: req.query.dateFrom as string | undefined,
    dateTo: req.query.dateTo as string | undefined,
    minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
    maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined,
  };
}

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const [items, total] = await orderService.list(buildOrderFilterFromQuery(req), skip, limit);
  paginated(res, items, { page, limit, total });
});

export const exportOrders = asyncHandler(async (req: Request, res: Response) => {
  const [items] = await orderService.list(buildOrderFilterFromQuery(req), 0, 100000);

  const csv = buildCsv<IOrder>(
    [
      { header: 'Order ID', accessor: (o) => String(o._id).slice(-8).toUpperCase() },
      { header: 'Customer', accessor: (o) => (o.customer as unknown as ICustomer)?.name ?? '' },
      { header: 'Phone', accessor: (o) => (o.customer as unknown as ICustomer)?.mobileNumber ?? '' },
      { header: 'Status', accessor: (o) => o.currentStatus },
      { header: 'Payment Status', accessor: (o) => (o.bill as unknown as IBill)?.paymentStatus ?? '' },
      { header: 'Amount', accessor: (o) => (o.bill as unknown as IBill)?.finalAmount ?? 0 },
      { header: 'Created At', accessor: (o) => new Date(o.createdAt).toISOString() },
    ],
    items,
  );

  res.type('text/csv').attachment('orders.csv').send(csv);
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
