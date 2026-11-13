"use server";

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Account } from "@/models/Account";
import { Transaction } from "@/models/Transaction";
import { Category } from "@/models/Category";
import { Debt } from "@/models/Debt";
import { DebtDirection, DebtStatus, TransactionSource, TransactionType } from "@/models/Enums";
import { Subscription } from "@/models/Subscription";
import { User } from "@/models/User";
import { revalidatePath } from "next/cache";
import { applyTransactionEffect, getCreditCardDebt, validateTransfer } from "@/lib/finance-rules";
import { localizeCategoryName } from "@/lib/category-helpers";
import { applyDebtPayment, debtFlow, remainingAfterEdit, signedAmount } from "@/lib/debt-rules";

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

export async function updateAccountAction(id: string, data: {
  name: string;
  balance: number;
  credit_card_details?: { total_limit: number; current_debt: number; statement_day: number; payment_due_day: number };
  // When set, the balance/debt difference is also recorded as an income or expense transaction.
  recordDifference?: { type: 'income' | 'expense'; category_id?: string; description?: string };
}) {
  try {
    await connectDB();
    const userId = await getUserId();

    const account = await Account.findOne({ _id: new mongoose.Types.ObjectId(id) as any, user_id: userId as any });
    if (!account) {
      return { success: false, error: "Hesap bulunamadı." };
    }

    account.name = data.name;

    const isCreditCard = account.type === 'credit_card' && !!account.credit_card_details;
    const previousValue = isCreditCard
      ? getCreditCardDebt({ balance: parseFloat(account.balance.toString()), credit_card_details: { current_debt: account.credit_card_details!.current_debt ? parseFloat(account.credit_card_details!.current_debt.toString()) : null } })
      : parseFloat(account.balance.toString());
    const nextValue = isCreditCard ? (data.credit_card_details?.current_debt ?? data.balance) : data.balance;
    const difference = Math.round(Math.abs(nextValue - previousValue) * 100) / 100;

    if (account.type === 'credit_card' && account.credit_card_details) {
      const debt = data.credit_card_details?.current_debt ?? data.balance;
      account.credit_card_details.current_debt = mongoose.Types.Decimal128.fromString(debt.toString());
      account.credit_card_details.total_limit = mongoose.Types.Decimal128.fromString((data.credit_card_details?.total_limit ?? parseFloat(account.credit_card_details.total_limit.toString())).toString());
      account.credit_card_details.statement_day = data.credit_card_details?.statement_day ?? account.credit_card_details.statement_day;
      account.credit_card_details.payment_due_day = data.credit_card_details?.payment_due_day ?? account.credit_card_details.payment_due_day;
      account.balance = mongoose.Types.Decimal128.fromString((-debt).toString());
    } else {
      account.balance = mongoose.Types.Decimal128.fromString(data.balance.toString());
    }

    await account.save();

    // The balance is already set directly above, so the transaction is only a record of the change.
    // The difference is measured against the saved value, so entries already added on this account are not counted twice.
    let recordedAmount = 0;
    if (data.recordDifference && difference > 0 && ['income', 'expense'].includes(data.recordDifference.type)) {
      recordedAmount = difference;
      const categoryId = data.recordDifference.category_id && mongoose.Types.ObjectId.isValid(data.recordDifference.category_id)
        ? new mongoose.Types.ObjectId(data.recordDifference.category_id)
        : null;
      const fallbackDescription = data.recordDifference.type === 'expense'
        ? `${account.name} harcaması`
        : `${account.name} geliri`;
      await Transaction.create({
        user_id: userId,
        type: data.recordDifference.type === 'expense' ? TransactionType.EXPENSE : TransactionType.INCOME,
        amount: mongoose.Types.Decimal128.fromString(difference.toString()),
        date: new Date(),
        description: data.recordDifference.description?.trim() || fallbackDescription,
        category_id: categoryId,
        account_id: account._id,
        source: TransactionSource.ACCOUNT_EDIT
      });
    }

    revalidatePath('/dashboard');
    console.log("Account update result: Success");
    
    return { success: true, recordedAmount, previousValue };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

export async function payCreditCardDebtAction(data: { creditCardId: string; amount: number; paymentAccountId?: string; isExternalPayment: boolean; date?: string }) {
  try {
    await connectDB();
    const userId = await getUserId();
    const amount = Number(data.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: 'Ödeme tutarı 0’dan büyük olmalıdır.' };
    }

    const creditCard = await Account.findOne({ _id: new mongoose.Types.ObjectId(data.creditCardId), user_id: userId, type: 'credit_card' });
    if (!creditCard?.credit_card_details) {
      return { success: false, error: 'Kredi kartı bulunamadı.' };
    }

    const currentDebt = parseFloat(creditCard.credit_card_details.current_debt.toString());
    if (amount > currentDebt) {
      return { success: false, error: 'Ödeme tutarı güncel borçtan büyük olamaz.' };
    }

    let paymentAccount: typeof creditCard | null = null;
    if (!data.isExternalPayment) {
      if (!data.paymentAccountId) {
        return { success: false, error: 'Ödeme yapılacak hesap seçilmelidir.' };
      }
      paymentAccount = await Account.findOne({
        _id: new mongoose.Types.ObjectId(data.paymentAccountId),
        user_id: userId,
        type: { $in: ['cash', 'bank_account', 'debit_card'] }
      });
      if (!paymentAccount) {
        return { success: false, error: 'Geçerli bir nakit veya banka hesabı seçin.' };
      }
      const paymentBalance = parseFloat(paymentAccount.balance.toString());
      paymentAccount.balance = mongoose.Types.Decimal128.fromString((paymentBalance - amount).toString());
      await paymentAccount.save();
    }

    const newDebt = currentDebt - amount;
    creditCard.credit_card_details.current_debt = mongoose.Types.Decimal128.fromString(newDebt.toString());
    const cardBalance = parseFloat(creditCard.balance.toString());
    creditCard.balance = mongoose.Types.Decimal128.fromString((cardBalance + amount).toString());
    await creditCard.save();

    await Transaction.create({
      user_id: userId,
      type: TransactionType.CREDIT_CARD_PAYMENT,
      amount: mongoose.Types.Decimal128.fromString(amount.toString()),
      date: data.date ? new Date(data.date) : new Date(),
      description: `${creditCard.name} kart borcu ödemesi`,
      account_id: data.isExternalPayment ? creditCard._id : paymentAccount!._id,
      related_account_id: data.isExternalPayment ? null : creditCard._id,
      is_external_payment: data.isExternalPayment,
      show_as_expense: false,
      affects_account_balance: !data.isExternalPayment,
      source: TransactionSource.MANUAL
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

export async function transferAccountsAction(data: {
  sourceAccountId: string;
  targetAccountId: string;
  amount: number;
  date: string;
  description?: string;
}) {
  try {
    await connectDB();
    const userId = await getUserId();
    const amount = Number(data.amount);
    const [source, target] = await Promise.all([
      Account.findOne({ _id: new mongoose.Types.ObjectId(data.sourceAccountId), user_id: userId, is_active: true }),
      Account.findOne({ _id: new mongoose.Types.ObjectId(data.targetAccountId), user_id: userId, is_active: true })
    ]);

    if (!source || !target) return { success: false, error: 'Kaynak veya hedef hesap bulunamadı.' };
    const validation = validateTransfer(
      { id: source._id.toString(), type: source.type, balance: parseFloat(source.balance.toString()) },
      { id: target._id.toString(), type: target.type, balance: parseFloat(target.balance.toString()) },
      amount
    );
    if (!validation.valid) return { success: false, error: validation.error };

    source.balance = mongoose.Types.Decimal128.fromString((parseFloat(source.balance.toString()) - amount).toString());
    target.balance = mongoose.Types.Decimal128.fromString((parseFloat(target.balance.toString()) + amount).toString());
    await Promise.all([source.save(), target.save()]);
    await Transaction.create({
      user_id: userId,
      type: TransactionType.TRANSFER,
      amount: mongoose.Types.Decimal128.fromString(amount.toString()),
      date: new Date(data.date),
      description: data.description?.trim() || `${source.name} → ${target.name} transferi`,
      category_id: null,
      account_id: source._id,
      related_account_id: target._id,
      show_as_expense: false,
      affects_account_balance: true,
      source: TransactionSource.MANUAL
    });

    revalidatePath('/dashboard');
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
    
    const account = await Account.findOne({ _id: new mongoose.Types.ObjectId(data.account_id) as any, user_id: userId as any });
    if (!account) return { success: false, error: 'Hesap bulunamadı.' };

    const effect = applyTransactionEffect({
      type: account.type,
      balance: parseFloat(account.balance.toString()),
      credit_card_details: account.credit_card_details ? { current_debt: getCreditCardDebt({ balance: parseFloat(account.balance.toString()), credit_card_details: { current_debt: account.credit_card_details.current_debt ? parseFloat(account.credit_card_details.current_debt.toString()) : null } }) } : undefined
    }, data.type as 'income' | 'expense', data.amount);

    const now = new Date();
    let txnDate: Date;
    if (data.date) {
      const parsed = new Date(data.date);
      const isToday = parsed.toDateString() === now.toDateString() || data.date === now.toISOString().split('T')[0];
      txnDate = isToday ? now : parsed;
    } else {
      txnDate = now;
    }

    await Transaction.create({
      user_id: userId,
      type: data.type as any,
      amount: mongoose.Types.Decimal128.fromString(data.amount.toString()),
      date: txnDate,
      description: data.description,
      category_id: new mongoose.Types.ObjectId(data.category_id),
      account_id: new mongoose.Types.ObjectId(data.account_id),
      source: (data.source as any) || "manual"
    });
    
    account.balance = mongoose.Types.Decimal128.fromString(effect.balance.toString());
    if (account.credit_card_details && effect.currentDebt !== undefined) {
      account.credit_card_details.current_debt = mongoose.Types.Decimal128.fromString(effect.currentDebt.toString());
    }
    await account.save();

    revalidatePath('/dashboard');
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

    // Revert account balance and, for transfers, restore the target account.
    const account = await Account.findOne({ _id: txn.account_id, user_id: userId });
    if (txn.type === TransactionType.DEBT_PAYMENT && txn.flow) {
      // Undo the money movement and, for a repayment, give the amount back to the debt.
      const amount = parseFloat(txn.amount.toString());
      if (account) {
        account.balance = mongoose.Types.Decimal128.fromString((parseFloat(account.balance.toString()) - signedAmount(txn.flow, amount)).toString());
        await account.save();
      }
      if (txn.debt_id) {
        const debt = await Debt.findOne({ _id: txn.debt_id, user_id: userId });
        const payment = debt?.payments.find((p: { transaction_id?: mongoose.Types.ObjectId | null }) => p.transaction_id?.toString() === txn._id.toString());
        if (debt && payment) {
          debt.payments = debt.payments.filter((p: { transaction_id?: mongoose.Types.ObjectId | null }) => p.transaction_id?.toString() !== txn._id.toString());
          const remaining = Math.round((parseFloat(debt.remaining_amount.toString()) + amount) * 100) / 100;
          debt.remaining_amount = mongoose.Types.Decimal128.fromString(remaining.toString());
          debt.status = debt.payments.length > 0 ? DebtStatus.PARTIALLY_PAID : DebtStatus.OPEN;
          await debt.save();
        }
      }
      await Transaction.deleteOne({ _id: txn._id });
      revalidatePath('/dashboard');
      return { success: true };
    }
    if (account) {
      if (txn.type === TransactionType.TRANSFER && txn.related_account_id) {
        account.balance = mongoose.Types.Decimal128.fromString((parseFloat(account.balance.toString()) + parseFloat(txn.amount.toString())).toString());
        const target = await Account.findOne({ _id: txn.related_account_id, user_id: userId });
        if (target) {
          target.balance = mongoose.Types.Decimal128.fromString((parseFloat(target.balance.toString()) - parseFloat(txn.amount.toString())).toString());
          await target.save();
        }
      } else {
        const effect = applyTransactionEffect({
          type: account.type,
          balance: parseFloat(account.balance.toString()),
          credit_card_details: account.credit_card_details ? { current_debt: getCreditCardDebt({ balance: parseFloat(account.balance.toString()), credit_card_details: { current_debt: account.credit_card_details.current_debt ? parseFloat(account.credit_card_details.current_debt.toString()) : null } }) } : undefined
        }, txn.type as 'income' | 'expense', -parseFloat(txn.amount.toString()));
        account.balance = mongoose.Types.Decimal128.fromString(effect.balance.toString());
        if (account.credit_card_details && effect.currentDebt !== undefined) {
          account.credit_card_details.current_debt = mongoose.Types.Decimal128.fromString(effect.currentDebt.toString());
        }
      }
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
    if (txn.type === TransactionType.TRANSFER || data.type === TransactionType.TRANSFER) {
      return { success: false, error: 'Transfer işlemleri bu ekrandan düzenlenemez.' };
    }
    if (txn.type === TransactionType.DEBT_PAYMENT || txn.type === TransactionType.CREDIT_CARD_PAYMENT) {
      return { success: false, error: 'Bu işlem borç/kart ekranından yönetilir; burada yalnızca silinebilir.' };
    }

    const oldAmount = parseFloat(txn.amount.toString());
    const oldType = txn.type;
    const oldAccountId = txn.account_id.toString();

    // Revert old transaction effect on old account
    const oldAccount = await Account.findOne({ _id: txn.account_id, user_id: userId });
    if (oldAccount) {
      const effect = applyTransactionEffect({
        type: oldAccount.type,
        balance: parseFloat(oldAccount.balance.toString()),
        credit_card_details: oldAccount.credit_card_details ? { current_debt: getCreditCardDebt({ balance: parseFloat(oldAccount.balance.toString()), credit_card_details: { current_debt: oldAccount.credit_card_details.current_debt ? parseFloat(oldAccount.credit_card_details.current_debt.toString()) : null } }) } : undefined
      }, oldType as 'income' | 'expense', -oldAmount);
      oldAccount.balance = mongoose.Types.Decimal128.fromString(effect.balance.toString());
      if (oldAccount.credit_card_details && effect.currentDebt !== undefined) {
        oldAccount.credit_card_details.current_debt = mongoose.Types.Decimal128.fromString(effect.currentDebt.toString());
      }
      await oldAccount.save();
    }

    // Apply new transaction effect on new account
    const newAccount = await Account.findOne({ _id: new mongoose.Types.ObjectId(data.account_id) as any, user_id: userId as any });
    if (newAccount) {
      const effect = applyTransactionEffect({
        type: newAccount.type,
        balance: parseFloat(newAccount.balance.toString()),
        credit_card_details: newAccount.credit_card_details ? { current_debt: getCreditCardDebt({ balance: parseFloat(newAccount.balance.toString()), credit_card_details: { current_debt: newAccount.credit_card_details.current_debt ? parseFloat(newAccount.credit_card_details.current_debt.toString()) : null } }) } : undefined
      }, data.type as 'income' | 'expense', data.amount);
      newAccount.balance = mongoose.Types.Decimal128.fromString(effect.balance.toString());
      if (newAccount.credit_card_details && effect.currentDebt !== undefined) {
        newAccount.credit_card_details.current_debt = mongoose.Types.Decimal128.fromString(effect.currentDebt.toString());
      }
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

    revalidatePath('/dashboard');
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

    const user = await User.findById(userId).select('settings').lean();
    const isAbroadOrEn = Boolean(user?.settings?.is_abroad || user?.settings?.language === 'en');

    // Ensure the user has categories. If 0, seed them specifically for this user.
    const userCategoryCount = await Category.countDocuments({ user_id: userId });
    if (userCategoryCount === 0) {
      const defaultCats = isAbroadOrEn ? [
        { user_id: userId, name: 'Groceries', type: 'expense', icon: 'cart', color: '#ef4444', is_default: false },
        { user_id: userId, name: 'Transportation', type: 'expense', icon: 'car', color: '#f59e0b', is_default: false },
        { user_id: userId, name: 'Entertainment', type: 'expense', icon: 'film', color: '#8b5cf6', is_default: false },
        { user_id: userId, name: 'Dining Out', type: 'expense', icon: 'coffee', color: '#f43f5e', is_default: false },
        { user_id: userId, name: 'Bills & Utilities', type: 'expense', icon: 'zap', color: '#0ea5e9', is_default: false },
        { user_id: userId, name: 'Rent & Housing', type: 'expense', icon: 'home', color: '#10b981', is_default: false },
        { user_id: userId, name: 'Healthcare', type: 'expense', icon: 'heart', color: '#ec4899', is_default: false },
        { user_id: userId, name: 'Salary', type: 'income', icon: 'briefcase', color: '#22c55e', is_default: false },
        { user_id: userId, name: 'Investments', type: 'income', icon: 'trending', color: '#3b82f6', is_default: false },
        { user_id: userId, name: 'Other Income', type: 'income', icon: 'gift', color: '#14b8a6', is_default: false },
      ] : [
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
      name: isAbroadOrEn ? localizeCategoryName(cat.name, true) : cat.name,
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
const DEBT_ACCOUNT_TYPES = ['cash', 'bank_account', 'debit_card'];

/** Moves money on an account for a debt event and records it as a debt transaction (not income/expense). */
async function recordDebtMoney(userId: string, accountId: string, debtId: mongoose.Types.ObjectId, flow: 'in' | 'out', amount: number, date: Date, description: string) {
  const account = await Account.findOne({ _id: new mongoose.Types.ObjectId(accountId), user_id: userId, type: { $in: DEBT_ACCOUNT_TYPES } });
  if (!account) throw new Error('Geçerli bir nakit veya banka hesabı seçin.');
  const balance = parseFloat(account.balance.toString());
  account.balance = mongoose.Types.Decimal128.fromString((balance + signedAmount(flow, amount)).toString());
  await account.save();
  return Transaction.create({
    user_id: userId,
    type: TransactionType.DEBT_PAYMENT,
    amount: mongoose.Types.Decimal128.fromString(amount.toString()),
    date,
    description,
    account_id: account._id,
    debt_id: debtId,
    flow,
    show_as_expense: false,
    affects_account_balance: true,
    source: TransactionSource.MANUAL
  });
}

export async function addDebtAction(data: { person_name: string; direction: string; amount: number; date: string; due_date?: string; account_id?: string }) {
  try {
    await connectDB();
    const userId = await getUserId();
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) return { success: false, error: 'Tutar 0’dan büyük olmalıdır.' };
    const direction = data.direction === DebtDirection.TAKEN ? DebtDirection.TAKEN : DebtDirection.GIVEN;

    const debt = await Debt.create({
      user_id: userId,
      person_name: data.person_name,
      direction,
      original_amount: mongoose.Types.Decimal128.fromString(amount.toString()),
      remaining_amount: mongoose.Types.Decimal128.fromString(amount.toString()),
      date: new Date(data.date),
      due_date: data.due_date ? new Date(data.due_date) : null,
      status: DebtStatus.OPEN
    });

    // Lending takes the money out of the chosen account; borrowing puts it in.
    if (data.account_id) {
      try {
        const flow = debtFlow(direction, 'open');
        await recordDebtMoney(userId, data.account_id, debt._id, flow, amount, new Date(),
          direction === DebtDirection.GIVEN ? `${data.person_name} kişisine borç verildi` : `${data.person_name} kişisinden borç alındı`);
      } catch (moneyError) {
        await Debt.deleteOne({ _id: debt._id });
        throw moneyError;
      }
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

/** Records a (partial) payment on a debt and moves the money on the chosen account. */
export async function payDebtAction(data: { debt_id: string; amount: number; account_id?: string; date?: string; note?: string }) {
  try {
    await connectDB();
    const userId = await getUserId();
    const debt = await Debt.findOne({ _id: new mongoose.Types.ObjectId(data.debt_id), user_id: userId });
    if (!debt) return { success: false, error: 'Borç bulunamadı.' };

    const remaining = parseFloat(debt.remaining_amount.toString());
    const amount = Math.round(Number(data.amount) * 100) / 100;
    const next = applyDebtPayment(remaining, amount);
    const date = data.date ? new Date(data.date) : new Date();

    let transactionId: mongoose.Types.ObjectId | null = null;
    if (data.account_id) {
      const flow = debtFlow(debt.direction as 'given' | 'taken', 'payment');
      const txn = await recordDebtMoney(userId, data.account_id, debt._id, flow, amount, date,
        debt.direction === DebtDirection.GIVEN ? `${debt.person_name} borç ödemesi yaptı` : `${debt.person_name} kişisine borç ödendi`);
      transactionId = txn._id;
    }

    debt.payments.push({
      date,
      amount: mongoose.Types.Decimal128.fromString(amount.toString()),
      transaction_id: transactionId,
      note: data.note?.trim() || null
    });
    debt.remaining_amount = mongoose.Types.Decimal128.fromString(next.remaining.toString());
    debt.status = next.status === 'closed' ? DebtStatus.CLOSED : DebtStatus.PARTIALLY_PAID;
    await debt.save();

    revalidatePath('/dashboard');
    return { success: true, remaining: next.remaining, closed: next.status === 'closed' };
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
    const debt = await Debt.findOne({ _id: new mongoose.Types.ObjectId(id), user_id: userIdStr });
    if (!debt) return { success: false, error: "Borç bulunamadı" };
    // Payments already made still count against the new amount.
    const paid = (debt.payments || []).reduce((sum: number, p: { amount: mongoose.Types.Decimal128 }) => sum + parseFloat(p.amount.toString()), 0);
    const remaining = remainingAfterEdit(Number(data.amount), paid);
    debt.person_name = data.person_name;
    debt.original_amount = mongoose.Types.Decimal128.fromString(data.amount.toString());
    debt.remaining_amount = mongoose.Types.Decimal128.fromString(remaining.toString());
    debt.status = remaining === 0 ? DebtStatus.CLOSED : paid > 0 ? DebtStatus.PARTIALLY_PAID : DebtStatus.OPEN;
    if (data.due_date) debt.due_date = new Date(data.due_date);
    await debt.save();
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
