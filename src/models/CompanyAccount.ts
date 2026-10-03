import mongoose, { Schema, type Document } from 'mongoose';

export interface ICompanyAccount extends Document {
  company_id: mongoose.Types.ObjectId;
  name: string;
  type: 'cash' | 'bank' | 'other';
  opening_balance: mongoose.Types.Decimal128;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const CompanyAccountSchema = new Schema<ICompanyAccount>({
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  type: { type: String, enum: ['cash', 'bank', 'other'], default: 'bank' },
  opening_balance: { type: Schema.Types.Decimal128, default: 0 },
  is_active: { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

CompanyAccountSchema.index({ company_id: 1, name: 1 }, { unique: true });
export const CompanyAccount = mongoose.models.CompanyAccount || mongoose.model<ICompanyAccount>('CompanyAccount', CompanyAccountSchema);
