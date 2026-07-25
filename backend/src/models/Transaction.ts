import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  transactionId: string;
  donation: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  campaign: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: string;
  status: string;
  gatewayResponse: Record<string, any>;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionId: { type: String, required: true, unique: true },
    donation: { type: Schema.Types.ObjectId, ref: 'Donation', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, default: 'razorpay' },
    status: { type: String, required: true },
    gatewayResponse: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Fast lookup: user transaction history (dashboard)
TransactionSchema.index({ user: 1, createdAt: -1 });
// Fast lookup: campaign transaction list (admin panel)
TransactionSchema.index({ campaign: 1, createdAt: -1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
