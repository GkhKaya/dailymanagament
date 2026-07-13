"use server";

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { User } from "@/models/User";

async function getSession() {
  return await auth.api.getSession({
    headers: await headers()
  });
}

export async function updateWeightAction(weightKg: number) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    
    await User.updateOne(
      { _id: userId },
      { $set: { current_weight_kg: weightKg } }
    );
    
    return { success: true };
  } catch (err: any) {
    console.error("updateWeightAction error:", err);
    return { success: false, error: err.message };
  }
}

export async function updateAgeAction(birthDateStr: string) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    
    const birthDate = new Date(birthDateStr);
    
    await User.updateOne(
      { _id: userId },
      { $set: { "profile.birth_date": birthDate } }
    );
    
    return { success: true };
  } catch (err: any) {
    console.error("updateAgeAction error:", err);
    return { success: false, error: err.message };
  }
}
