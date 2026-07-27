import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function getPagination(req: Request): PaginationParams {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}
