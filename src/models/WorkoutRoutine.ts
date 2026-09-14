import mongoose, { Schema, Document } from 'mongoose';

export interface IExerciseSet {
  set_number: number;
  weight_kg: number;
  reps: string;
  completed?: boolean;
}

export interface IWorkoutDayNote {
  _id?: string;
  id?: string;
  content: string;
  created_at: Date;
}

export interface IWorkoutExercise {
  _id?: string;
  id?: string;
  name: string;
  sets: number;
  reps?: string;
  weight_kg?: number;
  sets_detail?: IExerciseSet[];
  note?: string;
}

export interface IWorkoutDay {
  _id?: string;
  id?: string;
  day_name: string;
  note?: string;
  notes?: IWorkoutDayNote[];
  exercises: IWorkoutExercise[];
}

export interface IWorkoutRoutine extends Document {
  user_id: string;
  days: IWorkoutDay[];
  created_at: Date;
  updated_at: Date;
}

const ExerciseSetSchema = new Schema({
  set_number: { type: Number, required: true },
  weight_kg: { type: Number, default: 0 },
  reps: { type: String, default: "10" },
  completed: { type: Boolean, default: false }
}, { _id: false });

const WorkoutDayNoteSchema = new Schema({
  content: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

const WorkoutExerciseSchema = new Schema({
  name: { type: String, required: true },
  sets: { type: Number, required: true, default: 3 },
  reps: { type: String, default: "10" },
  weight_kg: { type: Number, default: 0 },
  sets_detail: [ExerciseSetSchema],
  note: { type: String, default: "" }
});

const WorkoutDaySchema = new Schema({
  day_name: { type: String, required: true },
  note: { type: String, default: "" },
  notes: [WorkoutDayNoteSchema],
  exercises: [WorkoutExerciseSchema]
});

const WorkoutRoutineSchema = new Schema({
  user_id: { type: String, required: true, index: true },
  days: [WorkoutDaySchema]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export const WorkoutRoutine = mongoose.models.WorkoutRoutine || mongoose.model<IWorkoutRoutine>('WorkoutRoutine', WorkoutRoutineSchema);
