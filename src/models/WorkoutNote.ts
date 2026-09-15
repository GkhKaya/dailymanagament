import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkoutNote extends Document {
  user_id: string;
  date: string; // "YYYY-MM-DD"
  title?: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

const WorkoutNoteSchema = new Schema<IWorkoutNote>({
  user_id: { type: String, required: true, index: true },
  date: { type: String, required: true },
  title: { type: String, default: '' },
  content: { type: String, required: true, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

WorkoutNoteSchema.index({ user_id: 1, date: -1 }, { unique: true });

export const WorkoutNote: Model<IWorkoutNote> =
  mongoose.models.WorkoutNote || mongoose.model<IWorkoutNote>('WorkoutNote', WorkoutNoteSchema);
