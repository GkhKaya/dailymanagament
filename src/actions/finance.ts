"use server";

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Account } from "@/models/Account";
import { Transaction } from "@/models/Transaction";
import { Category } from "@/models/Category";
import { Debt } from "@/models/Debt";
import { DebtStatus } from "@/models/Enums";
import { Subscription } from "@/models/Subscription";

// Helper to check session
async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

// ── ACCOUNTS ──
export async function addAccountAction(data: { name: string; type: any; balance: number; credit_card_details?: any }) {
  try {
    await connectDB();
    const userId = await getUserId();
    
    const acc = await Account.create({
      user_id: userId,
      name: data.name,
      type: data.type as any,
      balance: mongoose.Types.Decimal128.fromString(data.balance.toString()),
      credit_card_details: data.credit_card_details ? {
        total_limit: mongoose.Types.Decimal128.fromString(data.credit_card_details.total_limit.toString()),
        current_debt: mongoose.Types.Decimal128.fromString(data.credit_card_details.current_debt.toString()),
        statement_day: data.credit_card_details.statement_day,
        payment_due_day: data.credit_card_details.payment_due_day
      } : undefined
    });
    
    return { success: true, id: acc._id.toString() };
  } catch (e: unknown) {
    const err = e as Error;
    console.error(err);
    return { success: false, error: err.message };
  }
}

export async function updateAccountAction(id: string, data: { name: string; balance: number }) {
  try {
    await connectDB();
    const userId = await getUserId();
    
    await Account.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) as any, user_id: userId as any },
      { 
        name: data.name,
        balance: mongoose.Types.Decimal128.fromString(data.balance.toString())
      }
    );
    
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

