import mongoose, { Schema, Document } from 'mongoose';

export interface IWeightLog extends Document {
  user_id: mongoose.Types.ObjectId;
  date: Date;
  weight_kg: number;
  note?: string;
  created_at: Date;
}

const WeightLogSchema: Schema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  weight_kg: { type: Number, required: true },
  note: { type: String, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

WeightLogSchema.pre('validate', function(next: any) {
  const doc = this as unknown as IWeightLog;
  if (doc.date) {
    doc.date.setUTCHours(0, 0, 0, 0);
  }
  next();
});

WeightLogSchema.pre('findOneAndUpdate', function(next: any) {
  const query = this.getQuery();
  if (query.date && query.date instanceof Date) {
    query.date.setUTCHours(0, 0, 0, 0);
  }
  const update: any = this.getUpdate();
  if (update) {
    if (update.date && update.date instanceof Date) update.date.setUTCHours(0, 0, 0, 0);
    if (update.$set && update.$set.date && update.$set.date instanceof Date) update.$set.date.setUTCHours(0, 0, 0, 0);
    if (update.$setOnInsert && update.$setOnInsert.date && update.$setOnInsert.date instanceof Date) update.$setOnInsert.date.setUTCHours(0, 0, 0, 0);
  }
  next();
});

// Index: { user_id: 1, date: 1 } unique compound
WeightLogSchema.index({ user_id: 1, date: 1 }, { unique: true });

export const WeightLog = mongoose.models.WeightLog || mongoose.model<IWeightLog>('WeightLog', WeightLogSchema);
