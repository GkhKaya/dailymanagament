import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkoutExercise {
  _id?: string;
  name: string;
  sets: number;
  reps?: string;
  weight_kg?: number;
}

export interface IWorkoutDay {
  _id?: string;
  day_name: string;
  exercises: IWorkoutExercise[];
}

export interface IWorkoutRoutine extends Document {
  user_id: string;
  days: IWorkoutDay[];
  created_at: Date;
  updated_at: Date;
}

const WorkoutExerciseSchema = new Schema({
  name: { type: String, required: true },
  sets: { type: Number, required: true, default: 3 },
  reps: { type: String, default: "10" },
  weight_kg: { type: Number, default: 0 }
});

const WorkoutDaySchema = new Schema({
  day_name: { type: String, required: true },
  exercises: [WorkoutExerciseSchema]
});

const WorkoutRoutineSchema = new Schema({
  user_id: { type: String, required: true, index: true },
  days: [WorkoutDaySchema]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export const WorkoutRoutine = mongoose.models.WorkoutRoutine || mongoose.model<IWorkoutRoutine>('WorkoutRoutine', WorkoutRoutineSchema);
