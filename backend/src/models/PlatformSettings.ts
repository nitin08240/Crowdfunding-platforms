import mongoose, { Document, Schema } from 'mongoose';

export interface IPlatformSettings extends Document {
  siteName: string;
  logo?: string;
  platformCommission: number; // percentage
  defaultCurrency: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  footerText?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  razorpayKeyId?: string; // public key only
  smtpEmail?: string;
  updatedAt: Date;
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    siteName: { type: String, default: 'CrowdFund Platform' },
    logo: { type: String },
    platformCommission: { type: Number, default: 2.5, min: 0, max: 30 },
    defaultCurrency: { type: String, default: 'INR' },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'Platform is under maintenance. Please check back later.' },
    footerText: { type: String, default: '© 2025 CrowdFund Platform. All rights reserved.' },
    contactEmail: { type: String },
    contactPhone: { type: String },
    contactAddress: { type: String },
    socialLinks: {
      facebook: { type: String },
      twitter: { type: String },
      instagram: { type: String },
      linkedin: { type: String },
      youtube: { type: String },
    },
    razorpayKeyId: { type: String },
    smtpEmail: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IPlatformSettings>('PlatformSettings', PlatformSettingsSchema);
