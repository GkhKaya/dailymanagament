"use server";

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { User } from "@/models/User";

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
    const userId = new mongoose.Types.ObjectId(userIdStr);

    await User.updateOne(
      { _id: userId },
      {
        $set: {
          current_weight_kg: data.weight,
          "profile.height_cm": data.height,
          "profile.gender": data.gender,
          "profile.activity_level": data.activity_level,
          "profile.birth_date": data.birthDate ? new Date(data.birthDate) : undefined,
          target_weight_kg: data.targetWeight,
          "settings.daily_calorie_goal": data.targetCalories,
        }
      }
    );

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
    const existing = await User.findOne({ username });
    return { isUnique: !existing };
  } catch (e) {
    console.error("Check Username Error:", e);
    return { isUnique: false, error: "Veritabanı hatası" };
  }
}

export async function saveRegistrationDataAction(data: {
  username: string;
  birth_date: string;
  target_weight_kg: number;
}) {
  try {
    await connectDB();
    const userIdStr = await getUserId();
    
    // Fallback: Check username uniqueness again to prevent race conditions
    const existing = await User.findOne({ username: data.username });
    if (existing && existing._id !== userIdStr) {
      return { success: false, error: "Bu kullanıcı adı zaten alınmış." };
    }

    await User.updateOne(
      { _id: userIdStr },
      {
        $set: {
          username: data.username,
          target_weight_kg: data.target_weight_kg,
          "profile.birth_date": new Date(data.birth_date)
        }
      }
    );

    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("Save Registration Data Error:", err);
    return { success: false, error: err.message };
  }
}
