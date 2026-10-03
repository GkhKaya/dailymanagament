import mongoose, { Schema, type Document } from 'mongoose';
import type { CompanyRole } from '@/lib/company-permissions';

export interface ICompanyMember extends Document {
  company_id: mongoose.Types.ObjectId;
  user_id: string;
  role: CompanyRole;
  joined_at: Date;
}

const CompanyMemberSchema = new Schema<ICompanyMember>({
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  user_id: { type: String, required: true, index: true },
  role: { type: String, enum: ['owner', 'admin'], required: true },
  joined_at: { type: Date, default: Date.now },
});

CompanyMemberSchema.index({ company_id: 1, user_id: 1 }, { unique: true });
export const CompanyMember = mongoose.models.CompanyMember || mongoose.model<ICompanyMember>('CompanyMember', CompanyMemberSchema);
