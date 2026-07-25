import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  adminId: mongoose.Types.ObjectId;
  action: string;
  targetType: 'campaign' | 'user' | 'withdrawal' | 'platform';
  campaignId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  details?: Record<string, any>;
  timestamp: Date;
  ip?: string;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    action: { type: String, required: true },
    targetType: {
      type: String,
      enum: ['campaign', 'user', 'withdrawal', 'platform'],
      required: true,
    },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    details: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },
    ip: { type: String },
  }
);

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
