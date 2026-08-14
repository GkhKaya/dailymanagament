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
import { calculateTargetCalories, calculateBMR, calculateAge, calculateStepsCalories, isMale } from "@/lib/calories";

export async function getFoodDatabaseAction() {
  try {
    await connectDB();
    const foods = await FoodCache.find({}).sort({ food_name: 1 }).lean();
    
    // Map _id to id to avoid Next.js serialization issues
    const formattedFoods = foods.map(food => ({
      id: food._id.toString(),
      food_name: food.food_name,
      food_name_en: food.food_name_en,
      unit_type: food.unit_type,
      per_unit: food.per_unit,
      source: food.source,
      ai_provider: food.ai_provider,
      nutrition_basis: food.nutrition_basis,
      search_tags: food.search_tags
    }));

    return { success: true, foods: formattedFoods };
  } catch (error: any) {
    return { success: false, error: error.message || "Besin veritabanı getirilirken bir hata oluştu." };
  }
}
async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

// ── MEALS ──
export async function addMealAction(data: { date: string; type: string; food_name: string; serving_description: string; quantity: number; unit_type?: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; sugar_g?: number; food_cache_id?: string; fatsecret_food_id?: string; save_as_recipe?: boolean }) {
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
        totals: { calories_consumed: 0, calories_burned_exercise: 0, calories_burned_sleep: 0, protein_g: 0, carbs_g: 0, fat_g: 0, sugar_g: 0 }
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
        fat_g: data.fat_g,
        sugar_g: data.sugar_g || 0
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
    log.totals.sugar_g += data.sugar_g || 0;
    
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
        fat_g: data.fat_g,
        sugar_g: data.sugar_g || 0
      });
    }

    return { success: true, entry_id: newFood.entry_id.toString() };
  } catch (e: unknown) {
    const err = e as Error;
    console.error(err);
    return { success: false, error: err.message };
  }
}

