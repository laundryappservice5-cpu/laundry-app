import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, paginated } from '../utils/apiResponse';
import { customerService } from '../services/customer.service';
import { customerRepository } from '../repositories/customer.repository';
import { getPagination } from '../utils/pagination';
import { ApiError } from '../utils/ApiError';

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.create(req.user!.userId, req.user!.role, req.body);
  ok(res, customer, 201);
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.update(req.user!.userId, req.user!.role, req.params.id, req.body);
  ok(res, customer);
});

export const getCustomerById = asyncHandler(async (req: Request, res: Response) => {
  const result = await customerService.getById(req.params.id);
  ok(res, result);
});

export const getCustomerByMobile = asyncHandler(async (req: Request, res: Response) => {
  const result = await customerService.getByMobile(req.params.mobileNumber);
  if (!result) throw ApiError.notFound('Customer not found');
  ok(res, result);
});

export const searchCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const [items, total] = await customerRepository.search(String(req.query.q ?? ''), skip, limit);
  paginated(res, items, { page, limit, total });
});
