import { Types } from 'mongoose';
import { getFirebaseAdmin } from '../config/firebase';
import { isFcmConfigured } from '../config/env';
import { logger } from '../config/logger';
import { Notification, NotificationType } from '../models/Notification';
import { User } from '../models/User';

interface NotifyParams {
  recipientId: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}

export const notificationService = {
  async notify(params: NotifyParams): Promise<void> {
    await Notification.create({
      recipient: params.recipientId,
      type: params.type,
      title: params.title,
      body: params.body,
      payload: params.payload,
    });

    if (!isFcmConfigured()) {
      logger.warn(`FCM not configured — skipping push for ${params.type} to ${params.recipientId}`);
      return;
    }

    const app = getFirebaseAdmin();
    if (!app) return;

    const user = await User.findById(params.recipientId);
    if (!user || user.fcmTokens.length === 0) return;

    try {
      await app.messaging().sendEachForMulticast({
        tokens: user.fcmTokens,
        notification: { title: params.title, body: params.body },
        data: { type: params.type, ...(params.payload ?? {}) } as Record<string, string>,
      });
    } catch (err) {
      logger.error(`FCM send failed: ${err}`);
    }
  },

  async notifyMany(recipientIds: (Types.ObjectId | string)[], rest: Omit<NotifyParams, 'recipientId'>): Promise<void> {
    await Promise.all(recipientIds.map((recipientId) => this.notify({ ...rest, recipientId })));
  },
};
