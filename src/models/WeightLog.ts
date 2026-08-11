import mongoose, { Schema, Document } from 'mongoose';

export interface IWeightLog extends Document {
  user_id: string;
  date: Date;
  weight_kg: number;
  note?: string;
  created_at: Date;
}

const WeightLogSchema: Schema = new Schema({
  user_id: { type: String, ref: 'User', required: true },
  date: { type: Date, required: true, default: Date.now },
  weight_kg: { type: Number, required: true },
  note: { type: String, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Index: { user_id: 1, date: -1 } for fast queries
WeightLogSchema.index({ user_id: 1, date: -1 });

export const WeightLog = mongoose.models.WeightLog || mongoose.model<IWeightLog>('WeightLog', WeightLogSchema);
