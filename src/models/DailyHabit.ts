import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDailyHabit extends Document {
  user_id: string;
  title: string;
  icon?: string;
  color?: string;
  order: number;
  is_active: boolean;
  completed_dates: string[];
  created_at: Date;
  updated_at: Date;
}

const DailyHabitSchema = new Schema<IDailyHabit>({
  user_id: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true },
  icon: { type: String, default: 'check' },
  color: { type: String, default: 'emerald' },
  order: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  completed_dates: { type: [String], default: [] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

DailyHabitSchema.index({ user_id: 1, is_active: 1, order: 1 });

export const DailyHabit: Model<IDailyHabit> =
  mongoose.models.DailyHabit || mongoose.model<IDailyHabit>('DailyHabit', DailyHabitSchema);
