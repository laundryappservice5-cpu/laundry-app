import { Schema, model, Types } from 'mongoose';

export interface IService {
  _id: Types.ObjectId;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Service = model<IService>('Service', serviceSchema);

export const DEFAULT_SERVICES = ['Dry Cleaning', 'Press', 'Dry Wash', 'House Cleaning'];
