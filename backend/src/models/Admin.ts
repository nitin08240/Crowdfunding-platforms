import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdmin extends Document {
  name: string;
  email: string;
  passwordHash: string;
  secretKeyHash: string;
  role: 'admin' | 'super_admin' | 'superadmin';
  profileImage?: string;
  isActive: boolean;
  isDeleted: boolean;
  lastLoginAt?: Date;
  loginAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
  compareSecretKey(secretKey: string): Promise<boolean>;
}

const AdminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true, trim: true, default: 'Super Admin' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    secretKeyHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'super_admin', 'superadmin'], default: 'super_admin' },
    profileImage: { type: String },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    loginAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Hash passwordHash if modified and not already a bcrypt hash
AdminSchema.pre('save', async function (next) {
  if (this.isModified('passwordHash') && !this.passwordHash.startsWith('$2a$') && !this.passwordHash.startsWith('$2b$')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  }
  next();
});

AdminSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

AdminSchema.methods.compareSecretKey = async function (secretKey: string): Promise<boolean> {
  return bcrypt.compare(secretKey, this.secretKeyHash);
};

export default mongoose.model<IAdmin>('Admin', AdminSchema);
