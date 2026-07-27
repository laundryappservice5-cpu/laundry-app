import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/apiResponse';
import { authService } from '../services/auth.service';
import { userRepository } from '../repositories/user.repository';
import { recordAudit } from '../audit/recordAudit';
import { ApiError } from '../utils/ApiError';

export const createDriver = asyncHandler(async (req: Request, res: Response) => {
  const driver = await authService.createDriver(req.user!.userId, req.user!.role, req.body);
  ok(res, driver, 201);
});

export const listDrivers = asyncHandler(async (req: Request, res: Response) => {
  const activeParam = req.query.active;
  const isActive = activeParam === 'true' ? true : activeParam === 'false' ? false : undefined;
  const drivers = await userRepository.listByRole('DRIVER', isActive);
  ok(res, drivers.map(authService.toPublicUser));
});

export const setDriverActive = asyncHandler(async (req: Request, res: Response) => {
  const driver = await userRepository.findById(req.params.id);
  if (!driver || driver.role !== 'DRIVER') throw ApiError.notFound('Driver not found');
  const before = driver.isActive;
  const updated = await userRepository.update(req.params.id, { isActive: req.body.isActive });
  await recordAudit({
    actor: req.user!.userId,
    actorRole: req.user!.role,
    action: 'SET_DRIVER_ACTIVE',
    entityType: 'User',
    entityId: req.params.id,
    before: { isActive: before },
    after: { isActive: req.body.isActive },
  });
  ok(res, authService.toPublicUser(updated!));
});
