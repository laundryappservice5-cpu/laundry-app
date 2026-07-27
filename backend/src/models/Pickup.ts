import { Schema, model, Types } from 'mongoose';

export type PickupStatus = 'CREATED' | 'DRIVER_ASSIGNED' | 'ACCEPTED' | 'PICKED_UP' | 'CANCELLED';

export interface ICollectedItem {
  clothType: Types.ObjectId;
  service: Types.ObjectId;
  quantity: number;
}

export interface IPickup {
  _id: Types.ObjectId;
  customer: Types.ObjectId;
  pickupAddress: {
    address: string;
    landmark?: string;
    area?: string;
    geo?: { lat: number; lng: number };
  };
  pickupDate: Date;
  pickupTime: string;
  servicesRequested: Types.ObjectId[];
  specialInstructions?: string;
  assignedDriver?: Types.ObjectId;
  isExpressPickup: boolean;
  isExpressDelivery: boolean;
  isInStoreDelivery: boolean;
  notes?: string;
  status: PickupStatus;
  collectedItems: ICollectedItem[];
  images: string[];
  pickupRemarks?: string;
  damagedItemNotes?: string;
  gpsLocation?: { lat: number; lng: number };
  createdBy: Types.ObjectId;
  cancelledReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const pickupSchema = new Schema<IPickup>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    pickupAddress: {
      address: { type: String, required: true },
      landmark: { type: String },
      area: { type: String },
      geo: { lat: Number, lng: Number },
    },
    pickupDate: { type: Date, required: true },
    pickupTime: { type: String, required: true },
    servicesRequested: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    specialInstructions: { type: String },
    assignedDriver: { type: Schema.Types.ObjectId, ref: 'User' },
    isExpressPickup: { type: Boolean, default: false },
    isExpressDelivery: { type: Boolean, default: false },
    isInStoreDelivery: { type: Boolean, default: false },
    notes: { type: String },
    status: {
      type: String,
      enum: ['CREATED', 'DRIVER_ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'CANCELLED'],
      default: 'CREATED',
    },
    collectedItems: [
      {
        clothType: { type: Schema.Types.ObjectId, ref: 'ClothType', required: true },
        service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    images: { type: [String], default: [] },
    pickupRemarks: { type: String },
    damagedItemNotes: { type: String },
    gpsLocation: { lat: Number, lng: Number },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cancelledReason: { type: String },
  },
  { timestamps: true },
);

pickupSchema.index({ status: 1 });
pickupSchema.index({ assignedDriver: 1 });
pickupSchema.index({ createdAt: -1 });
pickupSchema.index({ pickupDate: 1 });

export const Pickup = model<IPickup>('Pickup', pickupSchema);
