import mongoose, { Schema, type Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  owner_user_id: string;
  tax_number?: string | null;
  currency: string;
  description?: string | null;
  created_at: Date;
  updated_at: Date;
}

const CompanySchema = new Schema<ICompany>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  owner_user_id: { type: String, required: true, index: true },
  tax_number: { type: String, default: null, trim: true, maxlength: 30 },
  currency: { type: String, default: 'TRY', maxlength: 3 },
  description: { type: String, default: null, trim: true, maxlength: 500 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const Company = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
