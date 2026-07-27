import { Schema, model, Types } from 'mongoose';

export type UserRole = 'ROOT_ADMIN' | 'ADMIN' | 'DRIVER';

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  mobileNumber: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  fcmTokens: string[];
  vehicleNumber?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['ROOT_ADMIN', 'ADMIN', 'DRIVER'], required: true },
    isActive: { type: Boolean, default: true },
    fcmTokens: { type: [String], default: [] },
    vehicleNumber: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

userSchema.index({ role: 1 });

export const User = model<IUser>('User', userSchema);
