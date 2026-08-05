import mongoose, { Schema, Document } from 'mongoose';
import { getModel } from '../config/modelHelper';

export interface IFaqItem extends Document {
  category: string; // e.g. General, Dairy, Gold, Sugar
  categoryMr: string;
  question: string;
  questionEn: string;
  answer: string;
  answerEn: string;
  sortOrder: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FaqItemSchema: Schema = new Schema(
  {
    category: { type: String, required: true, trim: true },
    categoryMr: { type: String, default: '' },
    question: { type: String, required: true, trim: true },
    questionEn: { type: String, default: '' },
    answer: { type: String, required: true },
    answerEn: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

FaqItemSchema.index({ published: 1 });
FaqItemSchema.index({ sortOrder: 1 });
FaqItemSchema.index({ category: 1 });

export default getModel('FaqItem', FaqItemSchema);
