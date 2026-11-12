"use server";

import mongoose from "mongoose";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Account } from "@/models/Account";
import { Installment } from "@/models/Installment";
import { splitInstallments } from "@/lib/installment-rules";
import { syncInstallments } from "@/lib/installment-sync";

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user.id;
}

export type InstallmentDTO = {
  id: string;
  name: string;
  accountId: string;
  accountName?: string;
  totalAmount: number;
  installmentCount: number;
  installmentAmount: number;
  paidCount: number;
  remainingAmount: number;
  nextChargeDate: string | null; // YYYY-MM-DD
  isActive: boolean;
};

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function addInstallmentAction(data: {
  name: string;
  account_id: string;
  category_id?: string;
  total_amount: number;
  installment_count: number;
  first_charge_date: string; // YYYY-MM-DD
}) {
  try {
    await connectDB();
    const userId = await getUserId();

    const name = data.name?.trim();
    if (!name) return { success: false, error: "Alışveriş adı zorunludur." };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.first_charge_date)) return { success: false, error: "İlk taksit tarihi geçersiz." };

    const amounts = splitInstallments(Number(data.total_amount), Number(data.installment_count));
    const account = await Account.findOne({ _id: new mongoose.Types.ObjectId(data.account_id), user_id: userId });
    if (!account) return { success: false, error: "Hesap bulunamadı." };

    const [y, m, d] = data.first_charge_date.split("-").map(Number);
    const first = new Date(y, m - 1, d);

    await Installment.create({
      user_id: userId,
      name,
      account_id: account._id,
      category_id: data.category_id && mongoose.Types.ObjectId.isValid(data.category_id) ? new mongoose.Types.ObjectId(data.category_id) : null,
      total_amount: mongoose.Types.Decimal128.fromString(Number(data.total_amount).toString()),
      installment_count: amounts.length,
      amounts,
      first_charge_date: first,
      charge_day: d,
      paid_count: 0,
      next_run_date: first,
      is_active: true,
    });

    // A first installment dated today (or earlier) is charged right away.
    const sync = await syncInstallments(userId);

    revalidatePath("/dashboard");
    return { success: true, chargedNow: sync.success ? sync.processed ?? 0 : 0 };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

export async function getInstallmentsAction(accountId?: string): Promise<{ success: boolean; installments?: InstallmentDTO[]; error?: string }> {
  try {
    await connectDB();
    const userId = await getUserId();
    const filter: Record<string, unknown> = { user_id: userId };
    if (accountId) filter.account_id = new mongoose.Types.ObjectId(accountId);

    const plans = await Installment.find(filter).sort({ is_active: -1, next_run_date: 1, created_at: -1 }).populate("account_id").lean();
    type LeanPlan = {
      _id: mongoose.Types.ObjectId;
      name: string;
      account_id: { _id?: mongoose.Types.ObjectId; name?: string } | mongoose.Types.ObjectId;
      total_amount: mongoose.Types.Decimal128;
      installment_count: number;
      amounts?: number[];
      paid_count: number;
      next_run_date?: Date | null;
      is_active: boolean;
    };
    const installments: InstallmentDTO[] = (plans as unknown as LeanPlan[]).map((p) => {
      const acc = p.account_id as { _id?: mongoose.Types.ObjectId; name?: string };
      const amounts: number[] = p.amounts || [];
      const remaining = amounts.slice(p.paid_count).reduce((a: number, b: number) => a + b, 0);
      return {
        id: p._id.toString(),
        name: p.name,
        accountId: acc?._id?.toString() ?? String(p.account_id),
        accountName: acc?.name,
        totalAmount: parseFloat(p.total_amount.toString()),
        installmentCount: p.installment_count,
        installmentAmount: amounts[0] ?? 0,
        paidCount: p.paid_count,
        remainingAmount: Math.round(remaining * 100) / 100,
        nextChargeDate: p.next_run_date ? toDateKey(new Date(p.next_run_date)) : null,
        isActive: p.is_active,
      };
    });
    return { success: true, installments };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

/** Stops future charges. Installments already charged stay as normal expenses. */
export async function deleteInstallmentAction(id: string) {
  try {
    await connectDB();
    const userId = await getUserId();
    await Installment.deleteOne({ _id: new mongoose.Types.ObjectId(id), user_id: userId });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}
