import mongoose, { Schema, Document } from 'mongoose';

export interface IPushSubscription extends Document { user_id: string; endpoint: string; keys: { p256dh: string; auth: string }; active: boolean; last_error?: string; }
const schema = new Schema<IPushSubscription>({
  user_id: { type: String, required: true, index: true }, endpoint: { type: String, required: true, unique: true },
  keys: { p256dh: { type: String, required: true }, auth: { type: String, required: true } }, active: { type: Boolean, default: true }, last_error: String,
}, { timestamps: true, collection: 'push_subscription' });
export const PushSubscription = mongoose.models.PushSubscription || mongoose.model<IPushSubscription>('PushSubscription', schema);
