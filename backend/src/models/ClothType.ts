import { Schema, model, Types } from 'mongoose';

export interface IClothType {
  _id: Types.ObjectId;
  name: string;
  isCustom: boolean;
  icon?: string;
  prices: Map<string, number>;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const clothTypeSchema = new Schema<IClothType>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    isCustom: { type: Boolean, default: false },
    icon: { type: String },
    prices: { type: Map, of: Number, default: {} },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const ClothType = model<IClothType>('ClothType', clothTypeSchema);

export const DEFAULT_CLOTH_TYPES = [
  'Shirt', 'T-Shirt', 'Pant', 'Jeans', 'Shorts', 'Saree', 'Blazer', 'Coat',
  'Suit', 'Kurta', 'Blanket', 'Bedsheet', 'Curtain', 'Pillow Cover', 'Shoes', 'Others',
];
