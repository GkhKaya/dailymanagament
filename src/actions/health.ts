"use server";

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DailyLog } from "@/models/DailyLog";
import { User } from "@/models/User";
import { SavedFood } from "@/models/SavedFood";
import { FoodCache } from "@/models/FoodCache";
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
export async function addMealAction(data: { date: string; type: string; food_name: string; serving_description: string; quantity: number; unit_type?: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; food_cache_id?: string; fatsecret_food_id?: string; save_as_recipe?: boolean }) {
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
      unit_type: data.unit_type || 'gram',
      food_cache_id: data.food_cache_id || null,
      fatsecret_food_id: data.fatsecret_food_id || null, // geriye uyumluluk
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
        unit_type: data.unit_type || 'gram',
        food_cache_id: data.food_cache_id,
        fatsecret_food_id: data.fatsecret_food_id,
        calories: data.calories,
        protein_g: data.protein_g,
        carbs_g: data.carbs_g,
        fat_g: data.fat_g
      });
    }

    return { success: true, entry_id: newFood.entry_id.toString() };
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
    
    const user = await User.findById(userId);
    
    // Use the exact calories provided by the user
    const netCalories = data.calories_burned;

    let log = await DailyLog.findOne({ user_id: userId, date: targetDate });
    if (!log) {
      log = new DailyLog({
        user_id: userId,
        date: targetDate,
        meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
        sleep: { duration_minutes: 0, calories_burned: 0 },
        exercises: [],
        totals: { calories_consumed: 0, calories_burned_exercise: 0, calories_burned_sleep: 0, calories_burned_bmr: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      });
    }

    log.exercises.push({
      name: data.name,
      duration_minutes: data.duration_minutes,
      calories_burned: netCalories,
      source: "manual"
    });

    log.totals.calories_burned_exercise += netCalories;
    
    await log.save();
    return { success: true, netCalories };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

// ── BMR ──
export async function addBMRAction(dateString: string) {
  try {
    await connectDB();
    const userId = await getUserId();
    const targetDate = new Date(dateString);
    targetDate.setUTCHours(0, 0, 0, 0);

    const user = await User.findById(userId);
    if (!user) return { success: false, error: "User not found" };

    if (!user.current_weight_kg || !user.profile?.height_cm || !user.profile?.birth_date || !user.profile?.gender) {
      return { success: false, error: "BMR hesaplamak için boy, kilo, doğum tarihi ve cinsiyet bilgileri eksiksiz olmalıdır." };
    }

    const currentWeight = user.current_weight_kg;
    let age = 0;
    const diffMs = Date.now() - new Date(user.profile.birth_date).getTime();
    age = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
    
    let bmr = (10 * currentWeight) + (6.25 * user.profile.height_cm) - (5 * age);
    bmr += user.profile.gender === 'erkek' ? 5 : -161;
    bmr = Math.round(bmr);

    let log = await DailyLog.findOne({ user_id: userId, date: targetDate });
    if (!log) {
      log = new DailyLog({
        user_id: userId,
        date: targetDate,
        meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
        sleep: { duration_minutes: 0, calories_burned: 0 },
        exercises: [],
        totals: { calories_consumed: 0, calories_burned_exercise: 0, calories_burned_sleep: 0, calories_burned_bmr: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      });
    }

    if (log.bmr_added) {
      return { success: false, error: "BMR zaten eklenmiş." };
    }

    log.bmr_added = true;
    if (!log.totals) {
      log.totals = { calories_consumed: 0, calories_burned_exercise: 0, calories_burned_sleep: 0, calories_burned_bmr: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
    }
    log.totals.calories_burned_bmr = bmr;
    
    await log.save();
    return { success: true, bmr };
  } catch (e: unknown) {
    const err = e as Error;
    console.error(err);
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
        totals: { calories_consumed: 0, calories_burned_exercise: 0, calories_burned_sleep: 0, calories_burned_bmr: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      });
    }

    // Automatically add BMR if not added yet
    if (!log.bmr_added && user?.current_weight_kg && user?.profile?.height_cm && user?.profile?.birth_date) {
      const currentWeight = user.current_weight_kg;
      const diffMs = Date.now() - new Date(user.profile.birth_date).getTime();
      const age = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
      
      let bmr = (10 * currentWeight) + (6.25 * user.profile.height_cm) - (5 * age);
      bmr += (user.profile.gender === 'erkek' || user.profile.gender === 'male') ? 5 : -161;
      bmr = Math.round(bmr);
      
      log.bmr_added = true;
      if (!log.totals) log.totals = { calories_consumed: 0, calories_burned_exercise: 0, calories_burned_sleep: 0, calories_burned_bmr: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
      log.totals.calories_burned_bmr = bmr;
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
    
    // Also fetch last 7 days of logs to get recent meals
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLogs = await DailyLog.find({ user_id: userId, date: { $gte: sevenDaysAgo } }).sort({ date: -1 }).lean();
    
    // Recent meals grouped by meal type
    const recentByType = {
      breakfast: new Map(),
      lunch: new Map(),
      dinner: new Map(),
      snack: new Map()
    };
    
    recentLogs.forEach((log: any) => {
      ['breakfast', 'lunch', 'dinner', 'snack'].forEach((type: string) => {
        const mealType = type as 'breakfast' | 'lunch' | 'dinner' | 'snack';
        (log.meals[mealType] || []).forEach((m: any) => {
          if (!recentByType[mealType].has(m.food_name?.toLowerCase())) {
            const detectedUnit = m.unit_type || (m.serving_description?.toLowerCase().includes('adet') || m.serving_description?.toLowerCase().includes('porsiyon') ? 'adet' : 'gram');
            recentByType[mealType].set(m.food_name?.toLowerCase(), {
              id: m.entry_id.toString(),
              food_name: m.food_name,
              calories: m.nutrition_snapshot?.calories ?? 0,
              protein_g: m.nutrition_snapshot?.protein_g ?? 0,
              carbs_g: m.nutrition_snapshot?.carbs_g ?? 0,
              fat_g: m.nutrition_snapshot?.fat_g ?? 0,
              quantity: m.quantity ?? 1,
              unit_type: detectedUnit,
              serving_description: m.serving_description,
              fatsecret_food_id: m.fatsecret_food_id,
              food_cache_id: m.food_cache_id
            });
          }
        });
      });
    });

    // Convert maps to arrays
    const recentByTypeArray = {
      breakfast: Array.from(recentByType.breakfast.values()),
      lunch: Array.from(recentByType.lunch.values()),
      dinner: Array.from(recentByType.dinner.values()),
      snack: Array.from(recentByType.snack.values())
    };

    const savedFoods = saved.map((s: any) => ({
      id: s._id.toString(),
      food_name: s.food_name,
      calories: s.calories ?? 0,
      protein_g: s.protein_g ?? 0,
      carbs_g: s.carbs_g ?? 0,
      fat_g: s.fat_g ?? 0,
      quantity: s.quantity ?? 1,
      unit_type: s.unit_type || (s.serving_description?.toLowerCase().includes('adet') || s.serving_description?.toLowerCase().includes('porsiyon') ? 'adet' : 'gram'),
      serving_description: s.serving_description,
      fatsecret_food_id: s.fatsecret_food_id,
      food_cache_id: s.food_cache_id
    }));

    // FoodCache koleksiyonumuz ile zenginleştir (özellikle eski veya eksik veriler için)
    const allFoodNames: string[] = [];
    ['breakfast', 'lunch', 'dinner', 'snack'].forEach((type) => {
      recentByTypeArray[type as keyof typeof recentByTypeArray].forEach((item: any) => {
        if (item.food_name) allFoodNames.push(item.food_name);
      });
    });
    savedFoods.forEach((item: any) => {
      if (item.food_name) allFoodNames.push(item.food_name);
    });

    if (allFoodNames.length > 0) {
      try {
        const uniqueNames = Array.from(new Set(allFoodNames));
        const foodCaches = await FoodCache.find({
          food_name: { $in: uniqueNames.map(n => new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) }
        }).lean();

        const cacheMap = new Map();
        foodCaches.forEach((fc: any) => {
          cacheMap.set(fc.food_name.toLowerCase(), fc);
        });

        const enrichItem = (item: any) => {
          const matched = cacheMap.get(item.food_name.toLowerCase());
          if (matched) {
            item.unit_type = matched.unit_type || item.unit_type;
            item.food_cache_id = matched._id.toString();
            item.per_unit = matched.per_unit;
          }
        };

        ['breakfast', 'lunch', 'dinner', 'snack'].forEach((type) => {
          recentByTypeArray[type as keyof typeof recentByTypeArray].forEach(enrichItem);
        });
        savedFoods.forEach(enrichItem);
      } catch (e) {
        console.error('FoodCache zenginleştirme hatası:', e);
      }
    }

    return { 
      success: true, 
      data: {
        savedFoods,
        recentByType: recentByTypeArray
      }
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

    // Safely drop old unique index on MongoDB if it still exists in the database
    try {
      await WeightLog.collection.dropIndex('user_id_1_date_1');
    } catch (e) {
      // Index already dropped or doesn't exist
    }

    const logDate = data.date ? new Date(data.date) : new Date();
    logDate.setUTCHours(0, 0, 0, 0);

    const weightLog = new WeightLog({
      user_id: userId,
      date: logDate,
      weight_kg: data.weight,
      note: data.note || null
    });
    await weightLog.save();

    // Update current user profile with latest weight & recalculated target calories
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

export async function deleteWeightLogAction(id: string) {
  try {
    const userId = await getUserId();
    await connectDB();
    await WeightLog.deleteOne({ _id: id, user_id: userId });

    // Update user current_weight_kg to the latest remaining weight log if available
    const latestLog = await WeightLog.findOne({ user_id: userId }).sort({ date: -1 }).lean();
    if (latestLog) {
      await User.updateOne({ _id: userId }, { $set: { current_weight_kg: latestLog.weight_kg } });
    }
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error(err);
    return { success: false, error: err.message };
  }
}
