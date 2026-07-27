import { Schema, model, Types } from 'mongoose';

export interface IAddress {
  _id?: Types.ObjectId;
  label?: string;
  address: string;
  landmark?: string;
  area?: string;
  geo?: { lat: number; lng: number };
  isDefault?: boolean;
}

export interface ICustomer {
  _id: Types.ObjectId;
  name: string;
  mobileNumber: string;
  alternateMobile?: string;
  addresses: IAddress[];
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    label: { type: String },
    address: { type: String, required: true },
    landmark: { type: String },
    area: { type: String },
    geo: {
      lat: { type: Number },
      lng: { type: Number },
    },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, unique: true, trim: true },
    alternateMobile: { type: String },
    addresses: { type: [addressSchema], default: [] },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

customerSchema.index({ name: 'text', 'addresses.address': 'text', 'addresses.area': 'text' });

export const Customer = model<ICustomer>('Customer', customerSchema);
