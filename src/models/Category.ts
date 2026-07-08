import mongoose, { Schema, Document } from 'mongoose';
import { CategoryType } from './Enums';

export interface ICategory extends Document {
  user_id?: mongoose.Types.ObjectId | null;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  is_default: boolean;
}

const CategorySchema: Schema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, required: true },
  type: { type: String, enum: Object.values(CategoryType), required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
  is_default: { type: Boolean, default: false }
});

// Index: { user_id: 1, type: 1 }
CategorySchema.index({ user_id: 1, type: 1 });

export const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
