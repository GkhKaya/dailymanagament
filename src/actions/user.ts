"use server";

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { User } from "@/models/User";
import { WeightLog } from "@/models/WeightLog";

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function updateUserHealthProfileAction(data: {
  age: number;
  weight: number;
  height: number;
  gender: string;
  activity_level: string;
  goal: string;
  targetCalories: number;
  birthDate?: string;
  targetWeight?: number;
}) {
  try {
    await connectDB();
    const userIdStr = await getUserId();

    let birthDateToSave: Date | undefined = undefined;
    if (data.birthDate && !isNaN(new Date(data.birthDate).getTime())) {
      birthDateToSave = new Date(data.birthDate);
    } else if (data.age && data.age > 0) {
      const year = new Date().getFullYear() - data.age;
      birthDateToSave = new Date(`${year}-01-01T00:00:00.000Z`);
    }

    const updateDoc: Record<string, any> = {
      current_weight_kg: data.weight,
      "profile.height_cm": data.height,
      "profile.gender": data.gender,
      "profile.activity_level": data.activity_level,
      "settings.daily_calorie_goal": data.targetCalories,
    };

    if (birthDateToSave) {
      updateDoc["profile.birth_date"] = birthDateToSave;
    }
    if (data.targetWeight !== undefined) {
      updateDoc["target_weight_kg"] = data.targetWeight;
    }

    await User.updateOne(
      { _id: userIdStr },
      { $set: updateDoc }
    );

    if (data.weight && data.weight > 0) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const existingWeightLog = await WeightLog.findOne({
        user_id: userIdStr as any,
        date: { $gte: today }
      });
      if (!existingWeightLog) {
        await WeightLog.create({
          user_id: userIdStr as any,
          weight_kg: data.weight,
          date: new Date()
        });
      }
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("Update User Health Error:", err);
    return { success: false, error: err.message };
  }
}

export async function checkUsernameUniqueAction(username: string) {
  try {
    await connectDB();
    const existing = await User.findOne({ name: username });
    return { isUnique: !existing };
  } catch (e: unknown) {
    console.error("Check Username Error:", e);
    return { isUnique: false, error: "Veritabanı hatası" };
  }
}

export async function saveRegistrationDataAction(data: {
  username: string;
  birth_date?: string;
  target_weight_kg?: number;
}) {
  try {
    await connectDB();
    const userIdStr = await getUserId();
    
    // Fallback: Check username uniqueness again to prevent race conditions
    const existing = await User.findOne({ username: data.username });
    if (existing && existing._id.toString() !== userIdStr) {
      return { success: false, error: "Bu kullanıcı adı zaten alınmış." };
    }

    const updateDoc: Record<string, any> = {
      username: data.username,
    };
    if (data.target_weight_kg) {
      updateDoc.target_weight_kg = data.target_weight_kg;
    }
    if (data.birth_date) {
      updateDoc["profile.birth_date"] = new Date(data.birth_date);
    }

    await User.updateOne(
      { _id: userIdStr },
      { $set: updateDoc }
    );

    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("Save Registration Data Error:", err);
    return { success: false, error: err.message };
  }
}
