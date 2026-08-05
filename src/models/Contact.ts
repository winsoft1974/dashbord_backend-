import mongoose, { Schema, Document } from 'mongoose';
import { getModel } from '../config/modelHelper';

export interface IContact extends Document {
  name: string;
  email: string;
  phone: string;
  company: string | null;
  inquiryType: 'demo' | 'dairy' | 'sugar' | 'gold' | 'dealer' | 'support' | 'general' | 'popup';
  message: string;
  source: 'contact_page' | 'popup' | 'dealer_inquiry';
  status: 'new' | 'called' | 'interested' | 'converted' | 'not_interested';
  notes: string;
  product: string | null;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    company: { type: String, default: null },
    inquiryType: {
      type: String,
      enum: ['demo', 'dairy', 'sugar', 'gold', 'dealer', 'support', 'general', 'popup'],
      required: true,
    },
    message: { type: String, default: '' },
    source: {
      type: String,
      enum: ['contact_page', 'popup', 'dealer_inquiry'],
      default: 'contact_page',
    },
    status: {
      type: String,
      enum: ['new', 'called', 'interested', 'converted', 'not_interested'],
      default: 'new',
    },
    notes: { type: String, default: '' },
    product: { type: String, default: null },
    language: { type: String, default: 'en' },
  },
  { timestamps: true }
);

ContactSchema.index({ email: 1 });
ContactSchema.index({ status: 1 });
ContactSchema.index({ inquiryType: 1 });
ContactSchema.index({ createdAt: -1 });

export default getModel('Contact', ContactSchema);
