"use server";

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DailyLog } from "@/models/DailyLog";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";
import { getStockPortfolioAction } from "@/actions/stocks";

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

export interface FinanceExportTransaction {
  date: string;
  description: string;
  accountName: string;
  categoryName: string;
  type: string;
  amount: number;
}

export interface FinanceExportData {
  startDate: string;
  endDate: string;
  income: number;
  expense: number;
  transactions: FinanceExportTransaction[];
}

export interface StocksExportPosition {
  symbol: string;
  name: string;
  assetType: 'stock' | 'fund';
  total_lots: number;
  average_cost: number;
  total_cost: number;
  current_price?: number;
  current_value?: number;
  unrealized_pnl?: number;
  unrealized_pnl_percent?: number;
}

export interface StocksExportTrade {
  date: string;
  symbol: string;
  name: string;
  assetType: 'stock' | 'fund';
  type: 'buy' | 'sell';
  lots: number;
  price: number;
  cost_basis?: number;
  realized_pnl?: number;
  realized_pnl_percent?: number;
  holding_days?: number;
  total_amount: number;
  notes?: string;
}

export interface StocksExportData {
  startDate: string;
  endDate: string;
  generatedAt: string;
  totals: {
    totalInvestedCost: number;
    totalCurrentValue: number;
    totalUnrealizedPnl: number;
    totalUnrealizedPnlPercent: number;
    totalRealizedPnl: number;
    totalRealizedPnlPercent: number;
    winRate: number;
    winningTradesCount: number;
    losingTradesCount: number;
    totalBuyVolume: number;
    totalSellVolume: number;
  };
  positions: StocksExportPosition[];
  realizedTrades: StocksExportTrade[];
  allTrades: StocksExportTrade[];
}

function getDateRange(startDateStr: string, endDateStr: string) {
  const startDate = new Date(`${startDateStr}T00:00:00.000Z`);
  const endDate = new Date(`${endDateStr}T23:59:59.999Z`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
    throw new Error('Başlangıç tarihi bitiş tarihinden sonra olamaz.');
  }
  return { startDate, endDate };
}

export async function getExportRangeDataAction(startDateStr: string, endDateStr: string) {
  try {
    await connectDB();
    const userId = await getUserId();
    const { startDate, endDate } = getDateRange(startDateStr, endDateStr);
    const user = await User.findById(userId).lean();
    const logs = await DailyLog.find({ user_id: userId, date: { $gte: startDate, $lte: endDate } }).lean();
    const logsMap = new Map(logs.map((log: any) => [new Date(log.date).toISOString().slice(0, 10), log]));
    const days: ExportDayData[] = [];

    for (let current = new Date(startDate); current <= endDate; current.setUTCDate(current.getUTCDate() + 1)) {
      const date = new Date(current);
      days.push(mapDailyLogToExportDay(logsMap.get(date.toISOString().slice(0, 10)), date));
    }

    return {
      success: true,
      userName: user?.profile?.name || user?.name || 'Kullanıcı',
      startDateStr: startDate.toLocaleDateString('tr-TR', { timeZone: 'UTC' }),
      endDateStr: endDate.toLocaleDateString('tr-TR', { timeZone: 'UTC' }),
      days
    };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message || 'Veri alınırken hata oluştu.' };
  }
}

