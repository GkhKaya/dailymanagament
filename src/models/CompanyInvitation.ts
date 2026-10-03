import mongoose, { Schema, type Document } from 'mongoose';

export interface ICompanyInvitation extends Document {
  company_id: mongoose.Types.ObjectId;
  inviter_user_id: string;
  invitee_user_id: string;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'rejected';
  responded_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

const CompanyInvitationSchema = new Schema<ICompanyInvitation>({
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  inviter_user_id: { type: String, required: true },
  invitee_user_id: { type: String, required: true, index: true },
  invitee_email: { type: String, required: true, lowercase: true, trim: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending', index: true },
  responded_at: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

CompanyInvitationSchema.index({ company_id: 1, invitee_user_id: 1, status: 1 });
export const CompanyInvitation = mongoose.models.CompanyInvitation || mongoose.model<ICompanyInvitation>('CompanyInvitation', CompanyInvitationSchema);
