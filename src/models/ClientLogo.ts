import mongoose, { Schema, Document } from 'mongoose';
import { getModel } from '../config/modelHelper';

export interface IClientLogo extends Document {
  name: string;
  image: string;
  website: string | null;
  industry: 'dairy' | 'gold' | 'sugar' | 'other';
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClientLogoSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    website: { type: String, default: null },
    industry: {
      type: String,
      enum: ['dairy', 'gold', 'sugar', 'other'],
      default: 'dairy',
    },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ClientLogoSchema.index({ active: 1 });
ClientLogoSchema.index({ sortOrder: 1 });

export default getModel('ClientLogo', ClientLogoSchema);
