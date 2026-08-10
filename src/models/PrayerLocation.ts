import mongoose, { Schema, Document } from 'mongoose';

export interface IPrayerLocation extends Document {
  user_id: string;
  country: string;
  province: string;
  district: string;
  provider_city: string;
  timezone: string;
}

const PrayerLocationSchema = new Schema<IPrayerLocation>({
  user_id: { type: String, required: true, unique: true, index: true },
  country: { type: String, default: 'Türkiye' },
  province: { type: String, required: true },
  district: { type: String, required: true },
  provider_city: { type: String, required: true },
  timezone: { type: String, default: 'Europe/Istanbul' },
}, { timestamps: true, collection: 'prayer_location' });

export const PrayerLocation = mongoose.models.PrayerLocation || mongoose.model<IPrayerLocation>('PrayerLocation', PrayerLocationSchema);
