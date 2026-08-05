import mongoose, { Schema, Document } from 'mongoose';
import { getModel } from '../config/modelHelper';

export interface INewsletterSubscriber extends Document {
  email: string;
  language: string;
  status: 'active' | 'unsubscribed';
  source: string;
  subscribedAt: Date;
  updatedAt: Date;
}

const NewsletterSubscriberSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    language: { type: String, default: 'en' },
    status: {
      type: String,
      enum: ['active', 'unsubscribed'],
      default: 'active',
    },
    source: { type: String, default: 'blog_page' },
  },
  { 
    timestamps: { createdAt: 'subscribedAt', updatedAt: 'updatedAt' } 
  }
);

NewsletterSubscriberSchema.index({ status: 1 });

export default getModel('NewsletterSubscriber', NewsletterSubscriberSchema);
