import mongoose, { Schema, Document } from 'mongoose';

/** A purchase split into monthly charges (taksit) on one account, usually a credit card. */
export interface IInstallment extends Document {
  user_id: string;
  name: string;
  account_id: mongoose.Types.ObjectId;
  category_id?: mongoose.Types.ObjectId | null;
  total_amount: mongoose.Types.Decimal128;
  installment_count: number;
  amounts: number[]; // per-installment amounts, last absorbs rounding
  first_charge_date: Date;
  charge_day: number; // 1..31, clamped to short months
  paid_count: number;
  next_run_date: Date | null;
  is_active: boolean;
  created_at: Date;
}

const InstallmentSchema: Schema = new Schema({
  user_id: { type: String, ref: 'User', required: true },
  name: { type: String, required: true },
  account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  category_id: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  total_amount: { type: Schema.Types.Decimal128, required: true },
  installment_count: { type: Number, required: true, min: 1, max: 60 },
  amounts: { type: [Number], required: true },
  first_charge_date: { type: Date, required: true },
  charge_day: { type: Number, required: true, min: 1, max: 31 },
  paid_count: { type: Number, default: 0 },
  next_run_date: { type: Date, default: null },
  is_active: { type: Boolean, default: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

InstallmentSchema.index({ user_id: 1, is_active: 1, next_run_date: 1 });

export const Installment = mongoose.models.Installment || mongoose.model<IInstallment>('Installment', InstallmentSchema);
