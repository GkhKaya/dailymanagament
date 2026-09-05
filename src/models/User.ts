import mongoose, { Schema, Document } from 'mongoose';
import { Gender, ActivityLevel, BmrFormula } from './Enums';

export interface IUser extends Document {
  username?: string;
  email: string;
  password_hash?: string;
  profile?: {
    name?: string;
    birth_date?: Date;
    gender?: Gender | string;
    height_cm?: number;
    activity_level?: ActivityLevel | string;
    bmr_formula?: BmrFormula | string;
  };
  current_weight_kg?: number;
  target_weight_kg?: number;
  target_weight_date?: Date;
  settings: {
    daily_calorie_goal?: number;
    currency: string;
    timezone?: string;
    country?: string;
    is_abroad?: boolean;
    language?: 'tr' | 'en';
    onboarding_residence_completed?: boolean;
    active_markets?: string[];
    prayer_location?: { province: string; district: string; timezone: string };
  };
  created_at: Date;
  updated_at: Date;
}

const UserSchema: Schema = new Schema({
  username: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true, index: true },
  password_hash: { type: String },
  profile: {
    name: { type: String },
    birth_date: { type: Date },
    gender: { type: String },
    height_cm: { type: Number },
    activity_level: { type: String },
    bmr_formula: { type: String }
  },
  current_weight_kg: { type: Number },
  target_weight_kg: { type: Number },
  target_weight_date: { type: Date },
  settings: {
    daily_calorie_goal: { type: Number, default: null },
    currency: { type: String, default: 'TRY' },
    timezone: { type: String },
    country: { type: String, default: 'TR' },
    is_abroad: { type: Boolean, default: false },
    language: { type: String, enum: ['tr', 'en'], default: 'tr' },
    onboarding_residence_completed: { type: Boolean, default: false },
    active_markets: { type: [String], default: ['bist'] },
    prayer_location: {
      province: { type: String },
      district: { type: String },
      timezone: { type: String, default: 'Europe/Istanbul' }
    }
  }
}, {
  collection: 'user',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
