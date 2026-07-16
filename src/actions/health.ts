"use server";

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DailyLog } from "@/models/DailyLog";
import { User } from "@/models/User";
import { SavedFood } from "@/models/SavedFood";
import { WeightLog } from "@/models/WeightLog";
import { calculateTargetCalories } from "@/lib/calories";

// Helper to check session
async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

// ── MEALS ──
export async function addMealAction(data: { date: string; type: string; food_name: string; serving_description: string; quantity: number; calories: number; protein_g: number; carbs_g: number; fat_g: number; fatsecret_food_id?: string; save_as_recipe?: boolean }) {
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
      fatsecret_food_id: data.fatsecret_food_id,
      nutrition_snapshot: {
        calories: data.calories,
        protein_g: data.protein_g,
        carbs_g: data.carbs_g,
        fat_g: data.fat_g
      }
    };

    // Add food to meal array
    if (data.type === 'breakfast') log.meals.breakfast.push(newFood);
    else if (data.type === 'lunch') log.meals.lunch.push(newFood);
    else if (data.type === 'dinner') log.meals.dinner.push(newFood);
    else if (data.type === 'snack') log.meals.snack.push(newFood);

    // Update totals
    log.totals.calories_consumed += data.calories;
    log.totals.protein_g += data.protein_g;
    log.totals.carbs_g += data.carbs_g;
    log.totals.fat_g += data.fat_g;
    
    await log.save();

    // Save as recipe if requested
    if (data.save_as_recipe) {
      await SavedFood.create({
        user_id: userId,
        food_name: data.food_name,
        serving_description: data.serving_description,
        quantity: data.quantity,
        fatsecret_food_id: data.fatsecret_food_id,
        calories: data.calories,
        protein_g: data.protein_g,
        carbs_g: data.carbs_g,
        fat_g: data.fat_g
      });
    }

    // Auto-cache the food to our DB if it came from FatSecret
    if (data.fatsecret_food_id) {
      try {
        const { FoodCache } = require('@/models/FoodCache');
        const qty = parseFloat(data.quantity.toString()) || 1;
        const parts = data.serving_description.split(' ');
        const unitName = parts.length > 1 ? parts.slice(1).join(' ') : 'gram';
        
        // Construct standard FatSecret format for description (e.g. "Per 100g", "1 adet")
        const baseCalories = data.calories / qty;
        const baseProtein = data.protein_g / qty;
        const baseCarbs = data.carbs_g / qty;
        const baseFat = data.fat_g / qty;
        
        let descString = `1 ${unitName}`;
        if (unitName.toLowerCase() === 'gram') descString = 'Per 100g';
        else if (unitName.toLowerCase() === 'adet') descString = '1 adet';
        else if (unitName.toLowerCase() === 'porsiyon') descString = '1 porsiyon';
        
        descString += ` - Calories: ${Math.round(baseCalories)}kcal | Fat: ${baseFat.toFixed(2)}g | Carbs: ${baseCarbs.toFixed(2)}g | Protein: ${baseProtein.toFixed(2)}g`;

        await FoodCache.updateOne(
          { fatsecret_food_id: data.fatsecret_food_id },
          {
            $setOnInsert: {
              food_name: data.food_name,
              brand_name: null,
              servings: [{
                serving_id: `custom_${Date.now()}`,
                description: descString,
                calories: baseCalories,
                protein_g: baseProtein,
                carbs_g: baseCarbs,
                fat_g: baseFat
              }]
            }
          },
          { upsert: true }
        );
      } catch (cacheErr) {
        console.error("FoodCache upsert error:", cacheErr);
      }
    }

    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error(err);
    return { success: false, error: err.message };
  }
}

export async function updateMealAction(data: { date: string; entry_id: string; type: string; old_type: string; food_name: string; serving_description: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; }) {
  try {
    await connectDB();
    const userId = await getUserId();
    const targetDate = new Date(data.date);
    targetDate.setUTCHours(0, 0, 0, 0);

    const log = await DailyLog.findOne({ user_id: userId, date: targetDate });
    if (!log) return { success: false, error: "Günlük kayıt bulunamadı." };

    let foundFood = null;
    let oldCal = 0, oldProt = 0, oldCarb = 0, oldFat = 0;

    // Find and remove from old type array
    const oldType = data.old_type as 'breakfast' | 'lunch' | 'dinner' | 'snack';
    if (log.meals[oldType]) {
      const idx = log.meals[oldType].findIndex((f: any) => f.entry_id.toString() === data.entry_id);
      if (idx !== -1) {
        foundFood = log.meals[oldType][idx];
        oldCal = foundFood.nutrition_snapshot.calories;
        oldProt = foundFood.nutrition_snapshot.protein_g;
        oldCarb = foundFood.nutrition_snapshot.carbs_g;
        oldFat = foundFood.nutrition_snapshot.fat_g;
        log.meals[oldType].splice(idx, 1);
      }
    }

    if (!foundFood) return { success: false, error: "Kayıt bulunamadı." };

    // Update food details
    foundFood.food_name = data.food_name;
    foundFood.serving_description = data.serving_description;
    foundFood.nutrition_snapshot.calories = data.calories;
    foundFood.nutrition_snapshot.protein_g = data.protein_g;
    foundFood.nutrition_snapshot.carbs_g = data.carbs_g;
    foundFood.nutrition_snapshot.fat_g = data.fat_g;

    // Push to new type array
    const newType = data.type as 'breakfast' | 'lunch' | 'dinner' | 'snack';
    log.meals[newType].push(foundFood);

    // Update totals
    log.totals.calories_consumed += (data.calories - oldCal);
    log.totals.protein_g += (data.protein_g - oldProt);
    log.totals.carbs_g += (data.carbs_g - oldCarb);
    log.totals.fat_g += (data.fat_g - oldFat);

    await log.save();
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error(err);
    return { success: false, error: err.message };
  }
}

