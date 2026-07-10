"use server";

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DailyLog } from "@/models/DailyLog";
import { User } from "@/models/User";

// Helper to check session
async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

// ── MEALS ──
export async function addMealAction(data: { date: string; type: string; food_name: string; serving_description: string; quantity: number; calories: number }) {
  try {
    await connectDB();
    const userId = await getUserId();
    const targetDate = new Date(data.date);
    targetDate.setUTCHours(0, 0, 0, 0);
    
    // Find or create DailyLog
    let log = await DailyLog.findOne({ user_id: userId, date: targetDate });
    if (!log) {
      log = new DailyLog({
        user_id: userId,
        date: targetDate,
        meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
        sleep: { duration_minutes: 0, calories_burned: 0 },
        exercises: [],
        totals: { calories_consumed: 0, calories_burned_exercise: 0, calories_burned_sleep: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      });
    }

    const newFood = {
      entry_id: new mongoose.Types.ObjectId(),
      food_name: data.food_name,
      serving_description: data.serving_description,
      quantity: data.quantity,
      nutrition_snapshot: {
        calories: data.calories,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0
      }
    };

    // Add food to meal array
    if (data.type === 'breakfast') log.meals.breakfast.push(newFood);
    else if (data.type === 'lunch') log.meals.lunch.push(newFood);
    else if (data.type === 'dinner') log.meals.dinner.push(newFood);
    else if (data.type === 'snack') log.meals.snack.push(newFood);

    // Update totals
    log.totals.calories_consumed += data.calories;
    
    await log.save();
    return { success: true };
  } catch (err: any) {
    console.error(err);
    return { success: false, error: err.message };
  }
}

// ── EXERCISES ──
export async function addExerciseAction(data: { date: string; name: string; duration_minutes: number; calories_burned: number }) {
  try {
    await connectDB();
    const userId = await getUserId();
    const targetDate = new Date(data.date);
    targetDate.setUTCHours(0, 0, 0, 0);
    
    let log = await DailyLog.findOne({ user_id: userId, date: targetDate });
    if (!log) {
      log = new DailyLog({
        user_id: userId,
        date: targetDate,
        meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
        sleep: { duration_minutes: 0, calories_burned: 0 },
        exercises: [],
        totals: { calories_consumed: 0, calories_burned_exercise: 0, calories_burned_sleep: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      });
    }

    log.exercises.push({
      name: data.name,
      duration_minutes: data.duration_minutes,
      calories_burned: data.calories_burned,
      source: "manual"
    });

    log.totals.calories_burned_exercise += data.calories_burned;
    
    await log.save();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── SLEEP ──
export async function addSleepAction(data: { date: string; duration_minutes: number }) {
  try {
    await connectDB();
    const userId = await getUserId();
    const targetDate = new Date(data.date);
    targetDate.setUTCHours(0, 0, 0, 0);
    
    const user = await User.findById(userId);
    const weight = user?.current_weight_kg || 70;
    
    // Estimate sleep calories: ~0.9 kcal/kg/hour
    const calories_burned = Math.round((data.duration_minutes / 60) * 0.9 * weight);
    
    let log = await DailyLog.findOne({ user_id: userId, date: targetDate });
    if (!log) {
      log = new DailyLog({
        user_id: userId,
        date: targetDate,
        meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
        exercises: [],
        totals: { calories_consumed: 0, calories_burned_exercise: 0, calories_burned_sleep: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      });
    }

    // Subtract old sleep calories if exists
    if (log.sleep?.calories_burned) {
      log.totals.calories_burned_sleep -= log.sleep.calories_burned;
    }

    log.sleep = {
      duration_minutes: data.duration_minutes,
      calories_burned: calories_burned
    };
    log.totals.calories_burned_sleep += calories_burned;
    
    await log.save();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
