import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { getModel } from '../config/modelHelper';

export interface IAdminUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'superadmin';
  lastLogin: Date | null;
  active: boolean;
  comparePassword(password: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'superadmin'],
      default: 'admin',
    },
    lastLogin: { type: Date, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AdminUserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export default getModel('AdminUser', AdminUserSchema);
