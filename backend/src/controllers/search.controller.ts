import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { searchService } from '../services/search.service';

export const globalSearch = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.q ?? '').trim();
  if (!q) throw ApiError.badRequest('Query parameter "q" is required');
  const results = await searchService.globalSearch(q);
  ok(res, results);
});
