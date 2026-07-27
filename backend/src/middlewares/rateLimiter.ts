import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const generalRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});