export async function getFinanceExportDataAction(startDateStr: string, endDateStr: string) {
  try {
    await connectDB();
    const userId = await getUserId();
    const { startDate, endDate } = getDateRange(startDateStr, endDateStr);
    const [user, transactions] = await Promise.all([
      User.findById(userId).lean(),
      Transaction.find({ user_id: userId, is_deleted: false, date: { $gte: startDate, $lte: endDate } })
        .sort({ date: -1 })
        .populate('account_id', 'name')
        .populate('category_id', 'name')
        .lean()
    ]);

    let income = 0;
    let expense = 0;
    const mapped = transactions.map((transaction: any) => {
      const amount = parseFloat(transaction.amount.toString());
      if (transaction.type === 'income') income += amount;
      if (transaction.type === 'expense') expense += amount;
      return {
        date: new Date(transaction.date).toLocaleDateString('tr-TR'),
        description: transaction.description,
        accountName: transaction.account_id?.name || 'Dış ödeme',
        categoryName: transaction.category_id?.name || (transaction.type === 'credit_card_payment' ? 'Kart borcu ödemesi' : '-'),
        type: transaction.type,
        amount
      };
    });

    return {
      success: true,
      userName: user?.profile?.name || user?.name || 'Kullanıcı',
      data: {
        startDate: startDate.toLocaleDateString('tr-TR'),
        endDate: endDate.toLocaleDateString('tr-TR'),
        income,
        expense,
        transactions: mapped
      } satisfies FinanceExportData
    };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message || 'Veri alınırken hata oluştu.' };
  }
}

