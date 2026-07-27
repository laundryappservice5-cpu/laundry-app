import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, paginated } from '../utils/apiResponse';
import { Notification } from '../models/Notification';
import { getPagination } from '../utils/pagination';

export const listMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const filter = { recipient: req.user!.userId };
  const [items, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);
  paginated(res, items, { page, limit, total });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user!.userId },
    { isRead: true },
    { new: true },
  );
  ok(res, notification);
});
