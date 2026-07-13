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
          "settings.daily_calorie_goal": data.targetCalories,
        }
      }
    );

    return { success: true };
  } catch (err: any) {
    console.error("Update User Health Error:", err);
    return { success: false, error: err.message };
  }
}
