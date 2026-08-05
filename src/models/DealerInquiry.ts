import mongoose, { Schema, Document } from 'mongoose';
import { getModel } from '../config/modelHelper';

export interface IDealerInquiry extends Document {
  name: string;
  businessName: string | null;
  phone: string;
  email: string;
  address: string;
  status: 'new' | 'under_review' | 'approved' | 'rejected';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const DealerInquirySchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    businessName: { type: String, default: null },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    address: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['new', 'under_review', 'approved', 'rejected'],
      default: 'new',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

DealerInquirySchema.index({ email: 1 });
DealerInquirySchema.index({ status: 1 });
DealerInquirySchema.index({ createdAt: -1 });

export default getModel('DealerInquiry', DealerInquirySchema);
