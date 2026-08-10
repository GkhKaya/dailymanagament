import mongoose, { Schema, Document } from 'mongoose';

export interface IPrayerTime extends Document {
  user_id: string;
  location_key: string;
  date: string;
  timezone: string;
  times: { imsak: Date; ogle: Date; ikindi: Date; aksam: Date; yatsi: Date };
  source: string;
}

const PrayerTimeSchema = new Schema<IPrayerTime>({
  user_id: { type: String, required: true, index: true },
  location_key: { type: String, required: true },
  date: { type: String, required: true },
  timezone: { type: String, required: true },
  times: {
    imsak: { type: Date, required: true }, ogle: { type: Date, required: true },
    ikindi: { type: Date, required: true }, aksam: { type: Date, required: true }, yatsi: { type: Date, required: true },
  },
  source: { type: String, default: 'aladhan-turkey' },
}, { timestamps: true, collection: 'prayer_time' });
PrayerTimeSchema.index({ user_id: 1, date: 1 }, { unique: true });

export const PrayerTime = mongoose.models.PrayerTime || mongoose.model<IPrayerTime>('PrayerTime', PrayerTimeSchema);
