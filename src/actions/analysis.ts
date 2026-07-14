"use server";

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Transaction } from "@/models/Transaction";
import { DailyLog } from "@/models/DailyLog";
import { Category } from "@/models/Category";

// Helper to check session
async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

/**
 * Helper to get date boundaries based on time filter and offset.
 * offset: 0 means current (this week/month/year). -1 means previous, 1 means next.
 */
function getDateRange(filter: 'week' | 'month' | 'year', offset: number) {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  if (filter === 'year') {
    start.setFullYear(now.getFullYear() + offset, 0, 1);
    start.setHours(0, 0, 0, 0);
    
    end.setFullYear(now.getFullYear() + offset, 11, 31);
    end.setHours(23, 59, 59, 999);
  } else if (filter === 'month') {
    start.setMonth(now.getMonth() + offset, 1);
    start.setHours(0, 0, 0, 0);
    
    end.setMonth(now.getMonth() + offset + 1, 0);
    end.setHours(23, 59, 59, 999);
  } else if (filter === 'week') {
    const day = now.getDay() || 7; 
    start.setDate(now.getDate() - day + 1 + (offset * 7));
    start.setHours(0,0,0,0);
    
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

export async function getFinanceAnalysisAction(filter: 'week' | 'month' | 'year', offset: number) {
  try {
    await connectDB();
    const userId = await getUserId();
    
    const { start, end } = getDateRange(filter, offset);

    // Fetch transactions
    const txnsRaw = await Transaction.find({
      user_id: userId,
      date: { $gte: start, $lte: end },
      is_deleted: false
    }).populate('category_id').lean();

    const barDataMap = new Map<string, { name: string; income: number; expense: number }>();
    const pieDataMap = new Map<string, { name: string; value: number; color: string }>();
    const lineDataMap = new Map<string, { day: string; spent: number }>();

    let totalIncome = 0;
    let totalExpense = 0;

    // Helper formats
    const formatLabel = (date: Date) => {
      if (filter === 'year') {
        return date.toLocaleDateString('tr-TR', { month: 'short' });
      } else if (filter === 'month') {
        const weekNum = Math.ceil(date.getDate() / 7);
        return `Hafta ${weekNum}`;
      } else {
        return date.toLocaleDateString('tr-TR', { weekday: 'short' });
      }
    };

    const formatDay = (date: Date) => {
      if (filter === 'year') return date.toLocaleDateString('tr-TR', { month: 'short' });
      return String(date.getDate()).padStart(2, '0');
    };

    txnsRaw.forEach((t: any) => {
      const amount = parseFloat(t.amount.toString());
      const date = new Date(t.date);
      const label = formatLabel(date);
      const dayLabel = formatDay(date);

      // --- Bar Data (Income vs Expense) ---
      if (!barDataMap.has(label)) {
        barDataMap.set(label, { name: label, income: 0, expense: 0 });
      }
      const bData = barDataMap.get(label)!;

      if (t.type === 'income') {
        bData.income += amount;
        totalIncome += amount;
      } else {
        bData.expense += amount;
        totalExpense += amount;
        
        // --- Line Data (Daily/Monthly Trend) ---
        if (!lineDataMap.has(dayLabel)) {
          lineDataMap.set(dayLabel, { day: dayLabel, spent: 0 });
        }
        lineDataMap.get(dayLabel)!.spent += amount;

        // --- Pie Data (Expense Categories) ---
        const catName = t.category_id?.name || 'Diğer';
        const catColor = t.category_id?.color || '#9ca3af';
        if (!pieDataMap.has(catName)) {
          pieDataMap.set(catName, { name: catName, value: 0, color: catColor });
        }
        pieDataMap.get(catName)!.value += amount;
      }
    });

    return {
      success: true,
      data: {
        totalIncome,
        totalExpense,
        barData: Array.from(barDataMap.values()),
        pieData: Array.from(pieDataMap.values()),
        lineData: Array.from(lineDataMap.values()).sort((a, b) => a.day.localeCompare(b.day))
      }
    };

  } catch (e: unknown) {
    const err = e as Error;
    console.error(err);
    return { success: false, error: err.message };
  }
}

export async function getHealthAnalysisAction(filter: 'week' | 'month', offset: number) {
  try {
    await connectDB();
    const userId = await getUserId();
    
    const { start, end } = getDateRange(filter, offset);

    const logs = await DailyLog.find({
      user_id: userId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 }).lean();

    const calorieData: any[] = [];
    const sleepData: any[] = [];
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;

    const formatDay = (date: Date) => {
      if (filter === 'month') return String(date.getDate()).padStart(2, '0');
      return date.toLocaleDateString('tr-TR', { weekday: 'short' });
    };

    logs.forEach((log: any) => {
      const d = new Date(log.date);
      const dayLabel = formatDay(d);
      
      const consumed = log.totals.calories_consumed || 0;
      const burned = (log.totals.calories_burned_exercise || 0) + (log.totals.calories_burned_sleep || 0);
      
      calorieData.push({ day: dayLabel, consumed, burned });
      
      const sleepHours = log.sleep?.duration_minutes ? +(log.sleep.duration_minutes / 60).toFixed(1) : 0;
      sleepData.push({ day: dayLabel, sleep: sleepHours });

      totalCarbs += (log.totals.carbs_g || 0);
      totalProtein += (log.totals.protein_g || 0);
      totalFat += (log.totals.fat_g || 0);
    });

    // Calculate Macro Percentages
    const totalMacros = totalCarbs + totalProtein + totalFat;
    const macroData = totalMacros > 0 ? [
      { name: 'Karbonhidrat', value: Math.round((totalCarbs / totalMacros) * 100), color: '#c0c1ff' },
      { name: 'Protein', value: Math.round((totalProtein / totalMacros) * 100), color: '#4ade80' },
      { name: 'Yağ', value: Math.round((totalFat / totalMacros) * 100), color: '#fb923c' },
    ] : [];

    return {
      success: true,
      data: {
        calorieData,
        sleepData,
        macroData
      }
    };

  } catch (e: unknown) {
    const err = e as Error;
    console.error(err);
    return { success: false, error: err.message };
  }
}
