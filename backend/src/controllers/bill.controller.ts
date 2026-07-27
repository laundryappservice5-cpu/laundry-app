import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/apiResponse';
import { billService } from '../services/bill.service';
import { ApiError } from '../utils/ApiError';

export const generateBill = asyncHandler(async (req: Request, res: Response) => {
  const bill = await billService.generate(req.user!.userId, req.user!.role, req.params.orderId, req.body);
  ok(res, bill, 201);
});

export const getBillById = asyncHandler(async (req: Request, res: Response) => {
  const bill = await billService.findById(req.params.id);
  if (!bill) throw ApiError.notFound('Bill not found');
  ok(res, bill);
});

export const applyDiscount = asyncHandler(async (req: Request, res: Response) => {
  const bill = await billService.applyDiscount(req.user!.userId, req.user!.role, req.params.id, req.body.discountAmount, req.body.reason);
  ok(res, bill);
});

export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
  const result = await billService.recordPayment(req.user!.userId, req.user!.role, req.params.id, req.body.amount, req.body.method);
  ok(res, result, 201);
});