export async function deleteAccountAction(id: string) {
  try {
    await connectDB();
    const userId = await getUserId();
    await Account.findOneAndDelete({ _id: new mongoose.Types.ObjectId(id) as any, user_id: userId as any });
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

// ── TRANSACTIONS ──
export async function addTransactionAction(data: { type: any; amount: number; date: string; description: string; category_id: string; account_id: string; source?: string }) {
  try {
    await connectDB();
    const userId = await getUserId();
    
    await Transaction.create({
      user_id: userId,
      type: data.type as any,
      amount: mongoose.Types.Decimal128.fromString(data.amount.toString()),
      date: new Date(data.date),
      description: data.description,
      category_id: new mongoose.Types.ObjectId(data.category_id),
      account_id: new mongoose.Types.ObjectId(data.account_id),
      source: (data.source as any) || "manual"
    });
    
    // Update account balance
    const account = await Account.findOne({ _id: new mongoose.Types.ObjectId(data.account_id) as any, user_id: userId as any });
    if (account) {
      let currentBal = parseFloat(account.balance.toString());
      if (data.type as any === 'income') {
        currentBal += data.amount;
      } else {
        currentBal -= data.amount;
      }
      account.balance = mongoose.Types.Decimal128.fromString(currentBal.toString());
      await account.save();
    }

    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error(err);
    return { success: false, error: err.message };
  }
}

export async function deleteTransactionAction(id: string) {
  try {
    await connectDB();
    const userId = await getUserId();
    
    const txn = await Transaction.findOne({ _id: new mongoose.Types.ObjectId(id) as any, user_id: userId as any });
    if (!txn) {
       return { success: false, error: "İşlem bulunamadı." };
    }

    // Revert account balance
    const account = await Account.findOne({ _id: txn.account_id, user_id: userId });
    if (account) {
      let currentBal = parseFloat(account.balance.toString());
      if (txn.type === 'income') {
        currentBal -= parseFloat(txn.amount.toString());
      } else {
        currentBal += parseFloat(txn.amount.toString());
      }
      account.balance = mongoose.Types.Decimal128.fromString(currentBal.toString());
      await account.save();
    }

    await Transaction.deleteOne({ _id: txn._id });
    
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error(err);
    return { success: false, error: err.message };
  }
}

export async function updateTransactionAction(id: string, data: { type: any; amount: number; date: string; description: string; category_id: string; account_id: string }) {
  try {
    await connectDB();
    const userId = await getUserId();
    
    const txn = await Transaction.findOne({ _id: new mongoose.Types.ObjectId(id) as any, user_id: userId as any });
    if (!txn) {
       return { success: false, error: "İşlem bulunamadı." };
    }

    const oldAmount = parseFloat(txn.amount.toString());
    const oldType = txn.type;
    const oldAccountId = txn.account_id.toString();

    // Revert old transaction effect on old account
    const oldAccount = await Account.findOne({ _id: txn.account_id, user_id: userId });
    if (oldAccount) {
      let oldBal = parseFloat(oldAccount.balance.toString());
      if (oldType === 'income') {
        oldBal -= oldAmount;
      } else {
        oldBal += oldAmount;
      }
      oldAccount.balance = mongoose.Types.Decimal128.fromString(oldBal.toString());
      await oldAccount.save();
    }

    // Apply new transaction effect on new account
    const newAccount = await Account.findOne({ _id: new mongoose.Types.ObjectId(data.account_id) as any, user_id: userId as any });
    if (newAccount) {
      let newBal = parseFloat(newAccount.balance.toString());
      if (data.type as any === 'income') {
        newBal += data.amount;
      } else {
        newBal -= data.amount;
      }
      newAccount.balance = mongoose.Types.Decimal128.fromString(newBal.toString());
      await newAccount.save();
    }

    // Update the transaction itself
    txn.type = data.type as any;
    txn.amount = mongoose.Types.Decimal128.fromString(data.amount.toString());
    txn.date = new Date(data.date);
    txn.description = data.description;
    txn.category_id = new mongoose.Types.ObjectId(data.category_id);
    txn.account_id = new mongoose.Types.ObjectId(data.account_id);
    await txn.save();

    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error(err);
    return { success: false, error: err.message };
  }
}

// ── CATEGORIES ──
export async function getCategoriesAction() {
  try {
    await connectDB();
    const userId = await getUserId();

    // Ensure the user has categories. If 0, seed them specifically for this user.
    const userCategoryCount = await Category.countDocuments({ user_id: userId });
    if (userCategoryCount === 0) {
      const defaultCats = [
        { user_id: userId, name: 'Market', type: 'expense', icon: 'cart', color: '#ef4444', is_default: false },
        { user_id: userId, name: 'Ulaşım', type: 'expense', icon: 'car', color: '#f59e0b', is_default: false },
        { user_id: userId, name: 'Eğlence', type: 'expense', icon: 'film', color: '#8b5cf6', is_default: false },
        { user_id: userId, name: 'Kafe/Restoran', type: 'expense', icon: 'coffee', color: '#f43f5e', is_default: false },
        { user_id: userId, name: 'Faturalar', type: 'expense', icon: 'zap', color: '#0ea5e9', is_default: false },
        { user_id: userId, name: 'Ev/Kira', type: 'expense', icon: 'home', color: '#10b981', is_default: false },
        { user_id: userId, name: 'Sağlık', type: 'expense', icon: 'heart', color: '#ec4899', is_default: false },
        { user_id: userId, name: 'Maaş', type: 'income', icon: 'briefcase', color: '#22c55e', is_default: false },
        { user_id: userId, name: 'Yatırım Getirisi', type: 'income', icon: 'trending', color: '#3b82f6', is_default: false },
        { user_id: userId, name: 'Diğer (Gelir)', type: 'income', icon: 'gift', color: '#14b8a6', is_default: false },
      ];
      await Category.insertMany(defaultCats);
    }

    const categoriesRaw = await Category.find({ $or: [{ user_id: userId }, { is_default: true }] }).lean();
    const categories = categoriesRaw.map((cat: any) => ({
      ...cat,
      _id: cat._id.toString(),
      id: cat._id.toString(),
      user_id: cat.user_id?.toString()
    }));
    return { success: true, categories };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

export async function addCategoryAction(data: { name: string; type: any; icon: string; color: string }) {
  try {
    await connectDB();
    const userId = await getUserId();
    await Category.create({
      user_id: userId,
      name: data.name,
      type: data.type as any,
      icon: data.icon,
      color: data.color
    });
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    await connectDB();
    const userId = await getUserId();
    await Category.findOneAndDelete({ _id: new mongoose.Types.ObjectId(id), user_id: userId, is_default: false });
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

// ── DEBTS ──
export async function addDebtAction(data: { person_name: string; direction: string; amount: number; date: string; due_date?: string }) {
  try {
    await connectDB();
    const userId = await getUserId();
    await Debt.create({
      user_id: userId,
      person_name: data.person_name,
      direction: data.direction,
      original_amount: mongoose.Types.Decimal128.fromString(data.amount.toString()),
      remaining_amount: mongoose.Types.Decimal128.fromString(data.amount.toString()),
      date: new Date(data.date),
      due_date: data.due_date ? new Date(data.due_date) : null,
      status: DebtStatus.OPEN
    });
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

// ── SUBSCRIPTIONS ──
export async function addSubscriptionAction(data: { name: string; amount: number; frequency: string; category_id: string; account_id: string; billing_day: number }) {
  try {
    await connectDB();
    const userId = await getUserId();
    
    // Calculate next run date based on billing day
    const today = new Date();
    let nextRun = new Date(today.getFullYear(), today.getMonth(), data.billing_day);
    if (nextRun <= today) {
      nextRun.setMonth(nextRun.getMonth() + 1);
    }

    await Subscription.create({
      user_id: userId,
      name: data.name,
      amount: mongoose.Types.Decimal128.fromString(data.amount.toString()),
      frequency: data.frequency,
      category_id: new mongoose.Types.ObjectId(data.category_id),
      account_id: new mongoose.Types.ObjectId(data.account_id),
      billing_day: data.billing_day,
      next_run_date: nextRun,
      is_active: true
    });
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

export async function updateSubscriptionAction(id: string, data: { name: string; amount: number; billing_day: number }) {
  try {
    await connectDB();
    const userIdStr = await getUserId();
    
    // Calculate new next_run_date
    const now = new Date();
    let nextRun = new Date(now.getFullYear(), now.getMonth(), data.billing_day);
    if (nextRun < now) {
      nextRun = new Date(now.getFullYear(), now.getMonth() + 1, data.billing_day);
    }

    const updated = await Subscription.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), user_id: userIdStr },
      { 
        $set: { 
          name: data.name, 
          amount: mongoose.Types.Decimal128.fromString(data.amount.toString()), 
          billing_day: data.billing_day,
          next_run_date: nextRun
        } 
      }
    );
    if (!updated) return { success: false, error: "Abonelik bulunamadı" };
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

export async function deleteSubscriptionAction(id: string) {
  try {
    await connectDB();
    const userIdStr = await getUserId();
    const deleted = await Subscription.findOneAndDelete({ _id: new mongoose.Types.ObjectId(id), user_id: userIdStr });
    if (!deleted) return { success: false, error: "Abonelik bulunamadı" };
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

export async function updateDebtAction(id: string, data: { person_name: string; amount: number; date: string; due_date?: string }) {
  try {
    await connectDB();
    const userIdStr = await getUserId();
    const updated = await Debt.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), user_id: userIdStr },
      { 
        $set: { 
          person_name: data.person_name,
          original_amount: mongoose.Types.Decimal128.fromString(data.amount.toString()),
          remaining_amount: mongoose.Types.Decimal128.fromString(data.amount.toString()),
          date: new Date(data.date),
          due_date: data.due_date ? new Date(data.due_date) : undefined
        } 
      }
    );
    if (!updated) return { success: false, error: "Borç bulunamadı" };
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

export async function deleteDebtAction(id: string) {
  try {
    await connectDB();
    const userIdStr = await getUserId();
    const deleted = await Debt.findOneAndDelete({ _id: new mongoose.Types.ObjectId(id), user_id: userIdStr });
    if (!deleted) return { success: false, error: "Borç bulunamadı" };
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

