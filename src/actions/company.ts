'use server';

import mongoose from 'mongoose';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { canDeleteCompany, canManageCompanyFinance, canManageCompanyMembers, type CompanyRole } from '@/lib/company-permissions';
import { Company } from '@/models/Company';
import { CompanyAccount } from '@/models/CompanyAccount';
import { CompanyCategory } from '@/models/CompanyCategory';
import { CompanyInvitation } from '@/models/CompanyInvitation';
import { CompanyMember } from '@/models/CompanyMember';
import { CompanyTransaction } from '@/models/CompanyTransaction';
import { User } from '@/models/User';

export type CompanyWorkspaceData = {
  companies: Array<{ id: string; name: string; currency: string; role: CompanyRole }>;
  activeCompany: null | { id: string; name: string; currency: string; taxNumber: string; description: string; role: CompanyRole };
  accounts: Array<{ id: string; name: string; type: 'cash' | 'bank' | 'other'; openingBalance: number; balance: number }>;
  categories: Array<{ id: string; name: string; type: 'income' | 'expense'; color: string }>;
  transactions: Array<{ id: string; type: 'income' | 'expense'; amount: number; date: string; accountId: string; accountName: string; categoryId: string; categoryName: string; description: string; createdBy: string }>;
  members: Array<{ id: string; userId: string; email: string; role: CompanyRole }>;
  invitations: Array<{ id: string; companyId: string; companyName: string; inviterEmail: string; createdAt: string }>;
};

const DEFAULT_CATEGORIES = [
  { name: 'Satış', type: 'income', color: '#8ec13b' },
  { name: 'Hizmet Geliri', type: 'income', color: '#22c55e' },
  { name: 'Diğer Gelir', type: 'income', color: '#14b8a6' },
  { name: 'Personel', type: 'expense', color: '#ef4444' },
  { name: 'Kira', type: 'expense', color: '#f59e0b' },
  { name: 'Fatura', type: 'expense', color: '#3b82f6' },
  { name: 'Tedarik', type: 'expense', color: '#8b5cf6' },
  { name: 'Diğer Gider', type: 'expense', color: '#64748b' },
] as const;

function numberValue(value: unknown) {
  if (value && typeof value === 'object' && 'toString' in value) return Number(value.toString());
  return Number(value || 0);
}

function objectId(value: string) {
  if (!mongoose.Types.ObjectId.isValid(value)) throw new Error('Geçersiz kayıt kimliği.');
  return new mongoose.Types.ObjectId(value);
}

function cleanText(value: unknown, max: number) {
  return String(value || '').trim().slice(0, max);
}

async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Oturum açmanız gerekiyor.');
  return session.user;
}

async function membershipFor(companyId: string, userId: string, roles?: CompanyRole[]) {
  const membership = await CompanyMember.findOne({ company_id: objectId(companyId), user_id: userId }).lean();
  if (!membership || (roles && !roles.includes(membership.role as CompanyRole))) throw new Error('Bu şirket için yetkiniz yok.');
  return membership;
}

