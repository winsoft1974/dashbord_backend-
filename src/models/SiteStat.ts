import mongoose, { Schema, Document } from 'mongoose';
import { getModel } from '../config/modelHelper';

export interface ISiteStat extends Document {
  key: string;
  number: number;
  suffix: string;
  labelEn: string;
  labelMr: string;
  emoji: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const SiteStatSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    number: { type: Number, required: true },
    suffix: { type: String, default: '+' },
    labelEn: { type: String, required: true, trim: true },
    labelMr: { type: String, required: true, trim: true },
    emoji: { type: String, default: '📊' },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SiteStatSchema.index({ sortOrder: 1 });

export default getModel('SiteStat', SiteStatSchema);
