import mongoose, { Schema, type Document } from 'mongoose';

export interface ICompanyTransaction extends Document {
  company_id: mongoose.Types.ObjectId;
  type: 'income' | 'expense';
  amount: mongoose.Types.Decimal128;
  date: Date;
  account_id: mongoose.Types.ObjectId;
  category_id: mongoose.Types.ObjectId;
  description: string;
  created_by: string;
  updated_by: string;
  created_at: Date;
  updated_at: Date;
}

const CompanyTransactionSchema = new Schema<ICompanyTransaction>({
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Schema.Types.Decimal128, required: true },
  date: { type: Date, required: true, index: true },
  account_id: { type: Schema.Types.ObjectId, ref: 'CompanyAccount', required: true },
  category_id: { type: Schema.Types.ObjectId, ref: 'CompanyCategory', required: true },
  description: { type: String, default: '', trim: true, maxlength: 200 },
  created_by: { type: String, required: true },
  updated_by: { type: String, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

CompanyTransactionSchema.index({ company_id: 1, date: -1 });
export const CompanyTransaction = mongoose.models.CompanyTransaction || mongoose.model<ICompanyTransaction>('CompanyTransaction', CompanyTransactionSchema);
