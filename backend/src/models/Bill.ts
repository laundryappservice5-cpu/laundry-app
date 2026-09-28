import { Schema, model, Types } from 'mongoose';

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export interface IBillLineItem {
  clothType?: Types.ObjectId | null;
  service: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface IDiscount {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  reason: string;
  givenBy: Types.ObjectId;
  timestamp: Date;
}

export interface IBill {
  _id: Types.ObjectId;
  order: Types.ObjectId;
  invoiceNumber: string;
  lineItems: IBillLineItem[];
  pickupCharge: number;
  deliveryCharge: number;
  extraCharges: number;
  taxes: number;
  discount?: IDiscount;
  discountHistory: IDiscount[];
  subtotal: number;
  finalAmount: number;
  amountPaid: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  generatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const discountSchema = new Schema<IDiscount>(
  {
    originalAmount: { type: Number, required: true },
    discountAmount: { type: Number, required: true },
    finalAmount: { type: Number, required: true },
    reason: { type: String, required: true },
    givenBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, required: true },
  },
  { _id: false },
);

const billSchema = new Schema<IBill>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    invoiceNumber: { type: String, required: true, unique: true },
    lineItems: [
      {
        clothType: { type: Schema.Types.ObjectId, ref: 'ClothType' },
        service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        lineTotal: { type: Number, required: true },
      },
    ],
    pickupCharge: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    extraCharges: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    discount: { type: discountSchema },
    discountHistory: { type: [discountSchema], default: [] },
    subtotal: { type: Number, required: true },
    finalAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['CASH', 'UPI', 'CARD'] },
    paymentStatus: { type: String, enum: ['PENDING', 'PARTIAL', 'PAID'], default: 'PENDING' },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

billSchema.index({ paymentStatus: 1 });
billSchema.index({ createdAt: -1 });
billSchema.index({ finalAmount: 1 });
billSchema.index({ order: 1 });

export const Bill = model<IBill>('Bill', billSchema);
