import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, paginated } from '../utils/apiResponse';
import { reportService } from '../services/report.service';
import { getPagination } from '../utils/pagination';

export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await reportService.dashboard());
});

export const revenueChart = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await reportService.revenueChart(Number(req.query.days) || 30));
});

export const orderStatusChart = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await reportService.orderStatusChart());
});

export const driverPerformance = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await reportService.driverPerformance());
});

export const adminPerformance = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await reportService.adminPerformance());
});

export const discounts = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await reportService.discountsReport());
});

export const payments = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const [items, total] = await reportService.paymentsReport(skip, limit);
  paginated(res, items, { page, limit, total });
});

export const repeatCustomers = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await reportService.repeatCustomers());
});

export const pendingVsCompleted = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await reportService.pendingVsCompleted());
});

export const expressOrders = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await reportService.expressOrdersReport());
});
