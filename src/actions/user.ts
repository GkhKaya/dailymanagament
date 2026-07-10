"use server";

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
    const userId = await getUserId();

    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection is not established");

    await db.collection("user").updateOne(
      { _id: userId },
      {
        $set: {
          age: data.age,
          weight: data.weight,
          height: data.height,
          gender: data.gender,
          activity_level: data.activity_level,
          goal: data.goal,
          targetCalories: data.targetCalories,
        }
      }
    );

    return { success: true };
  } catch (err: any) {
    console.error("Update User Health Error:", err);
    return { success: false, error: err.message };
  }
}
