import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { uploadService } from '../services/upload.service';

export const uploadImages = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  if (files.length === 0) throw ApiError.badRequest('No files uploaded');
  const folder = String(req.query.folder ?? 'misc');
  const urls = await Promise.all(files.map((file) => uploadService.uploadImage(file.buffer, folder)));
  ok(res, { urls });
});
