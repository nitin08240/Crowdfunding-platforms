import mongoose, { Document, Schema } from 'mongoose';

export interface ICampaignUpdate extends Document {
  campaign: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  title: string;
  content: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CampaignUpdateSchema = new Schema<ICampaignUpdate>(
  {
    campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true },
    images: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<ICampaignUpdate>('CampaignUpdate', CampaignUpdateSchema);
