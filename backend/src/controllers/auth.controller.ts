import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/apiResponse';
import { authService } from '../services/auth.service';
import { userRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/ApiError';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { mobileNumber, password, fcmToken } = req.body;
  const result = await authService.login(mobileNumber, password, fcmToken);
  ok(res, result);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.refresh(refreshToken);
  ok(res, result);
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user!.userId, currentPassword, newPassword);
  ok(res, { message: 'Password changed successfully' });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await userRepository.findById(req.user!.userId);
  if (!user) throw ApiError.notFound('User not found');
  ok(res, authService.toPublicUser(user));
});

export const createAdmin = asyncHandler(async (req: Request, res: Response) => {
  const admin = await authService.createAdmin(req.user!.userId, req.user!.role, req.body);
  ok(res, admin, 201);
});

export const registerFcmToken = asyncHandler(async (req: Request, res: Response) => {
  await userRepository.addFcmToken(req.user!.userId, req.body.fcmToken);
  ok(res, { message: 'Token registered' });
});
