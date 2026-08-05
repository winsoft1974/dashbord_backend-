import mongoose, { Schema, Document } from 'mongoose';
import { getModel } from '../config/modelHelper';

export interface ICareerApplication extends Document {
  name: string;
  email: string;
  phone: string;
  position: string;
  resumeUrl: string;
  resumePublicId: string;
  resumeOriginalName: string;
  message: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const CareerApplicationSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    resumeUrl: { type: String, required: true },
    resumePublicId: { type: String, required: true },
    resumeOriginalName: { type: String, required: true },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'shortlisted', 'rejected'],
      default: 'pending',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

CareerApplicationSchema.index({ email: 1 });
CareerApplicationSchema.index({ status: 1 });
CareerApplicationSchema.index({ createdAt: -1 });

export default getModel('CareerApplication', CareerApplicationSchema);
