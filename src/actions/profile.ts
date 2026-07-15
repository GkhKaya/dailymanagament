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
    const userId = session.user.id;
    
    await User.updateOne(
      { _id: userId },
      { $set: { current_weight_kg: weightKg } }
    );
    
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
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
    const userId = session.user.id;
    
    const birthDate = new Date(birthDateStr);
    
    await User.updateOne(
      { _id: userId },
      { $set: { "profile.birth_date": birthDate } }
    );
    
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("updateAgeAction error:", err);
    return { success: false, error: err.message };
  }
}
export async function updateUsernameAction(newUsername: string) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();
    const userId = session.user.id;
    
    // Check uniqueness
    const existing = await User.findOne({ username: newUsername });
    if (existing && existing._id !== userId) {
      return { success: false, error: "Bu kullanıcı adı zaten alınmış." };
    }

    await User.updateOne(
      { _id: userId },
      { $set: { username: newUsername } }
    );

    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("Update Username Error:", err);
    return { success: false, error: err.message };
  }
}
