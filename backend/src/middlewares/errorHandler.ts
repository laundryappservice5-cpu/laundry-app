import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({ success: false, message: 'Validation error', details: err.flatten() });
    return;
  }

  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { stack: err.stack, details: err.details });
    }
    res.status(err.statusCode).json({ success: false, message: err.message, details: err.details });
    return;
  }

  const error = err as Error & { code?: number };
  if (error?.code === 11000) {
    res.status(409).json({ success: false, message: 'Duplicate value violates a unique constraint' });
    return;
  }

  logger.error(error?.message ?? 'Unknown error', { stack: error?.stack });
  res.status(500).json({ success: false, message: 'Internal server error' });
}
