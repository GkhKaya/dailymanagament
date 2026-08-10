import mongoose, { Schema, Document } from 'mongoose';

export interface IPrayerNotification extends Document {
  user_id: string;
  prayer_time_id: string;
  kind: 'after_15m' | 'after_1h';
  scheduled_at: Date;
  sent_at?: Date;
  status: 'pending' | 'sent' | 'cancelled';
}

const schema = new Schema<IPrayerNotification>({
  user_id: { type: String, required: true, index: true }, prayer_time_id: { type: String, required: true },
  kind: { type: String, enum: ['after_15m', 'after_1h'], required: true }, scheduled_at: { type: Date, required: true, index: true },
  sent_at: Date, status: { type: String, enum: ['pending', 'sent', 'cancelled'], default: 'pending', index: true },
}, { timestamps: true, collection: 'prayer_notification' });
schema.index({ prayer_time_id: 1, kind: 1 }, { unique: true });
export const PrayerNotification = mongoose.models.PrayerNotification || mongoose.model<IPrayerNotification>('PrayerNotification', schema);
