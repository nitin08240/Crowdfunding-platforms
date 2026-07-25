import mongoose, { Document, Schema } from 'mongoose';

export interface ICampaignDocument {
  url: string;
  label: 'aadhaar' | 'pan' | 'medical_report' | 'hospital_bill' | 'identity_proof' | 'other';
  uploadedAt: Date;
}

export interface ICampaign extends Document {
  title: string;
  slug: string;
  description: string;
  story: string;
  goalAmount: number;
  raisedAmount: number;
  availableBalance: number;
  creator: mongoose.Types.ObjectId;
  status: 'draft' | 'pending_review' | 'active' | 'paused' | 'completed' | 'rejected' | 'archived' | 'suspended';
  category: string;
  images: string[];
  videoUrl?: string;
  deadline: Date;
  location?: string;
  tags: string[];
  donorCount: number;
  viewCount: number;
  shareCount: number;
  lastDonationDate?: Date;
  flaggedForReview: boolean;
  // Verification
  documents: ICampaignDocument[];
  verified: boolean;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignDocumentSchema = new Schema<ICampaignDocument>(
  {
    url: { type: String, required: true },
    label: {
      type: String,
      enum: ['aadhaar', 'pan', 'medical_report', 'hospital_bill', 'identity_proof', 'other'],
      required: true,
    },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CampaignSchema = new Schema<ICampaign>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    story: { type: String, required: true },
    goalAmount: { type: Number, required: true, min: 1 },
    raisedAmount: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'active', 'paused', 'completed', 'rejected', 'archived', 'suspended'],
      default: 'draft',
    },
    category: { type: String, required: true, index: true },
    images: [{ type: String }],
    videoUrl: { type: String },
    deadline: { type: Date, required: true, index: true },
    location: { type: String },
    tags: [{ type: String, index: true }],
    donorCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    lastDonationDate: { type: Date },
    flaggedForReview: { type: Boolean, default: false },
    // Verification fields
    documents: [CampaignDocumentSchema],
    verified: { type: Boolean, default: false },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    approvedAt: { type: Date },
    rejectedReason: { type: String },
  },
  { timestamps: true }
);

// Compound index for trending/discover queries
CampaignSchema.index({ status: 1, category: 1, createdAt: -1 });
CampaignSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.model<ICampaign>('Campaign', CampaignSchema);
