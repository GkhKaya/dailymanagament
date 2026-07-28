"use server";

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DailyLog } from "@/models/DailyLog";
import { User } from "@/models/User";

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export interface ExportFoodItem {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ExportDayData {
  date: string; // YYYY-MM-DD
  dateFormatted: string;
  meals: {
    breakfast: ExportFoodItem[];
    lunch: ExportFoodItem[];
    dinner: ExportFoodItem[];
    snack: ExportFoodItem[];
  };
  exercises: {
    name: string;
    duration_minutes: number;
    calories_burned: number;
  }[];
  sleep: {
    duration_minutes: number;
    calories_burned: number;
  };
  bmr: number;
  totals: {
    calories_consumed: number;
    calories_burned_exercise: number;
    calories_burned_sleep: number;
    calories_burned_bmr: number;
    total_burned: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
}

export interface ExportWeekSummary {
  weekName: string;
  startDate: string;
  endDate: string;
  totals: {
    calories_consumed: number;
    calories_burned: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  dailyAverages: {
    calories_consumed: number;
    calories_burned: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  days: {
    date: string;
    dayName: string;
    consumed: number;
    burned: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
}

export async function getExportDataAction(filter: 'daily' | 'weekly' | 'monthly', dateStr: string) {
  try {
    await connectDB();
    const userId = await getUserId();

    const user = await User.findById(userId).lean();
    const userName = user?.profile?.name || user?.name || "Kullanıcı";

    const baseDate = new Date(dateStr);
    baseDate.setUTCHours(0, 0, 0, 0);

    if (filter === 'daily') {
      const log = await DailyLog.findOne({
        user_id: userId,
        date: baseDate
      }).lean();

      const dayData = mapDailyLogToExportDay(log, baseDate);
      return {
        success: true,
        userName,
        type: 'daily' as const,
        dailyData: dayData
      };
    }

    if (filter === 'weekly') {
      // 7 days ending at or containing baseDate
      // Let's take 7 days starting from baseDate - 6 days up to baseDate (or Monday to Sunday)
      const dayOfWeek = baseDate.getUTCDay() || 7; // 1 (Mon) - 7 (Sun)
      const startDate = new Date(baseDate);
      startDate.setUTCDate(baseDate.getUTCDate() - dayOfWeek + 1);
      startDate.setUTCHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setUTCDate(startDate.getUTCDate() + 6);
      endDate.setUTCHours(23, 59, 59, 999);

      const logs = await DailyLog.find({
        user_id: userId,
        date: { $gte: startDate, $lte: endDate }
      }).lean();

      const logsMap = new Map<string, any>();
      logs.forEach((l: any) => {
        const dStr = new Date(l.date).toISOString().split('T')[0];
        logsMap.set(dStr, l);
      });

      const weeklyDays: ExportDayData[] = [];
      for (let i = 0; i < 7; i++) {
        const curDate = new Date(startDate);
        curDate.setUTCDate(startDate.getUTCDate() + i);
        const curDateStr = curDate.toISOString().split('T')[0];
        const log = logsMap.get(curDateStr);
        weeklyDays.push(mapDailyLogToExportDay(log, curDate));
      }

      return {
        success: true,
        userName,
        type: 'weekly' as const,
        startDateStr: startDate.toLocaleDateString('tr-TR'),
        endDateStr: endDate.toLocaleDateString('tr-TR'),
        weeklyDays
      };
    }

    if (filter === 'monthly') {
      // 4 weeks (28 days) ending at current month
      const startOfMonth = new Date(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), 1);
      startOfMonth.setUTCHours(0, 0, 0, 0);

      const endOfMonth = new Date(baseDate.getUTCFullYear(), baseDate.getUTCMonth() + 1, 0);
      endOfMonth.setUTCHours(23, 59, 59, 999);

      const logs = await DailyLog.find({
        user_id: userId,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      }).lean();

      const logsMap = new Map<string, any>();
      logs.forEach((l: any) => {
        const dStr = new Date(l.date).toISOString().split('T')[0];
        logsMap.set(dStr, l);
      });

      // Split month into 4 weeks (7 days each)
      const weeks: ExportWeekSummary[] = [];

      for (let w = 0; w < 4; w++) {
        const wStart = new Date(startOfMonth);
        wStart.setUTCDate(startOfMonth.getUTCDate() + (w * 7));

        const wEnd = new Date(wStart);
        wEnd.setUTCDate(wStart.getUTCDate() + 6);
        if (w === 3) {
          // 4th week goes until end of month
          wEnd.setTime(endOfMonth.getTime());
        }

        let totalConsumed = 0;
        let totalBurned = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let dayCount = 0;

        const weekDaysData = [];

        for (let d = new Date(wStart); d <= wEnd; d.setUTCDate(d.getUTCDate() + 1)) {
          const dStr = d.toISOString().split('T')[0];
          const log = logsMap.get(dStr);
          const dayName = d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });

          const consumed = log?.totals?.calories_consumed || 0;
          const exerciseBurned = log?.totals?.calories_burned_exercise || 0;
          const bmrBurned = log?.totals?.calories_burned_bmr || 0;
          const sleepBurned = bmrBurned > 0 ? 0 : (log?.totals?.calories_burned_sleep || 0);
          const burned = exerciseBurned + bmrBurned + sleepBurned;

          const protein = log?.totals?.protein_g || 0;
          const carbs = log?.totals?.carbs_g || 0;
          const fat = log?.totals?.fat_g || 0;

          totalConsumed += consumed;
          totalBurned += burned;
          totalProtein += protein;
          totalCarbs += carbs;
          totalFat += fat;
          dayCount++;

          weekDaysData.push({
            date: dStr,
            dayName,
            consumed: Math.round(consumed),
            burned: Math.round(burned),
            protein: Math.round(protein),
            carbs: Math.round(carbs),
            fat: Math.round(fat)
          });
        }

        const validDays = Math.max(1, dayCount);
        weeks.push({
          weekName: `${w + 1}. Hafta`,
          startDate: wStart.toLocaleDateString('tr-TR'),
          endDate: wEnd.toLocaleDateString('tr-TR'),
          totals: {
            calories_consumed: Math.round(totalConsumed),
            calories_burned: Math.round(totalBurned),
            protein_g: Math.round(totalProtein),
            carbs_g: Math.round(totalCarbs),
            fat_g: Math.round(totalFat)
          },
          dailyAverages: {
            calories_consumed: Math.round(totalConsumed / validDays),
            calories_burned: Math.round(totalBurned / validDays),
            protein_g: Math.round(totalProtein / validDays),
            carbs_g: Math.round(totalCarbs / validDays),
            fat_g: Math.round(totalFat / validDays)
          },
          days: weekDaysData
        });
      }

      return {
        success: true,
        userName,
        type: 'monthly' as const,
        monthName: startOfMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
        weeks
      };
    }

    return { success: false, error: "Geçersiz filtre" };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Export Error:", err);
    return { success: false, error: err.message || "Veri alınırken hata oluştu" };
  }
}

function mapDailyLogToExportDay(log: any, dateObj: Date): ExportDayData {
  const dateStr = dateObj.toISOString().split('T')[0];
  const dateFormatted = dateObj.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const mapFoods = (list: any[]): ExportFoodItem[] => {
    if (!Array.isArray(list)) return [];
    return list.map(f => ({
      name: f.food_name || '',
      amount: f.serving_description || `${f.quantity} ${f.unit_type || 'g'}`,
      calories: Math.round(f.nutrition_snapshot?.calories || 0),
      protein: Math.round(f.nutrition_snapshot?.protein_g || 0),
      carbs: Math.round(f.nutrition_snapshot?.carbs_g || 0),
      fat: Math.round(f.nutrition_snapshot?.fat_g || 0),
    }));
  };

  const meals = {
    breakfast: mapFoods(log?.meals?.breakfast),
    lunch: mapFoods(log?.meals?.lunch),
    dinner: mapFoods(log?.meals?.dinner),
    snack: mapFoods(log?.meals?.snack),
  };

  const exercises = Array.isArray(log?.exercises) ? log.exercises.map((e: any) => ({
    name: e.name || 'Egzersiz',
    duration_minutes: e.duration_minutes || 0,
    calories_burned: Math.round(e.calories_burned || 0)
  })) : [];

  const sleep = {
    duration_minutes: log?.sleep?.duration_minutes || 0,
    calories_burned: Math.round(log?.sleep?.calories_burned || 0)
  };

  const bmr = Math.round(log?.totals?.calories_burned_bmr || 0);

  const calories_consumed = Math.round(log?.totals?.calories_consumed || 0);
  const calories_burned_exercise = Math.round(log?.totals?.calories_burned_exercise || 0);
  const calories_burned_sleep = Math.round(log?.totals?.calories_burned_sleep || 0);
  const calories_burned_bmr = bmr;

  const sleepBurnedNet = bmr > 0 ? 0 : calories_burned_sleep;
  const total_burned = calories_burned_exercise + bmr + sleepBurnedNet;

  const protein_g = Math.round(log?.totals?.protein_g || 0);
  const carbs_g = Math.round(log?.totals?.carbs_g || 0);
  const fat_g = Math.round(log?.totals?.fat_g || 0);

  return {
    date: dateStr,
    dateFormatted,
    meals,
    exercises,
    sleep,
    bmr,
    totals: {
      calories_consumed,
      calories_burned_exercise,
      calories_burned_sleep,
      calories_burned_bmr,
      total_burned,
      protein_g,
      carbs_g,
      fat_g
    }
  };
}
