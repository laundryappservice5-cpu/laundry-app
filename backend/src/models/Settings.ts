import { Schema, model, Types } from 'mongoose';

export type Currency = 'INR' | 'AED';

export interface ISettings {
  _id: Types.ObjectId;
  businessName: string;
  taxRatePercent: number;
  currency: Currency;
  address?: string;
  supportPhone?: string;
  email?: string;
  taxId?: string;
  homePickupCharge: number;
  homeDeliveryCharge: number;
  latestApkUrl?: string;
  latestApkVersion?: string;
  appVersion: 1 | 2;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    businessName: { type: String, default: 'The Royal Fresh Laundry' },
    taxRatePercent: { type: Number, default: 0 },
    currency: { type: String, enum: ['INR', 'AED'], default: 'AED' },
    address: { type: String },
    supportPhone: { type: String },
    email: { type: String },
    taxId: { type: String },
    homePickupCharge: { type: Number, default: 0 },
    homeDeliveryCharge: { type: Number, default: 0 },
    latestApkUrl: { type: String },
    latestApkVersion: { type: String },
    appVersion: { type: Number, enum: [1, 2], default: 2 },
  },
  { timestamps: true },
);

export const Settings = model<ISettings>('Settings', settingsSchema);

export async function getSettings(): Promise<ISettings> {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}