export async function getStocksExportDataAction(startDateStr?: string, endDateStr?: string, assetFilter: 'all' | 'stock' | 'fund' = 'all') {
  try {
    await connectDB();
    const userId = await getUserId();
    const [user, portfolioRes] = await Promise.all([
      User.findById(userId).lean(),
      getStockPortfolioAction()
    ]);

    if (!portfolioRes.success || !portfolioRes.data) {
      throw new Error(portfolioRes.error || "Borsa verileri alınamadı.");
    }

    const portfolio = portfolioRes.data;
    const hasRange = Boolean(startDateStr && endDateStr);
    let startFilterDate: Date | null = null;
    let endFilterDate: Date | null = null;

    if (hasRange && startDateStr && endDateStr) {
      const range = getDateRange(startDateStr, endDateStr);
      startFilterDate = range.startDate;
      endFilterDate = range.endDate;
    }

    const filterByDate = (tradeDateStr: string | undefined) => {
      if (!startFilterDate || !endFilterDate || !tradeDateStr) return true;
      const tDate = new Date(tradeDateStr);
      return tDate >= startFilterDate && tDate <= endFilterDate;
    };

    const filterByAsset = (assetType: string | undefined) => assetFilter === 'all' || (assetType || 'stock') === assetFilter;
    const newestFirst = (a: { rawDate?: string; date: string; created_at?: string }, b: { rawDate?: string; date: string; created_at?: string }) => {
      const timeDiff = new Date(b.rawDate || b.date).getTime() - new Date(a.rawDate || a.date).getTime();
      if (timeDiff !== 0) return timeDiff;
      const createA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const createB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return createB - createA;
    };
    const filteredRealized = portfolio.realizedTrades
      .filter(t => filterByDate(t.rawDate || t.date) && filterByAsset(t.assetType))
      .sort(newestFirst);
    const filteredAllTrades = portfolio.allTrades
      .filter(t => filterByDate(t.rawDate || t.date) && filterByAsset(t.assetType))
      .sort(newestFirst);
    const filteredPositions = portfolio.positions.filter(p => filterByAsset(p.assetType));

    const positions: StocksExportPosition[] = filteredPositions.map(p => ({
      symbol: p.symbol,
      name: p.name || '',
      assetType: p.assetType || 'stock',
      total_lots: p.total_lots,
      average_cost: p.average_cost,
      total_cost: p.total_cost,
      current_price: p.current_price,
      current_value: p.current_value,
      unrealized_pnl: p.unrealized_pnl,
      unrealized_pnl_percent: p.unrealized_pnl_percent,
    }));

    const mapTrade = (t: any): StocksExportTrade => ({
      date: t.date,
      symbol: t.symbol,
      name: t.name || '',
      assetType: t.assetType || 'stock',
      type: t.type,
      lots: t.lots,
      price: t.price,
      cost_basis: t.cost_basis,
      realized_pnl: t.realized_pnl,
      realized_pnl_percent: t.realized_pnl_percent,
      holding_days: t.holding_days,
      total_amount: t.total_amount || (t.lots * t.price),
      notes: t.notes || '',
    });

    const mappedRealizedTrades = filteredRealized.map(mapTrade);
    const mappedAllTrades = filteredAllTrades.map(mapTrade);
    const totalInvestedCost = positions.reduce((sum, p) => sum + (p.total_cost || 0), 0);
    const totalCurrentValue = positions.reduce((sum, p) => sum + (p.current_value || 0), 0);
    const totalUnrealizedPnl = positions.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0);
    const totalRealizedPnl = mappedRealizedTrades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0);
    const realizedCostBasis = mappedRealizedTrades.reduce((sum, t) => sum + (t.cost_basis || 0), 0);
    const totalBuyVolume = mappedAllTrades.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.total_amount, 0);
    const totalSellVolume = mappedAllTrades.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.total_amount, 0);
    const winningTradesCount = mappedRealizedTrades.filter(t => (t.realized_pnl || 0) > 0).length;
    const losingTradesCount = mappedRealizedTrades.filter(t => (t.realized_pnl || 0) < 0).length;

    const data: StocksExportData = {
      startDate: startDateStr ? new Date(`${startDateStr}T00:00:00.000Z`).toLocaleDateString('tr-TR', { timeZone: 'UTC' }) : (filteredAllTrades.length > 0 ? filteredAllTrades[filteredAllTrades.length - 1].date : new Date().toLocaleDateString('tr-TR')),
      endDate: endDateStr ? new Date(`${endDateStr}T00:00:00.000Z`).toLocaleDateString('tr-TR', { timeZone: 'UTC' }) : new Date().toLocaleDateString('tr-TR'),
      generatedAt: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      totals: {
        totalInvestedCost,
        totalCurrentValue,
        totalUnrealizedPnl,
        totalUnrealizedPnlPercent: totalInvestedCost ? (totalUnrealizedPnl / totalInvestedCost) * 100 : 0,
        totalRealizedPnl,
        totalRealizedPnlPercent: realizedCostBasis ? (totalRealizedPnl / realizedCostBasis) * 100 : 0,
        winRate: mappedRealizedTrades.length ? (winningTradesCount / mappedRealizedTrades.length) * 100 : 0,
        winningTradesCount,
        losingTradesCount,
        totalBuyVolume,
        totalSellVolume,
      },
      positions,
      realizedTrades: mappedRealizedTrades,
      allTrades: mappedAllTrades,
    };

    return {
      success: true,
      userName: (user as any)?.profile?.name || (user as any)?.name || 'Kullanıcı',
      data
    };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message || 'Borsa raporu verisi alınırken hata oluştu.' };
  }
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
      const year = baseDate.getUTCFullYear();
      const month = baseDate.getUTCMonth();

      const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

      const logs = await DailyLog.find({
        user_id: userId,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      }).lean();

      const logsMap = new Map<string, any>();
      logs.forEach((l: any) => {
        const dStr = new Date(l.date).toISOString().split('T')[0];
        logsMap.set(dStr, l);
      });

      // Split month into 4 weeks (7 days each, 4th week includes remaining days up to end of month)
      const weeks: ExportWeekSummary[] = [];

      for (let w = 0; w < 4; w++) {
        const wStart = new Date(startOfMonth);
        wStart.setUTCDate(startOfMonth.getUTCDate() + (w * 7));

        const wEnd = new Date(wStart);
        wEnd.setUTCDate(wStart.getUTCDate() + 6);
        if (w === 3) {
          // 4th week goes until end of month (e.g. 31st)
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
          const dayName = d.toLocaleDateString('tr-TR', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });

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
          startDate: wStart.toLocaleDateString('tr-TR', { timeZone: 'UTC' }),
          endDate: wEnd.toLocaleDateString('tr-TR', { timeZone: 'UTC' }),
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
        monthName: startOfMonth.toLocaleDateString('tr-TR', { timeZone: 'UTC', month: 'long', year: 'numeric' }),
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
    timeZone: 'UTC',
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
