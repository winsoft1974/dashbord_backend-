import mongoose, { Schema, Document } from 'mongoose';
import { getModel } from '../config/modelHelper';

export interface ITeamMember extends Document {
  name: string;
  designation: string;
  department: string;
  image: string;
  linkedin: string | null;
  bio: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    linkedin: { type: String, default: null },
    bio: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TeamMemberSchema.index({ active: 1 });
TeamMemberSchema.index({ sortOrder: 1 });

export default getModel('TeamMember', TeamMemberSchema);
