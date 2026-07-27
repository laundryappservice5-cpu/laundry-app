import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/apiResponse';
import { getSettings, Settings } from '../models/Settings';
import { recordAudit } from '../audit/recordAudit';

export const getSettingsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await getSettings();
  ok(res, settings);
});

export const updateSettingsHandler = asyncHandler(async (req: Request, res: Response) => {
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