export async function deleteMealAction(data: { date: string; entry_id: string; type: string; }) {
  try {
    await connectDB();
    const userId = await getUserId();
    const targetDate = new Date(data.date);
    targetDate.setUTCHours(0, 0, 0, 0);

    const log = await DailyLog.findOne({ user_id: userId, date: targetDate });
    if (!log) return { success: false, error: "Günlük kayıt bulunamadı." };

    const type = data.type as 'breakfast' | 'lunch' | 'dinner' | 'snack';
    if (!log.meals[type]) return { success: false, error: "Kategori bulunamadı." };

    const idx = log.meals[type].findIndex((f: any) => f.entry_id.toString() === data.entry_id);
    if (idx === -1) return { success: false, error: "Kayıt bulunamadı." };

    const oldFood = log.meals[type][idx];
    
    // Update totals
    log.totals.calories_consumed -= oldFood.nutrition_snapshot.calories;
    log.totals.protein_g -= oldFood.nutrition_snapshot.protein_g;
    log.totals.carbs_g -= oldFood.nutrition_snapshot.carbs_g;
    log.totals.fat_g -= oldFood.nutrition_snapshot.fat_g;

    // Remove from array
    log.meals[type].splice(idx, 1);

    await log.save();
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
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
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

// ── SLEEP ──
export async function addSleepAction(data: { date: string; duration_minutes: number; quality?: string }) {
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
      calories_burned: calories_burned,
      quality: data.quality
    };
    log.totals.calories_burned_sleep += calories_burned;
    
    await log.save();
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

// ── SAVED FOODS ──
export async function getSavedFoodsAction() {
  try {
    await connectDB();
    const userId = await getUserId();
    
    const saved = await SavedFood.find({ user_id: userId }).sort({ created_at: -1 }).lean();
    
    return { 
      success: true, 
      data: saved.map((s: any) => ({
        id: s._id.toString(),
        name: s.food_name,
        calories: s.calories,
        protein: s.protein_g,
        carbs: s.carbs_g,
        fat: s.fat_g,
        quantity: s.quantity,
        serving_description: s.serving_description,
        fatsecret_food_id: s.fatsecret_food_id
      }))
    };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

// ── WEIGHT ──
export async function addWeightLogAction(data: { date: string; weight: number; note?: string }) {
  try {
    const userId = await getUserId();
    await connectDB();
    
    const targetDate = new Date(data.date);
    targetDate.setUTCHours(0, 0, 0, 0);

    // Update or insert WeightLog for this day
    await WeightLog.findOneAndUpdate(
      { user_id: userId, date: targetDate },
      { 
        $set: { 
          weight_kg: data.weight,
          ...(data.note && { note: data.note })
        } 
      },
      { upsert: true, new: true }
    );

    // If today is the date (or past), update current user profile
    const today = new Date();
    today.setUTCHours(0,0,0,0);
    
    // User._id is String — do NOT cast to ObjectId
    const user = await User.findById(userId).lean();
    
    if (user && user.profile) {
      // Calculate age
      let age = 25;
      if (user.profile.birth_date) {
        age = new Date().getFullYear() - new Date(user.profile.birth_date).getFullYear();
      }

      const oldWeight = user.current_weight_kg || data.weight;
      const oldBmr = (10 * oldWeight) + (6.25 * (user.profile.height_cm || 170)) - (5 * age) + (user.profile.gender === 'Male' ? 5 : -161);
      const multipliers: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
      const oldTdee = Math.round(oldBmr * (multipliers[user.profile.activity_level || 'sedentary'] || 1.2));
      const oldTarget = user.settings?.daily_calorie_goal || oldTdee;
      const deficit = oldTarget - oldTdee;

      const newBmr = (10 * data.weight) + (6.25 * (user.profile.height_cm || 170)) - (5 * age) + (user.profile.gender === 'Male' ? 5 : -161);
      const newTdee = Math.round(newBmr * (multipliers[user.profile.activity_level || 'sedentary'] || 1.2));
      const newTarget = Math.max(1200, newTdee + deficit);
      
      await User.updateOne(
        { _id: userId },
        { 
          $set: { 
            current_weight_kg: data.weight,
            "settings.daily_calorie_goal": newTarget
          } 
        }
      );
    } else {
      await User.updateOne(
        { _id: userId },
        { $set: { current_weight_kg: data.weight } }
      );
    }

    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error(err);
    return { success: false, error: err.message };
  }
}
