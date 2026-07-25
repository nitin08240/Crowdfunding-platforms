import mongoose, { Document, Schema } from 'mongoose';

export interface IDonation extends Document {
  donor: mongoose.Types.ObjectId;
  campaign: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  isAnonymous: boolean;
  message?: string;
  paymentMethod?: string;
  receiptNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DonationSchema = new Schema<IDonation>(
  {
    donor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    campaign: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR' },
    razorpayOrderId: { type: String, required: true, index: true },
    razorpayPaymentId: { type: String, sparse: true, unique: true },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
    },
    isAnonymous: { type: Boolean, default: false },
    message: { type: String, maxlength: 500 },
    paymentMethod: { type: String, default: 'razorpay' },
    receiptNumber: { type: String, sparse: true, unique: true },
  },
  { timestamps: true },
);

// Optimised index for user donation history queries
DonationSchema.index({ donor: 1, status: 1, createdAt: -1 });
// Optimised index for campaign donor list queries
DonationSchema.index({ campaign: 1, status: 1, createdAt: -1 });

export default mongoose.model<IDonation>('Donation', DonationSchema);
