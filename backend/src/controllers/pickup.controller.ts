import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, paginated } from '../utils/apiResponse';
import { pickupService } from '../services/pickup.service';
import { getPagination } from '../utils/pagination';
import { ApiError } from '../utils/ApiError';
import { PickupStatus } from '../models/Pickup';

function splitCsv(value: unknown): string[] | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  return value.split(',').map((v) => v.trim()).filter(Boolean);
}

export const createPickup = asyncHandler(async (req: Request, res: Response) => {
  const pickup = await pickupService.create(req.user!.userId, req.user!.role, req.body);
  ok(res, pickup, 201);
});

export const listPickups = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const statusList = splitCsv(req.query.status) as PickupStatus[] | undefined;
  const [items, total] = await pickupService.list(
    {
      status: statusList && statusList.length === 1 ? statusList[0] : statusList,
      driver: req.query.driver as string | undefined,
      createdToday: req.query.createdToday === 'true',
    },
    skip,
    limit,
  );
  paginated(res, items, { page, limit, total });
});

export const myAssignedPickups = asyncHandler(async (req: Request, res: Response) => {
  const items = await pickupService.listForDriver(req.user!.userId);
  ok(res, items);
});

export const availablePickups = asyncHandler(async (_req: Request, res: Response) => {
  const items = await pickupService.listAvailable();
  ok(res, items);
});

export const myPickupHistory = asyncHandler(async (req: Request, res: Response) => {
  const items = await pickupService.listMyHistory(req.user!.userId);
  ok(res, items);
});

export const selfAssignPickup = asyncHandler(async (req: Request, res: Response) => {
  const pickup = await pickupService.selfAssign(req.user!.userId, req.user!.role, req.params.id);
  ok(res, pickup);
});

export const getPickupById = asyncHandler(async (req: Request, res: Response) => {
  const pickup = await pickupService.findById(req.params.id);
  if (!pickup) throw ApiError.notFound('Pickup not found');
  ok(res, pickup);
});

export const assignDriver = asyncHandler(async (req: Request, res: Response) => {
  const pickup = await pickupService.assignDriver(req.user!.userId, req.user!.role, req.params.id, req.body.driverId);
  ok(res, pickup);
});

export const acceptPickup = asyncHandler(async (req: Request, res: Response) => {
  const pickup = await pickupService.accept(req.user!.userId, req.user!.role, req.params.id);
  ok(res, pickup);
});

export const cancelPickup = asyncHandler(async (req: Request, res: Response) => {
  const pickup = await pickupService.cancel(req.user!.userId, req.user!.role, req.params.id, req.body.reason);
  ok(res, pickup);
});

export const updateCollectedItems = asyncHandler(async (req: Request, res: Response) => {
  const pickup = await pickupService.updateCollectedItems(req.user!.userId, req.user!.role, req.params.id, req.body.items);
  ok(res, pickup);
});

export const adminUpdateCollectedItems = asyncHandler(async (req: Request, res: Response) => {
  const pickup = await pickupService.adminUpdateCollectedItems(req.user!.userId, req.user!.role, req.params.id, req.body.items);
  ok(res, pickup);
});

export const completePickup = asyncHandler(async (req: Request, res: Response) => {
  const result = await pickupService.complete(req.user!.userId, req.user!.role, req.params.id, req.body);
  ok(res, result);
});
