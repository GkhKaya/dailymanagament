"use server";

import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DailyHabit } from "@/models/DailyHabit";

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export interface HabitItemDTO {
  id: string;
  title: string;
  icon: string;
  color: string;
  is_completed: boolean;
  streak: number;
  total_completed: number;
}

/**
 * Calculates current streak (consecutive days) for a habit given its completed dates.
 */
function calculateStreak(completedDates: string[], refDateStr: string): number {
  if (!completedDates || completedDates.length === 0) return 0;

  const [y, m, d] = refDateStr.split("-").map(Number);
  const dateCursor = new Date(y, m - 1, d);

  const isDoneToday = completedDates.includes(refDateStr);
  if (!isDoneToday) {
    // If not completed today, check if yesterday was completed to keep streak alive
    dateCursor.setDate(dateCursor.getDate() - 1);
  }

  let streak = 0;
  while (true) {
    const key = `${dateCursor.getFullYear()}-${String(dateCursor.getMonth() + 1).padStart(2, "0")}-${String(dateCursor.getDate()).padStart(2, "0")}`;
    if (completedDates.includes(key)) {
      streak++;
      dateCursor.setDate(dateCursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Kullanıcının günlük takip ettiği görevleri ve belirtilen tarihteki tamamlanma durumunu getirir.
 */
export async function getDailyHabitsAction(targetDateStr?: string): Promise<{
  success: boolean;
  habits?: HabitItemDTO[];
  targetDate?: string;
  error?: string;
}> {
  try {
    await connectDB();
    const userId = await getUserId();

    const targetDate = targetDateStr?.trim() || new Date().toISOString().split("T")[0];

    const habits = await DailyHabit.find({ user_id: userId, is_active: true })
      .sort({ order: 1, created_at: 1 })
      .lean();

    const result: HabitItemDTO[] = habits.map((h: any) => {
      const completedDates: string[] = h.completed_dates || [];
      const isCompleted = completedDates.includes(targetDate);
      const streak = calculateStreak(completedDates, targetDate);

      return {
        id: h._id.toString(),
        title: h.title,
        icon: h.icon || "check",
        color: h.color || "emerald",
        is_completed: isCompleted,
        streak,
        total_completed: completedDates.length
      };
    });

    return { success: true, habits: result, targetDate };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("getDailyHabitsAction error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Bir görevin belirtilen tarihteki tamamlanma durumunu (check / uncheck) değiştirir.
 */
export async function toggleDailyHabitAction(
  habitId: string,
  dateStr: string
): Promise<{
  success: boolean;
  is_completed?: boolean;
  error?: string;
}> {
  try {
    await connectDB();
    const userId = await getUserId();

    const cleanDate = dateStr?.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return { success: false, error: "Geçersiz tarih." };
    }

    const habit = await DailyHabit.findOne({ _id: habitId, user_id: userId, is_active: true });
    if (!habit) {
      return { success: false, error: "Görev bulunamadı." };
    }

    const isAlreadyCompleted = (habit.completed_dates || []).includes(cleanDate);

    if (isAlreadyCompleted) {
      await DailyHabit.updateOne(
        { _id: habitId },
        { $pull: { completed_dates: cleanDate }, $set: { updated_at: new Date() } }
      );
      return { success: true, is_completed: false };
    } else {
      await DailyHabit.updateOne(
        { _id: habitId },
        { $addToSet: { completed_dates: cleanDate }, $set: { updated_at: new Date() } }
      );
      return { success: true, is_completed: true };
    }
  } catch (e: unknown) {
    const err = e as Error;
    console.error("toggleDailyHabitAction error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Kullanıcıya yeni bir günlük takip görevi / alışkanlık ekler.
 */
export async function createDailyHabitAction(data: {
  title: string;
  icon?: string;
  color?: string;
}): Promise<{
  success: boolean;
  habit?: HabitItemDTO;
  error?: string;
}> {
  try {
    await connectDB();
    const userId = await getUserId();

    const title = data.title ? data.title.trim() : "";
    if (!title) {
      return { success: false, error: "Görev adı boş olamaz." };
    }

    const count = await DailyHabit.countDocuments({ user_id: userId, is_active: true });

    const newHabit = await DailyHabit.create({
      user_id: userId,
      title,
      icon: data.icon || "check",
      color: data.color || "emerald",
      order: count,
      is_active: true,
      completed_dates: []
    });

    const dto: HabitItemDTO = {
      id: newHabit._id.toString(),
      title: newHabit.title,
      icon: newHabit.icon || "check",
      color: newHabit.color || "emerald",
      is_completed: false,
      streak: 0,
      total_completed: 0
    };

    return { success: true, habit: dto };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("createDailyHabitAction error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Mevcut görevi günceller.
 */
export async function updateDailyHabitAction(
  habitId: string,
  data: {
    title: string;
    icon?: string;
    color?: string;
  }
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await connectDB();
    const userId = await getUserId();

    const title = data.title ? data.title.trim() : "";
    if (!title) {
      return { success: false, error: "Görev adı boş olamaz." };
    }

    await DailyHabit.updateOne(
      { _id: habitId, user_id: userId },
      {
        $set: {
          title,
          icon: data.icon || "check",
          color: data.color || "emerald",
          updated_at: new Date()
        }
      }
    );

    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("updateDailyHabitAction error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Görevi siler (soft delete).
 */
export async function deleteDailyHabitAction(habitId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await connectDB();
    const userId = await getUserId();

    await DailyHabit.updateOne(
      { _id: habitId, user_id: userId },
      { $set: { is_active: false, updated_at: new Date() } }
    );

    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("deleteDailyHabitAction error:", err);
    return { success: false, error: err.message };
  }
}
