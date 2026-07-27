import { Schema, model, Types } from 'mongoose';

export type NotificationType =
  | 'NEW_PICKUP'
  | 'EXPRESS_PICKUP'
  | 'PICKUP_CANCELLED'
  | 'READY_FOR_DELIVERY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERY_UPDATED'
  | 'PICKUP_COMPLETED'
  | 'LAUNDRY_COMPLETED'
  | 'PAYMENT_RECEIVED'
  | 'DRIVER_SELF_ASSIGNED'
  | 'DELIVERED_TO_STORE';

export interface INotification {
  _id: Types.ObjectId;
  recipient: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    payload: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
