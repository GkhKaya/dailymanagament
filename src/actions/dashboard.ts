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
import { WeightLog } from "@/models/WeightLog";
import { HealthDataDTO, FinanceDataDTO } from "@/models/DashboardTypes";
import { syncSubscriptions } from "./sync";
import { calculateBMR, calculateAge } from "@/lib/calories";

async function getSession() {
  return await auth.api.getSession({
    headers: await headers()
  });
}

export async function getHealthDataAction(dateString: string): Promise<{ success: boolean; data?: HealthDataDTO; error?: string }> {
  try {
    const start = Date.now();
    console.log(`[getHealthDataAction] Starting for date: ${dateString}`);
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    console.log(`[getHealthDataAction] Session retrieved. Connecting to DB... (${Date.now() - start}ms)`);
    await connectDB();
    console.log(`[getHealthDataAction] DB Connected. Starting queries... (${Date.now() - start}ms)`);
    const userId = session.user.id; // User._id is String in schema — do NOT cast to ObjectId
    
    // Parse target date and set boundaries
    const targetDate = new Date(dateString);
    targetDate.setUTCHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(targetDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const targetDateEnd = new Date(targetDate);
    targetDateEnd.setUTCHours(23, 59, 59, 999);

    // Fetch user, dailyLog, and weightLogs in parallel
    const [user, dailyLog, weightLogs] = await Promise.all([
      User.findById(userId).lean(),
      DailyLog.findOne({ user_id: userId, date: targetDate }).lean(),
      WeightLog.find({
        user_id: session.user.id as any,
        date: { $gte: thirtyDaysAgo, $lte: targetDateEnd }
      }).sort({ date: 1 }).lean()
    ]);
    console.log(`[getHealthDataAction] DB queries finished. (${Date.now() - start}ms)`);

    // Calculate Dynamic Target Calories
    let targetCalories = user?.settings?.daily_calorie_goal || 2400;
    
    if (user?.current_weight_kg && user?.target_weight_kg && user?.target_weight_date) {
      const currentWeight = user.current_weight_kg;
      const targetWeight = user.target_weight_kg;
      const targetDateEnd = new Date(user.target_weight_date);
      targetDateEnd.setUTCHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      
      const daysRemaining = Math.max(1, Math.ceil((targetDateEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      
      let tdee = 2400;
      let bmr = 2000;
      if (user.profile?.height_cm && user.profile?.birth_date) {
        const age = calculateAge(user.profile.birth_date);
        bmr = calculateBMR(currentWeight, user.profile.height_cm, age, user.profile.gender);
        
        let activityMultiplier = 1.2;
        switch (user.profile?.activity_level) {
          case 'light': activityMultiplier = 1.375; break;
          case 'moderate': activityMultiplier = 1.55; break;
          case 'active': activityMultiplier = 1.725; break;
          case 'very_active': activityMultiplier = 1.9; break;
          default: activityMultiplier = 1.2; break; // sedentary
        }
        tdee = bmr * activityMultiplier;
      }
      
      const weightDiff = currentWeight - targetWeight; // positive if losing weight
      const totalCalorieDeficit = weightDiff * 7700; // 1 kg = ~7700 kcal
      let dailyDeficit = totalCalorieDeficit / daysRemaining;
      
      // Bilimsel limitler: Haftada en fazla vücut ağırlığının %1'i kadar kilo kaybı önerilir.
      if (dailyDeficit > 0) {
        const maxWeeklyLossKg = currentWeight * 0.01;
        const maxDailyDeficit = (maxWeeklyLossKg / 7) * 7700;
        dailyDeficit = Math.min(dailyDeficit, maxDailyDeficit);
      }
      
      const minSafeCalories = (user.profile?.gender === 'erkek' || user.profile?.gender === 'male') ? 1500 : 1200;
      targetCalories = Math.max(minSafeCalories, Math.round(tdee - dailyDeficit));
    }

    const seenTimes = new Set<number>();
    const weightHistory = (weightLogs || []).map(log => {
      let d = log.date ? new Date(log.date) : new Date();
      let timeMs = d.getTime();
      while (seenTimes.has(timeMs)) {
        timeMs += 1000; // add 1s offset if identical timestamp
      }
      seenTimes.add(timeMs);
      return {
        id: log._id.toString(),
        date: new Date(timeMs).toISOString(),
        weight: log.weight_kg,
        note: log.note || undefined
      };
    });

    if (!dailyLog) {
      // Return empty DTO if no data exists for this day
      return {
        success: true,
        data: {
          date: dateString,
          targetCalories,
          consumedCalories: 0,
          burnedCalories: 0,
          caloriesBurnedBmr: 0,
          bmrAdded: false,
          sleepMinutes: 0,
          sleepCalories: 0,
          exerciseMinutes: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          sugar: 0,
          meals: [],
          exercises: [],
          currentWeight: user?.current_weight_kg || 0,
          weightHistory
        }
      };
    }

    // Transform Mongoose document to DTO
    const meals = [];
    let idCounter = 1;

    for (const [mealType, foods] of Object.entries(dailyLog.meals)) {
      if (Array.isArray(foods) && foods.length > 0) {
        let mealCalories = 0;
        let mealProtein = 0;
        let mealCarbs = 0;
        let mealFat = 0;
        let mealSugar = 0;
        const mappedFoods = foods.map((f: any) => {
          mealCalories += f.nutrition_snapshot.calories;
          mealProtein += f.nutrition_snapshot.protein_g || 0;
          mealCarbs += f.nutrition_snapshot.carbs_g || 0;
          mealFat += f.nutrition_snapshot.fat_g || 0;
          mealSugar += f.nutrition_snapshot.sugar_g || 0;
          return {
            id: f.entry_id ? f.entry_id.toString() : new mongoose.Types.ObjectId().toString(),
            name: f.food_name,
            amount: f.serving_description,
            calories: f.nutrition_snapshot.calories,
            protein: f.nutrition_snapshot.protein_g || 0,
            carbs: f.nutrition_snapshot.carbs_g || 0,
            fat: f.nutrition_snapshot.fat_g || 0,
            sugar: f.nutrition_snapshot.sugar_g || 0,
            protein_g: f.nutrition_snapshot.protein_g || 0,
            carbs_g: f.nutrition_snapshot.carbs_g || 0,
            fat_g: f.nutrition_snapshot.fat_g || 0,
            sugar_g: f.nutrition_snapshot.sugar_g || 0
          };
        });

        meals.push({
          id: (idCounter++).toString(),
          type: mealType as any,
          foodName: mappedFoods.map(f => f.name).join(" & "),
          calories: mealCalories,
          protein: Math.round(mealProtein * 10) / 10,
          carbs: Math.round(mealCarbs * 10) / 10,
          fat: Math.round(mealFat * 10) / 10,
          sugar: Math.round(mealSugar * 10) / 10,
          foods: mappedFoods
        });
      }
    }
    let exerciseMinutes = 0;
    const mappedExercises = (dailyLog.exercises || []).map((ex: any) => ({
      id: ex.entry_id ? ex.entry_id.toString() : (ex._id ? ex._id.toString() : new mongoose.Types.ObjectId().toString()),
      name: ex.name,
      duration_minutes: ex.duration_minutes || 0,
      calories_burned: ex.calories_burned || 0,
      source: ex.source,
      step_count: ex.step_count
    }));

    if (dailyLog.exercises) {
      exerciseMinutes = dailyLog.exercises.reduce((acc: number, ex: any) => acc + (ex.duration_minutes || 0), 0);
    }

        const bmrCal = dailyLog.totals.calories_burned_bmr || 0;
        const sleepCal = dailyLog.totals.calories_burned_sleep || 0;
        // Bilimsel olarak: 24 saatlik BMR hesaplaması zaten uyku süresindeki metabolik tüketimi içerir.
        // Çifte sayımı (double counting) önlemek için BMR eklendiyse uyku kalorisini ana toplama ekleme.
        const netSleepToAddToTotal = bmrCal > 0 ? 0 : sleepCal;

        return {
      success: true,
      data: {
        date: dateString,
        targetCalories,
        consumedCalories: Math.round(dailyLog.totals.calories_consumed),
        burnedCalories: Math.round(dailyLog.totals.calories_burned_exercise + netSleepToAddToTotal + bmrCal),
        caloriesBurnedBmr: Math.round(bmrCal),
        bmrAdded: !!(dailyLog as any).bmr_added,
        sleepMinutes: dailyLog.sleep?.duration_minutes || 0,
        sleepCalories: dailyLog.totals.calories_burned_sleep || 0,
        exerciseMinutes,
        protein: Math.round(dailyLog.totals.protein_g || 0),
        carbs: Math.round(dailyLog.totals.carbs_g || 0),
        fat: Math.round(dailyLog.totals.fat_g || 0),
        sugar: Math.round(dailyLog.totals.sugar_g || 0),
        meals,
        exercises: mappedExercises,
        currentWeight: user?.current_weight_kg || 0,
        weightHistory
      }
    };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("getHealthDataAction error:", err);
    return { success: false, error: err.message };
  }
}

export async function getFinanceDataAction(): Promise<{ success: boolean; data?: FinanceDataDTO; error?: string }> {
  try {
    const start = Date.now();
    console.log(`[getFinanceDataAction] Starting...`);
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    console.log(`[getFinanceDataAction] Session retrieved. Connecting to DB... (${Date.now() - start}ms)`);
    await connectDB();
    console.log(`[getFinanceDataAction] DB Connected. Starting queries... (${Date.now() - start}ms)`);
    const userId = session.user.id; // User._id is String in schema — do NOT cast to ObjectId

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);

    // Fetch all finance data in parallel for maximum performance
    const [_, accountsRaw, txRaw, categoriesRaw, subsRaw, debtsRaw, monthlyStats] = await Promise.all([
      syncSubscriptions(session.user.id),
      Account.find({ user_id: userId }).lean(),
      Transaction.find({ user_id: userId })
        .sort({ date: -1 })
        .limit(50)
        .populate("category_id")
        .populate("account_id")
        .populate("related_account_id")
        .lean(),
      Category.find({ $or: [{ user_id: userId }, { is_default: true }] }).lean(),
      Subscription.find({ user_id: userId, is_active: true }).lean(),
      Debt.find({ user_id: userId, status: { $ne: 'closed' } }).lean(),
      Transaction.aggregate([
        { $match: { user_id: userId, date: { $gte: startOfMonth, $lte: endOfMonth }, type: { $in: ['income', 'expense'] }, is_deleted: { $ne: true } } },
        { $group: { _id: "$type", total: { $sum: "$amount" } } }
      ])
    ]);
    console.log(`[getFinanceDataAction] DB queries finished. (${Date.now() - start}ms)`);

    let totalBalance = 0;
    const accounts = (accountsRaw || []).map((acc: any) => {
      const bal = parseFloat(acc.balance.toString());
      if (acc.include_in_total_balance) {
        totalBalance += bal;
      }
      return {
        id: acc._id.toString(),
        name: acc.name,
        balance: bal,
        type: acc.type,
        include_in_total_balance: acc.include_in_total_balance,
        credit_card_details: acc.credit_card_details ? {
          total_limit: parseFloat(acc.credit_card_details.total_limit.toString()),
          current_debt: parseFloat(acc.credit_card_details.current_debt.toString()),
          statement_day: acc.credit_card_details.statement_day,
          payment_due_day: acc.credit_card_details.payment_due_day
        } : undefined
      };
    });

    const recentTransactions = (txRaw || []).map((tx: any) => {
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
        rawDate: txDate.toISOString(),
        type: tx.type,
        category: tx.category_id?.name,
        categoryId: tx.category_id?._id?.toString(),
        accountName: tx.account_id?.name,
        accountId: tx.account_id?._id?.toString(),
        relatedAccountName: tx.related_account_id?.name,
        relatedAccountId: tx.related_account_id?._id?.toString(),
        source: tx.source
      };
    });

    const categories = (categoriesRaw || []).map((cat: any) => ({
      id: cat._id.toString(),
      name: cat.name,
      type: cat.type,
      icon: cat.icon
    }));

    const subscriptions = (subsRaw || []).map((sub: any) => ({
      id: sub._id.toString(),
      name: sub.name,
      amount: parseFloat(sub.amount.toString()),
      nextBillingDate: new Date(sub.next_run_date).toISOString().split("T")[0]
    }));

    const debts = (debtsRaw || []).map((debt: any) => ({
      id: debt._id.toString(),
      personName: debt.person_name,
      direction: debt.direction,
      amount: parseFloat(debt.original_amount.toString()),
      remainingAmount: parseFloat(debt.remaining_amount.toString()),
      dueDate: debt.due_date ? new Date(debt.due_date).toISOString().split("T")[0] : ""
    }));

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    
    (monthlyStats || []).forEach((stat: any) => {
      if (stat._id === 'income') monthlyIncome = parseFloat(stat.total.toString());
      if (stat._id === 'expense') monthlyExpense = parseFloat(stat.total.toString());
    });

    const data: FinanceDataDTO = {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      accounts,
      recentTransactions,
      categories,
      subscriptions,
      debts
    };

    return { success: true, data };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("getFinanceDataAction error:", err);
    return { success: false, error: err.message };
  }
}
