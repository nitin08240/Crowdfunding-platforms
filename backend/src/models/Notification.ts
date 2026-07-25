import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  user?: mongoose.Types.ObjectId;
  isAdminNotification: boolean;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    isAdminNotification: { type: Boolean, default: false, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    link: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);
