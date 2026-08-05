import mongoose, { Schema, Document } from 'mongoose';
import { getModel } from '../config/modelHelper';

export interface IBlogPost extends Document {
  slug: string;
  title: string;
  titleMr: string;
  titleHi: string;
  titleKn: string;
  excerpt: string;
  excerptMr: string;
  content: string;
  author: string;
  category: 'dairy' | 'sugar' | 'gold' | 'tech' | 'foodProcessing' | 'strategy';
  readTime: string;
  image: string;
  featured: boolean;
  published: boolean;
  publishedAt: Date | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostSchema: Schema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    titleMr: { type: String, default: '' },
    titleHi: { type: String, default: '' },
    titleKn: { type: String, default: '' },
    excerpt: { type: String, required: true, trim: true },
    excerptMr: { type: String, default: '' },
    content: { type: String, required: true },
    author: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['dairy', 'sugar', 'gold', 'tech', 'foodProcessing', 'strategy'],
      required: true,
    },
    readTime: { type: String, default: '5 min read' },
    image: { type: String, required: true },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

BlogPostSchema.index({ category: 1 });
BlogPostSchema.index({ published: 1 });
BlogPostSchema.index({ createdAt: -1 });

export default getModel('BlogPost', BlogPostSchema);
