import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Account } from "@/models/Account";
import { Installment } from "@/models/Installment";
import { Transaction } from "@/models/Transaction";
import { TransactionSource, TransactionType } from "@/models/Enums";
import { applyTransactionEffect, getCreditCardDebt } from "@/lib/finance-rules";
import { dueCharges, nextChargeDate } from "@/lib/installment-rules";

// Server-only (not a server action): callers pass the signed-in user's id.
/** Charges every due installment for the user: one expense per installment on its account. */
export async function syncInstallments(userId: string) {
  try {
    await connectDB();
    const now = new Date();
    const plans = await Installment.find({ user_id: userId, is_active: true, next_run_date: { $lte: now } });
    let processed = 0;

    for (const plan of plans) {
      const account = await Account.findOne({ _id: plan.account_id, user_id: userId });
      if (!account) {
        plan.is_active = false;
        await plan.save();
        continue;
      }
      const charges = dueCharges(
        { first_charge_date: plan.first_charge_date, charge_day: plan.charge_day, paid_count: plan.paid_count, amounts: plan.amounts },
        now,
      );

      for (const charge of charges) {
        // Claim this installment first so a parallel sync cannot charge it twice.
        const claimed = await Installment.updateOne(
          { _id: plan._id, paid_count: charge.index },
          { $set: { paid_count: charge.index + 1 } },
        );
        if (claimed.modifiedCount !== 1) break;

        const effect = applyTransactionEffect({
          type: account.type,
          balance: parseFloat(account.balance.toString()),
          credit_card_details: account.credit_card_details
            ? { current_debt: getCreditCardDebt({ balance: parseFloat(account.balance.toString()), credit_card_details: { current_debt: account.credit_card_details.current_debt ? parseFloat(account.credit_card_details.current_debt.toString()) : null } }) }
            : undefined,
        }, "expense", charge.amount);

        await Transaction.create({
          user_id: userId,
          type: TransactionType.EXPENSE,
          amount: mongoose.Types.Decimal128.fromString(charge.amount.toString()),
          date: charge.date,
          description: `Taksit ${charge.index + 1}/${plan.installment_count}: ${plan.name}`,
          category_id: plan.category_id || null,
          account_id: account._id,
          source: TransactionSource.INSTALLMENT,
        });

        account.balance = mongoose.Types.Decimal128.fromString(effect.balance.toString());
        if (account.credit_card_details && effect.currentDebt !== undefined) {
          account.credit_card_details.current_debt = mongoose.Types.Decimal128.fromString(effect.currentDebt.toString());
        }
        await account.save();
        plan.paid_count = charge.index + 1;
        processed++;
      }

      const next = nextChargeDate({ first_charge_date: plan.first_charge_date, charge_day: plan.charge_day, paid_count: plan.paid_count, amounts: plan.amounts });
      await Installment.updateOne({ _id: plan._id }, { $set: { next_run_date: next, is_active: next !== null } });
    }

    return { success: true, processed };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("Sync Installments Error:", err);
    return { success: false, error: err.message };
  }
}

