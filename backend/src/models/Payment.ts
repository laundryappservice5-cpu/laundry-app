import { Schema, model, Types } from 'mongoose';

export interface IPayment {
  _id: Types.ObjectId;
  bill: Types.ObjectId;
  amount: number;
  method: 'CASH' | 'UPI' | 'CARD';
  status: 'PENDING' | 'PAID';
  collectedBy: Types.ObjectId;
  batchId?: Types.ObjectId;
  settledToAdmin: boolean;
  settledAt?: Date;
  settledBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    bill: { type: Schema.Types.ObjectId, ref: 'Bill', required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['CASH', 'UPI', 'CARD'], required: true },
    status: { type: String, enum: ['PENDING', 'PAID'], default: 'PAID' },
    collectedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    batchId: { type: Schema.Types.ObjectId },
    settledToAdmin: { type: Boolean, default: true },
    settledAt: { type: Date },
    settledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

paymentSchema.index({ bill: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ batchId: 1 });
paymentSchema.index({ collectedBy: 1, settledToAdmin: 1 });

export const Payment = model<IPayment>('Payment', paymentSchema);
