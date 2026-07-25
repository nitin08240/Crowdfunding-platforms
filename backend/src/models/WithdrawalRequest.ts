import mongoose, { Document, Schema } from 'mongoose';

export interface IWithdrawalRequest extends Document {
  campaign: mongoose.Types.ObjectId;
  creator: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  bankDetails: {
    accountHolder: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
  };
  transactionDetails?: {
    transactionId: string;
    utrNumber: string;
    transferDate: Date;
  };
  adminNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalRequestSchema = new Schema<IWithdrawalRequest>(
  {
    campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    bankDetails: {
      accountHolder: { type: String, required: true },
      accountNumber: { type: String, required: true },
      ifsc: { type: String, required: true },
      bankName: { type: String, default: '' },
    },
    transactionDetails: {
      transactionId: { type: String },
      utrNumber: { type: String },
      transferDate: { type: Date },
    },
    adminNotes: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index for fast lookups by campaign + status
WithdrawalRequestSchema.index({ campaign: 1, status: 1 });
// Fast lookup: user withdrawal history filtered by status + date
WithdrawalRequestSchema.index({ creator: 1, status: 1, createdAt: -1 });

export default mongoose.model<IWithdrawalRequest>('WithdrawalRequest', WithdrawalRequestSchema);
