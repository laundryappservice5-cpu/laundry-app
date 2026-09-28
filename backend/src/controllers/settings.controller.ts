import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { getSettings, Settings } from '../models/Settings';
import { recordAudit } from '../audit/recordAudit';

export const getSettingsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await getSettings();
  ok(res, settings);
});

export const getPublicAppInfoHandler = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await getSettings();
  ok(res, {
    businessName: settings.businessName,
    latestApkUrl: settings.latestApkUrl,
    latestApkVersion: settings.latestApkVersion,
    updatedAt: settings.updatedAt,
  });
});

export const updateSettingsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (req.body.appVersion !== undefined && req.user!.role !== 'ROOT_ADMIN') {
    throw ApiError.forbidden('Only the Root Admin can change the app version');
  }

  const before = await getSettings();
  const updated = await Settings.findByIdAndUpdate(before._id, req.body, { new: true });

  await recordAudit({
    actor: req.user!.userId,
    actorRole: req.user!.role,
    action: 'UPDATE_SETTINGS',
    entityType: 'Settings',
    entityId: before._id,
    before,
    after: updated,
  });

  ok(res, updated);
});