export async function addMealsAction(items: Array<{ date: string; type: 'breakfast' | 'lunch' | 'dinner' | 'snack'; food_name: string; serving_description: string; quantity: number; unit_type?: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; sugar_g?: number; food_cache_id?: string }>) {
  try {
    if (items.length === 0) return { success: false, error: 'Eklenecek besin bulunamadı.' };
    await connectDB();
    const userId = await getUserId();
    const date = new Date(items[0].date);
    date.setUTCHours(0, 0, 0, 0);

    if (items.some((item) => item.date.slice(0, 10) !== items[0].date.slice(0, 10) || item.type !== items[0].type || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.calories) || item.calories < 0 || !Number.isFinite(item.protein_g) || item.protein_g < 0 || !Number.isFinite(item.carbs_g) || item.carbs_g < 0 || !Number.isFinite(item.fat_g) || item.fat_g < 0)) {
      return { success: false, error: 'Öğün verilerinden biri geçersiz.' };
    }

    let log = await DailyLog.findOne({ user_id: userId, date });
    if (!log) {
      log = new DailyLog({
        user_id: userId,
        date,
        meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
        sleep: { duration_minutes: 0, calories_burned: 0 },
        exercises: [],
        totals: { calories_consumed: 0, calories_burned_exercise: 0, calories_burned_sleep: 0, protein_g: 0, carbs_g: 0, fat_g: 0, sugar_g: 0 }
      });
    }

    const foods = items.map((item) => ({
      entry_id: new mongoose.Types.ObjectId(),
      food_name: item.food_name,
      serving_description: item.serving_description,
      quantity: item.quantity,
      unit_type: item.unit_type || 'gram',
      food_cache_id: item.food_cache_id || null,
      fatsecret_food_id: null,
      nutrition_snapshot: {
        calories: item.calories,
        protein_g: item.protein_g,
        carbs_g: item.carbs_g,
        fat_g: item.fat_g,
        sugar_g: item.sugar_g || 0
      }
    }));

    log.meals[items[0].type].push(...foods);
    log.totals.calories_consumed += items.reduce((sum, item) => sum + item.calories, 0);
    log.totals.protein_g += items.reduce((sum, item) => sum + item.protein_g, 0);
    log.totals.carbs_g += items.reduce((sum, item) => sum + item.carbs_g, 0);
    log.totals.fat_g += items.reduce((sum, item) => sum + item.fat_g, 0);
    log.totals.sugar_g += items.reduce((sum, item) => sum + (item.sugar_g || 0), 0);
    await log.save();

    return { success: true, entry_ids: foods.map((food) => food.entry_id.toString()) };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

export async function updateMealAction(data: { date: string; entry_id: string; type: string; old_type: string; food_name: string; serving_description: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; sugar_g?: number; }) {
  try {
    await connectDB();
    const userId = await getUserId();
    const targetDate = new Date(data.date);
    targetDate.setUTCHours(0, 0, 0, 0);

    const log = await DailyLog.findOne({ user_id: userId, date: targetDate });
    if (!log) return { success: false, error: "Günlük kayıt bulunamadı." };

    let foundFood = null;
    let oldCal = 0, oldProt = 0, oldCarb = 0, oldFat = 0, oldSugar = 0;

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
        oldSugar = foundFood.nutrition_snapshot.sugar_g || 0;
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
    foundFood.nutrition_snapshot.sugar_g = data.sugar_g ?? oldSugar;

    // Push to new type array
    const newType = data.type as 'breakfast' | 'lunch' | 'dinner' | 'snack';
    log.meals[newType].push(foundFood);

    // Update totals
    log.totals.calories_consumed += (data.calories - oldCal);
    log.totals.protein_g += (data.protein_g - oldProt);
    log.totals.carbs_g += (data.carbs_g - oldCarb);
    log.totals.fat_g += (data.fat_g - oldFat);
    log.totals.sugar_g += ((data.sugar_g ?? oldSugar) - oldSugar);

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
    log.totals.sugar_g -= oldFood.nutrition_snapshot.sugar_g || 0;

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
export async function addExerciseAction(data: { date: string; name: string; duration_minutes: number; calories_burned: number; step_count?: number }) {
  try {
    await connectDB();
    const userId = await getUserId();
    const targetDate = new Date(data.date);
    targetDate.setUTCHours(0, 0, 0, 0);
    
    const user = await User.findById(userId);
    const isStepEntry = data.name === "Adım Sayısı" && Number.isFinite(data.step_count) && (data.step_count || 0) > 0;

    if (!Number.isFinite(data.duration_minutes) || data.duration_minutes < 0 || !Number.isFinite(data.calories_burned) || data.calories_burned < 0) {
      return { success: false, error: "Egzersiz bilgileri geçersiz." };
    }

    if (data.name === "Adım Sayısı" && !isStepEntry) {
      return { success: false, error: "Geçerli bir adım sayısı girin." };
    }

    const netCalories = isStepEntry
      ? calculateStepsCalories(user?.current_weight_kg || 0, data.step_count!)
      : data.calories_burned;

    if (isStepEntry && (!user?.current_weight_kg || !user.profile?.height_cm || !user.profile?.birth_date)) {
      return { success: false, error: "Adım kalorisi için boy, kilo ve doğum tarihi bilgileri eksiksiz olmalıdır." };
    }

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

    if (isStepEntry) {
      const age = calculateAge(user!.profile.birth_date);
      const bmr = calculateBMR(user!.current_weight_kg!, user!.profile.height_cm!, age, user!.profile.gender);
      log.exercises = log.exercises.filter((exercise: { step_count?: number }) => !exercise.step_count);
      log.bmr_added = true;
      log.totals.calories_burned_bmr = bmr + netCalories;
    }

    log.exercises.push({
      name: data.name,
      duration_minutes: data.duration_minutes,
      calories_burned: netCalories,
      source: isStepEntry ? "estimated" : "manual",
      ...(isStepEntry ? { step_count: data.step_count } : {})
    });

    if (!isStepEntry) log.totals.calories_burned_exercise += netCalories;
    
    await log.save();
    return { success: true, netCalories, bmr: isStepEntry ? log.totals.calories_burned_bmr : undefined };
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

    if (!user.current_weight_kg || !user.profile?.height_cm || !user.profile?.birth_date) {
      return { success: false, error: "BMR hesaplamak için boy, kilo, doğum tarihi bilgileri eksiksiz olmalıdır." };
    }

    const currentWeight = user.current_weight_kg;
    const age = calculateAge(user.profile.birth_date);
    const bmr = calculateBMR(currentWeight, user.profile.height_cm, age, user.profile.gender);

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
      const age = calculateAge(user.profile.birth_date);
      const bmr = calculateBMR(currentWeight, user.profile.height_cm, age, user.profile.gender);
      
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
              sugar_g: m.nutrition_snapshot?.sugar_g ?? 0,
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
      sugar_g: s.sugar_g ?? 0,
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

    const logDate = new Date();

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
      const age = calculateAge(user.profile.birth_date);
      const height = user.profile.height_cm || 170;

      const oldWeight = user.current_weight_kg || data.weight;
      const oldBmr = calculateBMR(oldWeight, height, age, user.profile.gender);
      const multipliers: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
      const oldTdee = Math.round(oldBmr * (multipliers[user.profile.activity_level || 'sedentary'] || 1.2));
      const oldTarget = user.settings?.daily_calorie_goal || oldTdee;
      const deficit = oldTarget - oldTdee;

      const newBmr = calculateBMR(data.weight, height, age, user.profile.gender);
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

export async function deleteExerciseAction(data: { date: string; entry_id: string }) {
  try {
    await connectDB();
    const userId = await getUserId();
    const targetDate = new Date(data.date);
    targetDate.setUTCHours(0, 0, 0, 0);

    const log = await DailyLog.findOne({ user_id: userId, date: targetDate });
    if (!log) return { success: false, error: "Günlük kayıt bulunamadı." };

    if (!log.exercises) return { success: false, error: "Egzersiz bulunamadı." };

    const idx = log.exercises.findIndex((e: any) => e.entry_id?.toString() === data.entry_id || e._id?.toString() === data.entry_id);
    if (idx === -1) return { success: false, error: "Egzersiz bulunamadı." };

    const oldEx = log.exercises[idx];

    // Subtract calories from totals
    log.totals.calories_burned_exercise -= oldEx.calories_burned || 0;
    if (log.totals.calories_burned_exercise < 0) log.totals.calories_burned_exercise = 0;

    log.exercises.splice(idx, 1);

    await log.save();
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error(err);
    return { success: false, error: err.message };
  }
}
