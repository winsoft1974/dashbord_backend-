import mongoose, { Schema, Document } from 'mongoose';
import { getModel } from '../config/modelHelper';

export interface IDemoRequest extends Document {
  name: string;
  email: string;
  phone: string;
  company: string | null;
  industry: 'dairy' | 'gold' | 'sugar' | 'other';
  currentChallenges: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTime: string; // HH:MM
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const DemoRequestSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    company: { type: String, default: null },
    industry: {
      type: String,
      enum: ['dairy', 'gold', 'sugar', 'other'],
      required: true,
    },
    currentChallenges: { type: String, default: '' },
    preferredDate: { type: String, required: true },
    preferredTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

DemoRequestSchema.index({ email: 1 });
DemoRequestSchema.index({ status: 1 });
DemoRequestSchema.index({ createdAt: -1 });

export default getModel('DemoRequest', DemoRequestSchema);
