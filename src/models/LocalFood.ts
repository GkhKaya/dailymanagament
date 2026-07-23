import mongoose, { Schema, Document } from 'mongoose';

export interface ILocalFoodUnit {
  unit_name: string; // 'gram', 'adet', 'tabak'
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface ILocalFood extends Document {
  name: string;
  units: ILocalFoodUnit[];
  created_at: Date;
  updated_at: Date;
}

const LocalFoodUnitSchema = new Schema({
  unit_name: { type: String, required: true, enum: ['gram', 'adet', 'tabak', 'porsiyon'] },
  calories: { type: Number, required: true },
  protein_g: { type: Number, required: true },
  carbs_g: { type: Number, required: true },
  fat_g: { type: Number, required: true },
});

const LocalFoodSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  units: [LocalFoodUnitSchema],
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Text index for fast searching by name
LocalFoodSchema.index({ name: 'text' });

export const LocalFood = mongoose.models.LocalFood || mongoose.model<ILocalFood>('LocalFood', LocalFoodSchema);
