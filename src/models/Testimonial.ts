import mongoose, { Schema, Document } from 'mongoose';
import { getModel } from '../config/modelHelper';

export interface ITestimonial extends Document {
  name: string;
  nameMr: string;
  role: string;
  roleMr: string;
  company: string;
  companyMr: string;
  image: string;
  rating: number;
  review: string; // Marathi review
  reviewEn: string; // English review
  industry: 'dairy' | 'gold' | 'sugar' | 'other';
  featured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    nameMr: { type: String, default: '' },
    role: { type: String, required: true, trim: true },
    roleMr: { type: String, default: '' },
    company: { type: String, required: true, trim: true },
    companyMr: { type: String, default: '' },
    image: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    review: { type: String, required: true },
    reviewEn: { type: String, required: true },
    industry: {
      type: String,
      enum: ['dairy', 'gold', 'sugar', 'other'],
      required: true,
    },
    featured: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

TestimonialSchema.index({ featured: 1 });
TestimonialSchema.index({ sortOrder: 1 });
TestimonialSchema.index({ industry: 1 });

export default getModel('Testimonial', TestimonialSchema);
