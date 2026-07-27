import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken, AccessTokenPayload } from '../utils/jwt';
import { UserRole } from '../models/User';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or invalid Authorization header');
  }
  const token = header.slice('Bearer '.length);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }
    next();
  };
}
