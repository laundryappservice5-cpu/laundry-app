import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../models/User';

export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
  mobileNumber: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn as SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn as SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, env.jwt.refreshSecret) as { userId: string };
}
