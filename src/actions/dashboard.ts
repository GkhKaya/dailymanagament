"use server";

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DailyLog } from "@/models/DailyLog";
import { Account } from "@/models/Account";
import { Transaction } from "@/models/Transaction";
import { Category } from "@/models/Category";
import { Subscription } from "@/models/Subscription";
import { Debt } from "@/models/Debt";
import { User } from "@/models/User";
import { HealthDataDTO, FinanceDataDTO } from "@/models/DashboardTypes";

async function getSession() {
  return await auth.api.getSession({
    headers: await headers()
  });
}

export async function getHealthDataAction(dateString: string): Promise<{ success: boolean; data?: HealthDataDTO; error?: string }> {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    
    // Parse target date and set boundaries
    const targetDate = new Date(dateString);
    targetDate.setUTCHours(0, 0, 0, 0);

    // Get user goals
    const user = await User.findById(userId).lean();
    const targetCalories = user?.settings?.daily_calorie_goal || 2400;

    // Get DailyLog for specific date
    const dailyLog = await DailyLog.findOne({
      user_id: userId,
      date: targetDate
    }).lean();

    if (!dailyLog) {
      // Return empty DTO if no data exists for this day
      return {
        success: true,
        data: {
          date: dateString,
          targetCalories,
          consumedCalories: 0,
          burnedCalories: 0,
          sleepMinutes: 0,
          exerciseMinutes: 0,
          meals: []
        }
      };
    }

    // Transform Mongoose document to DTO
    const meals = [];
    let idCounter = 1;

    for (const [mealType, foods] of Object.entries(dailyLog.meals)) {
      if (Array.isArray(foods) && foods.length > 0) {
        let mealCalories = 0;
        const mappedFoods = foods.map((f: any) => {
          mealCalories += f.nutrition_snapshot.calories;
          return {
            name: f.food_name,
            amount: f.serving_description,
            calories: f.nutrition_snapshot.calories
          };
        });

        meals.push({
          id: (idCounter++).toString(),
          type: mealType as any,
          foodName: mappedFoods.map(f => f.name).join(" & "),
          calories: mealCalories,
          foods: mappedFoods
        });
      }
    }

    const data: HealthDataDTO = {
      date: dailyLog.date.toISOString(),
      targetCalories,
      consumedCalories: dailyLog.totals.calories_consumed,
      burnedCalories: dailyLog.totals.calories_burned_exercise,
      sleepMinutes: dailyLog.sleep?.duration_minutes || 0,
      exerciseMinutes: dailyLog.exercises?.reduce((acc: number, ex: any) => acc + ex.duration_minutes, 0) || 0,
      protein: Math.round(dailyLog.totals.protein_g || 0),
      carbs: Math.round(dailyLog.totals.carbs_g || 0),
      fat: Math.round(dailyLog.totals.fat_g || 0),
      meals
    };

    return { success: true, data };
  } catch (err: any) {
    console.error("getHealthDataAction error:", err);
    return { success: false, error: err.message };
  }
}

export async function getFinanceDataAction(): Promise<{ success: boolean; data?: FinanceDataDTO; error?: string }> {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Fetch accounts
    const accountsRaw = await Account.find({ user_id: userId }).lean();
    let totalBalance = 0;
    const accounts = accountsRaw.map((acc: any) => {
      const bal = parseFloat(acc.balance.toString());
      if (acc.include_in_total_balance) {
        totalBalance += bal;
      }
      return {
        id: acc._id.toString(),
        name: acc.name,
        balance: bal,
        type: acc.type,
        include_in_total_balance: acc.include_in_total_balance
      };
    });

    // Fetch recent transactions (last 10)
    const txRaw = await Transaction.find({ user_id: userId })
      .sort({ date: -1 })
      .limit(10)
      .populate("category_id")
      .lean();

    const recentTransactions = txRaw.map((tx: any) => {
      // Date formatting for UI (e.g. "Bugün, 14:30")
      const txDate = new Date(tx.date);
      const isToday = new Date().setHours(0,0,0,0) === new Date(txDate).setHours(0,0,0,0);
      const timeString = txDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
      const dateStr = isToday ? `Bugün, ${timeString}` : `${txDate.getDate()} ${txDate.toLocaleString('tr-TR', {month:'short'})}, ${timeString}`;

      return {
        id: tx._id.toString(),
        title: tx.description,
        amount: parseFloat(tx.amount.toString()),
        date: dateStr,
        type: tx.type
      };
    });

    // Fetch categories
    const categoriesRaw = await Category.find({ $or: [{ user_id: userId }, { is_default: true }] }).lean();
    const categories = categoriesRaw.map((cat: any) => ({
      id: cat._id.toString(),
      name: cat.name,
      type: cat.type
    }));

    // Fetch subscriptions
    const subsRaw = await Subscription.find({ user_id: userId, is_active: true }).lean();
    const subscriptions = subsRaw.map((sub: any) => ({
      id: sub._id.toString(),
      name: sub.name,
      amount: parseFloat(sub.amount.toString()),
      nextBillingDate: new Date(sub.next_run_date).toISOString().split("T")[0]
    }));

    // Fetch open debts
    const debtsRaw = await Debt.find({ user_id: userId, status: { $ne: 'closed' } }).lean();
    const debts = debtsRaw.map((debt: any) => ({
      id: debt._id.toString(),
      personName: debt.person_name,
      direction: debt.direction,
      amount: parseFloat(debt.original_amount.toString()),
      remainingAmount: parseFloat(debt.remaining_amount.toString()),
      dueDate: debt.due_date ? new Date(debt.due_date).toISOString().split("T")[0] : undefined
    }));

    // Daily Spend (Transactions of today that are expenses)
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const todayExpenses = await Transaction.aggregate([
      { $match: { user_id: userId, type: "expense", date: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const dailySpend = todayExpenses.length > 0 ? parseFloat(todayExpenses[0].total.toString()) : 0;

    const data: FinanceDataDTO = {
      totalBalance,
      monthlyBudget: 12000, // Hardcoded or calculated
      dailySpend,
      accounts,
      recentTransactions,
      categories,
      subscriptions,
      debts
    };

    return { success: true, data };
  } catch (err: any) {
    console.error("getFinanceDataAction error:", err);
    return { success: false, error: err.message };
  }
}
