import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/apiResponse';
import { paymentService } from '../services/payment.service';

export const pendingByDriver = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await paymentService.pendingByDriver());
});

export const pendingForDriver = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await paymentService.pendingForDriver(req.params.driverId));
});

export const settle = asyncHandler(async (req: Request, res: Response) => {
  const payments = await paymentService.settle(req.user!.userId, req.user!.role, req.body.paymentIds);
  ok(res, payments);
});
