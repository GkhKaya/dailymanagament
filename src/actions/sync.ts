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
 * 
 * NOTE: We intentionally do NOT use mongoose sessions/transactions here
 * because MongoDB transactions require a Replica Set. Since standalone
 * MongoDB deployments (e.g. Coolify single-node) do not support them,
 * we do atomic operations individually. In the rare case of a crash
 * mid-way, the subscription will be reprocessed on next load — acceptable
 * for this use case.
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
      try {
        const amountNum = parseFloat(sub.amount.toString());

        // 1. Create Transaction (no session — standalone MongoDB compatible)
        await Transaction.create({
          user_id: userId,
          type: TransactionType.EXPENSE,
          amount: sub.amount,
          date: sub.next_run_date,
          description: `Abonelik: ${sub.name}`,
          category_id: sub.category_id,
          account_id: sub.account_id,
          source: TransactionSource.SUBSCRIPTION,
        });

        // 2. Deduct from Account balance using $inc for atomicity
        await Account.findByIdAndUpdate(
          sub.account_id,
          { $inc: { balance: -amountNum } }
        );

        // 3. Calculate next run date
        const nextDate = new Date(sub.next_run_date);
        if (sub.frequency === SubscriptionFrequency.MONTHLY) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }

        // Fast forward if overdue by multiple cycles
        while (nextDate <= now) {
          if (sub.frequency === SubscriptionFrequency.MONTHLY) {
            nextDate.setMonth(nextDate.getMonth() + 1);
          } else {
            break; // Prevent infinite loop for unsupported frequencies
          }
        }

        sub.next_run_date = nextDate;
        await sub.save();

        processedCount++;
      } catch (err) {
        console.error(`Failed to process subscription ${sub._id}:`, err);
        // Continue processing remaining subscriptions
      }
    }

    return { success: true, processed: processedCount };
  } catch (e: unknown) {
    const error = e as Error;
    console.error("Sync Subscriptions Error:", error);
    return { success: false, error: error.message };
  }
}
