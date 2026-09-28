import { Schema, model, Types } from 'mongoose';

export interface IService {
  _id: Types.ObjectId;
  name: string;
  isActive: boolean;
  flatPrice?: number;
  category?: string;
  unit?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    isActive: { type: Boolean, default: true },
    // When set, this service is a standalone flat-fee service (e.g. House Cleaning) —
    // it isn't priced per cloth type, doesn't take collected items, and can't be
    // combined with other services on the same order.
    flatPrice: { type: Number, min: 0 },
    category: { type: String, trim: true },
    unit: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { timestamps: true },
);

serviceSchema.index({ category: 1 });

export const Service = model<IService>('Service', serviceSchema);

export const DEFAULT_SERVICES = ['Dry Cleaning', 'Press', 'Dry Wash', 'House Cleaning'];
