"use server";

import { connectDB } from "@/lib/db";
import { Subscription } from "@/models/Subscription";
import { Transaction } from "@/models/Transaction";
import { Account } from "@/models/Account";
import { TransactionType, TransactionSource, SubscriptionFrequency } from "@/models/Enums";
import mongoose from "mongoose";

/**
 * Checks and processes due subscriptions for a given user.
 * This can be called safely whenever the user loads their dashboard.
 */
export async function syncSubscriptions(userId: string) {
  try {
    await connectDB();
    const now = new Date();

    // Find all active subscriptions whose next run date has passed
    const dueSubscriptions = await Subscription.find({
      user_id: userId,
      is_active: true,
      next_run_date: { $lte: now }
    });

    if (dueSubscriptions.length === 0) return { success: true, processed: 0 };

    let processedCount = 0;

    for (const sub of dueSubscriptions) {
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        const amountNum = parseFloat(sub.amount.toString());

        // 1. Create Transaction
        await Transaction.create([{
          user_id: userId,
          type: TransactionType.EXPENSE,
          amount: sub.amount,
          date: sub.next_run_date,
          description: `Abonelik: ${sub.name}`,
          category_id: sub.category_id,
          account_id: sub.account_id,
          is_external_payment: false,
          show_as_expense: true,
          affects_account_balance: true,
          source: TransactionSource.SUBSCRIPTION,
          subscription_id: sub._id,
          is_deleted: false
        }], { session });

        // 2. Deduct from Account
        await Account.findByIdAndUpdate(
          sub.account_id,
          { $inc: { balance: -amountNum } },
          { session }
        );

        // 3. Calculate next run date
        const nextDate = new Date(sub.next_run_date);
        if (sub.frequency === SubscriptionFrequency.MONTHLY) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }

        // Fast forward if overdue by multiple cycles
        while (nextDate <= now) {
          if (sub.frequency === SubscriptionFrequency.MONTHLY) nextDate.setMonth(nextDate.getMonth() + 1);
        }

        sub.next_run_date = nextDate;
        await sub.save({ session });

        await session.commitTransaction();
        processedCount++;
      } catch (err) {
        await session.abortTransaction();
        console.error(`Failed to process subscription ${sub._id}:`, err);
      } finally {
        session.endSession();
      }
    }

    return { success: true, processed: processedCount };
  } catch (e: unknown) {
    const error = e as Error;
    console.error("Sync Subscriptions Error:", error);
    return { success: false, error: error.message };
  }
}