export async function getCompanyWorkspaceAction(companyId?: string): Promise<{ success: true; data: CompanyWorkspaceData } | { success: false; error: string }> {
  try {
    const user = await currentUser();
    await connectDB();
    const memberships = await CompanyMember.find({ user_id: user.id }).lean();
    const companyIds = memberships.map((item) => item.company_id);
    const companyDocs = await Company.find({ _id: { $in: companyIds } }).sort({ created_at: 1 }).lean();
    const roleByCompany = new Map(memberships.map((item) => [item.company_id.toString(), item.role as CompanyRole]));
    const companies = companyDocs.map((company) => ({ id: company._id.toString(), name: company.name, currency: company.currency, role: roleByCompany.get(company._id.toString()) || 'admin' as CompanyRole }));
    const selectedId = companyId && roleByCompany.has(companyId) ? companyId : companies[0]?.id;

    const invitationDocs = await CompanyInvitation.find({ invitee_user_id: user.id, status: 'pending' }).sort({ created_at: -1 }).lean();
    const invitationCompanyIds = invitationDocs.map((item) => item.company_id);
    const inviterIds = invitationDocs.map((item) => item.inviter_user_id);
    const [invitationCompanies, inviters] = await Promise.all([
      Company.find({ _id: { $in: invitationCompanyIds } }).lean(),
      User.find({ _id: { $in: inviterIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id)) } }).lean(),
    ]);
    const invitationCompanyMap = new Map(invitationCompanies.map((item) => [item._id.toString(), item.name]));
    const inviterMap = new Map(inviters.map((item) => [item._id.toString(), item.email]));
    const invitations = invitationDocs.map((item) => ({
      id: item._id.toString(), companyId: item.company_id.toString(), companyName: invitationCompanyMap.get(item.company_id.toString()) || 'Şirket',
      inviterEmail: inviterMap.get(item.inviter_user_id) || 'Şirket sahibi', createdAt: item.created_at.toISOString(),
    }));

    if (!selectedId) return { success: true, data: { companies, activeCompany: null, accounts: [], categories: [], transactions: [], members: [], invitations } };
    const company = companyDocs.find((item) => item._id.toString() === selectedId)!;
    const [accountDocs, categoryDocs, transactionDocs, memberDocs] = await Promise.all([
      CompanyAccount.find({ company_id: company._id, is_active: true }).sort({ created_at: 1 }).lean(),
      CompanyCategory.find({ company_id: company._id }).sort({ type: 1, name: 1 }).lean(),
      CompanyTransaction.find({ company_id: company._id }).sort({ date: -1, created_at: -1 }).limit(1500).lean(),
      CompanyMember.find({ company_id: company._id }).sort({ role: 1, joined_at: 1 }).lean(),
    ]);
    const memberUserIds = memberDocs.map((item) => item.user_id).filter((id) => mongoose.Types.ObjectId.isValid(id));
    const memberUsers = await User.find({ _id: { $in: memberUserIds.map((id) => new mongoose.Types.ObjectId(id)) } }).lean();
    const emailByUser = new Map(memberUsers.map((item) => [item._id.toString(), item.email]));
    const accountNameById = new Map(accountDocs.map((item) => [item._id.toString(), item.name]));
    const categoryNameById = new Map(categoryDocs.map((item) => [item._id.toString(), item.name]));
    const movementByAccount = new Map<string, number>();
    transactionDocs.forEach((item) => movementByAccount.set(item.account_id.toString(), (movementByAccount.get(item.account_id.toString()) || 0) + (item.type === 'income' ? numberValue(item.amount) : -numberValue(item.amount))));

    return {
      success: true,
      data: {
        companies,
        activeCompany: { id: company._id.toString(), name: company.name, currency: company.currency, taxNumber: company.tax_number || '', description: company.description || '', role: roleByCompany.get(company._id.toString())! },
        accounts: accountDocs.map((item) => ({ id: item._id.toString(), name: item.name, type: item.type, openingBalance: numberValue(item.opening_balance), balance: numberValue(item.opening_balance) + (movementByAccount.get(item._id.toString()) || 0) })),
        categories: categoryDocs.map((item) => ({ id: item._id.toString(), name: item.name, type: item.type, color: item.color })),
        transactions: transactionDocs.map((item) => ({ id: item._id.toString(), type: item.type, amount: numberValue(item.amount), date: item.date.toISOString(), accountId: item.account_id.toString(), accountName: accountNameById.get(item.account_id.toString()) || 'Hesap', categoryId: item.category_id.toString(), categoryName: categoryNameById.get(item.category_id.toString()) || 'Kategori', description: item.description, createdBy: emailByUser.get(item.created_by) || item.created_by })),
        members: memberDocs.map((item) => ({ id: item._id.toString(), userId: item.user_id, email: emailByUser.get(item.user_id) || item.user_id, role: item.role as CompanyRole })),
        invitations,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Şirket bilgileri alınamadı.' };
  }
}

