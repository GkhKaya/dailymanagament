import mongoose, { Schema, type Document } from 'mongoose';

export interface ICompanyCategory extends Document {
  company_id: mongoose.Types.ObjectId;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

const CompanyCategorySchema = new Schema<ICompanyCategory>({
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  type: { type: String, enum: ['income', 'expense'], required: true },
  color: { type: String, default: '#8ec13b', maxlength: 20 },
});

CompanyCategorySchema.index({ company_id: 1, name: 1, type: 1 }, { unique: true });
export const CompanyCategory = mongoose.models.CompanyCategory || mongoose.model<ICompanyCategory>('CompanyCategory', CompanyCategorySchema);
