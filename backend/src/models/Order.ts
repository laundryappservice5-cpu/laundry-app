import { Schema, model, Types } from 'mongoose';
import { ORDER_STAGES } from './orderStages';
import { ICollectedItem } from './Pickup';

export interface IOrderServiceStatus {
  service: Types.ObjectId;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface IOrderStatusHistoryEntry {
  _id?: Types.ObjectId;
  status: string;
  timestamp: Date;
  updatedBy: Types.ObjectId;
  remarks?: string;
  itemCount?: number;
}

export interface IOrder {
  _id: Types.ObjectId;
  pickup?: Types.ObjectId;
  customer: Types.ObjectId;
  driver?: Types.ObjectId;
  services: IOrderServiceStatus[];
  currentStatus: string;
  statusHistory: IOrderStatusHistoryEntry[];
  isExpressPickup: boolean;
  isExpressDelivery: boolean;
  isInStorePickup: boolean;
  isInStoreDelivery: boolean;
  collectedItems: ICollectedItem[];
  bill?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    pickup: { type: Schema.Types.ObjectId, ref: 'Pickup' },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    driver: { type: Schema.Types.ObjectId, ref: 'User' },
    services: [
      {
        service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
        isCompleted: { type: Boolean, default: false },
        completedAt: { type: Date },
      },
    ],
    currentStatus: { type: String, enum: ORDER_STAGES, required: true },
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STAGES, required: true },
        timestamp: { type: Date, required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        remarks: { type: String },
        itemCount: { type: Number },
      },
    ],
    isExpressPickup: { type: Boolean, default: false },
    isExpressDelivery: { type: Boolean, default: false },
    isInStorePickup: { type: Boolean, default: false },
    isInStoreDelivery: { type: Boolean, default: false },
    collectedItems: [
      {
        clothType: { type: Schema.Types.ObjectId, ref: 'ClothType', required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    bill: { type: Schema.Types.ObjectId, ref: 'Bill' },
  },
  { timestamps: true },
);

orderSchema.index({ currentStatus: 1 });
orderSchema.index({ driver: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ customer: 1 });

export const Order = model<IOrder>('Order', orderSchema);