export async function createCompanyAction(input: { name: string; taxNumber?: string; description?: string; currency?: string }) {
  try {
    const user = await currentUser();
    await connectDB();
    const name = cleanText(input.name, 120);
    if (name.length < 2) return { success: false, error: 'Şirket adı en az 2 karakter olmalıdır.' };
    const company = await Company.create({ name, owner_user_id: user.id, tax_number: cleanText(input.taxNumber, 30) || null, description: cleanText(input.description, 500) || null, currency: ['TRY', 'USD', 'EUR'].includes(input.currency || '') ? input.currency : 'TRY' });
    await Promise.all([
      CompanyMember.create({ company_id: company._id, user_id: user.id, role: 'owner' }),
      CompanyAccount.create({ company_id: company._id, name: 'Ana Kasa', type: 'cash', opening_balance: 0 }),
      CompanyCategory.insertMany(DEFAULT_CATEGORIES.map((item) => ({ ...item, company_id: company._id }))),
    ]);
    revalidatePath('/company');
    return { success: true, companyId: company._id.toString() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Şirket oluşturulamadı.' };
  }
}

export async function createCompanyAccountAction(companyId: string, input: { name: string; type: 'cash' | 'bank' | 'other'; openingBalance: number }) {
  try {
    const user = await currentUser(); await connectDB();
    const member = await membershipFor(companyId, user.id);
    if (!canManageCompanyFinance(member.role as CompanyRole)) throw new Error('Bu işlem için yetkiniz yok.');
    const name = cleanText(input.name, 80); const openingBalance = Number(input.openingBalance || 0);
    if (!name || !Number.isFinite(openingBalance)) return { success: false, error: 'Hesap bilgileri geçersiz.' };
    await CompanyAccount.create({ company_id: objectId(companyId), name, type: ['cash', 'bank', 'other'].includes(input.type) ? input.type : 'bank', opening_balance: openingBalance });
    revalidatePath('/company'); return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Hesap eklenemedi.' }; }
}

export async function createCompanyCategoryAction(companyId: string, input: { name: string; type: 'income' | 'expense' }) {
  try {
    const user = await currentUser(); await connectDB();
    const member = await membershipFor(companyId, user.id);
    if (!canManageCompanyFinance(member.role as CompanyRole)) throw new Error('Bu işlem için yetkiniz yok.');
    const name = cleanText(input.name, 80);
    if (!name || !['income', 'expense'].includes(input.type)) return { success: false, error: 'Kategori bilgileri geçersiz.' };
    await CompanyCategory.create({ company_id: objectId(companyId), name, type: input.type });
    revalidatePath('/company'); return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Kategori eklenemedi.' }; }
}

export async function saveCompanyTransactionAction(companyId: string, input: { id?: string; type: 'income' | 'expense'; amount: number; date: string; accountId: string; categoryId: string; description?: string }) {
  try {
    const user = await currentUser(); await connectDB();
    const member = await membershipFor(companyId, user.id);
    if (!canManageCompanyFinance(member.role as CompanyRole)) throw new Error('Bu işlem için yetkiniz yok.');
    const amount = Number(input.amount); const companyObjectId = objectId(companyId);
    if (!Number.isFinite(amount) || amount <= 0 || !['income', 'expense'].includes(input.type)) return { success: false, error: 'Tutar ve işlem türü geçersiz.' };
    const [account, category] = await Promise.all([
      CompanyAccount.findOne({ _id: objectId(input.accountId), company_id: companyObjectId, is_active: true }).lean(),
      CompanyCategory.findOne({ _id: objectId(input.categoryId), company_id: companyObjectId, type: input.type }).lean(),
    ]);
    if (!account || !category) return { success: false, error: 'Hesap veya kategori bu şirkete ait değil.' };
    const payload = { company_id: companyObjectId, type: input.type, amount, date: new Date(`${input.date}T12:00:00.000Z`), account_id: account._id, category_id: category._id, description: cleanText(input.description, 200), updated_by: user.id };
    if (Number.isNaN(payload.date.getTime())) return { success: false, error: 'Tarih geçersiz.' };
    if (input.id) {
      const updated = await CompanyTransaction.findOneAndUpdate({ _id: objectId(input.id), company_id: companyObjectId }, { $set: payload }, { new: true });
      if (!updated) return { success: false, error: 'İşlem bulunamadı.' };
    } else await CompanyTransaction.create({ ...payload, created_by: user.id });
    revalidatePath('/company'); return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'İşlem kaydedilemedi.' }; }
}

export async function deleteCompanyTransactionAction(companyId: string, transactionId: string) {
  try {
    const user = await currentUser(); await connectDB();
    const member = await membershipFor(companyId, user.id);
    if (!canManageCompanyFinance(member.role as CompanyRole)) throw new Error('Bu işlem için yetkiniz yok.');
    await CompanyTransaction.findOneAndDelete({ _id: objectId(transactionId), company_id: objectId(companyId) });
    revalidatePath('/company'); return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'İşlem silinemedi.' }; }
}

export async function sendCompanyInvitationAction(companyId: string, emailInput: string) {
  try {
    const user = await currentUser(); await connectDB();
    const member = await membershipFor(companyId, user.id);
    if (!canManageCompanyMembers(member.role as CompanyRole)) throw new Error('Yalnızca şirket sahibi admin davet edebilir.');
    const email = cleanText(emailInput, 180).toLocaleLowerCase('tr-TR');
    const invitee = await User.findOne({ email }).lean();
    if (!invitee) return { success: false, error: 'Bu e-posta ile kayıtlı kullanıcı bulunamadı.' };
    const inviteeId = invitee._id.toString();
    if (inviteeId === user.id) return { success: false, error: 'Kendinizi davet edemezsiniz.' };
    if (await CompanyMember.exists({ company_id: objectId(companyId), user_id: inviteeId })) return { success: false, error: 'Bu kullanıcı zaten şirket üyesi.' };
    if (await CompanyInvitation.exists({ company_id: objectId(companyId), invitee_user_id: inviteeId, status: 'pending' })) return { success: false, error: 'Bu kullanıcı için bekleyen davet var.' };
    await CompanyInvitation.create({ company_id: objectId(companyId), inviter_user_id: user.id, invitee_user_id: inviteeId, invitee_email: email });
    revalidatePath('/company'); return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Davet gönderilemedi.' }; }
}

export async function respondCompanyInvitationAction(invitationId: string, response: 'accepted' | 'rejected') {
  try {
    const user = await currentUser(); await connectDB();
    if (!['accepted', 'rejected'].includes(response)) return { success: false, error: 'Geçersiz davet yanıtı.' };
    const invitation = await CompanyInvitation.findOne({ _id: objectId(invitationId), invitee_user_id: user.id, status: 'pending' });
    if (!invitation) return { success: false, error: 'Bekleyen davet bulunamadı.' };
    invitation.status = response; invitation.responded_at = new Date(); await invitation.save();
    if (response === 'accepted') await CompanyMember.updateOne({ company_id: invitation.company_id, user_id: user.id }, { $setOnInsert: { role: 'admin', joined_at: new Date() } }, { upsert: true });
    revalidatePath('/company'); return { success: true, companyId: invitation.company_id.toString() };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Davet yanıtlanamadı.' }; }
}

export async function removeCompanyAdminAction(companyId: string, memberId: string) {
  try {
    const user = await currentUser(); await connectDB();
    const owner = await membershipFor(companyId, user.id);
    if (!canManageCompanyMembers(owner.role as CompanyRole)) throw new Error('Yalnızca şirket sahibi admin çıkarabilir.');
    const removed = await CompanyMember.findOneAndDelete({ _id: objectId(memberId), company_id: objectId(companyId), role: 'admin' });
    if (!removed) return { success: false, error: 'Admin bulunamadı.' };
    revalidatePath('/company'); return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Admin çıkarılamadı.' }; }
}

export async function deleteCompanyAction(companyId: string) {
  try {
    const user = await currentUser(); await connectDB();
    const owner = await membershipFor(companyId, user.id);
    if (!canDeleteCompany(owner.role as CompanyRole)) throw new Error('Yalnızca şirket sahibi şirketi silebilir.');
    const id = objectId(companyId);
    await Promise.all([CompanyTransaction.deleteMany({ company_id: id }), CompanyAccount.deleteMany({ company_id: id }), CompanyCategory.deleteMany({ company_id: id }), CompanyInvitation.deleteMany({ company_id: id }), CompanyMember.deleteMany({ company_id: id })]);
    await Company.deleteOne({ _id: id, owner_user_id: user.id });
    revalidatePath('/company'); return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Şirket silinemedi.' }; }
}
