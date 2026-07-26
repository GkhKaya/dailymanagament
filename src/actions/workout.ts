"use server";

import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { WorkoutRoutine, IWorkoutExercise } from "@/models/WorkoutRoutine";

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function getWorkoutRoutineAction() {
  try {
    await connectDB();
    const userId = await getUserId();
    
    let routine = await WorkoutRoutine.findOne({ user_id: userId }).lean();
    if (!routine) {
      // Clean JSON DTO
      return { success: true, days: [] };
    }

    const days = (routine.days || []).map((day: any) => ({
      id: day._id ? day._id.toString() : "",
      day_name: day.day_name,
      exercises: (day.exercises || []).map((ex: any) => ({
        id: ex._id ? ex._id.toString() : "",
        name: ex.name,
        sets: ex.sets || 3,
        reps: ex.reps || "10",
        weight_kg: ex.weight_kg || 0
      }))
    }));

    return { success: true, days };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("getWorkoutRoutineAction error:", err);
    return { success: false, error: err.message, days: [] };
  }
}

export async function saveWorkoutDayAction(data: {
  day_id?: string;
  day_name: string;
  exercises: { name: string; sets: number; reps?: string; weight_kg?: number }[];
}) {
  try {
    await connectDB();
    const userId = await getUserId();

    if (!data.day_name || data.day_name.trim() === "") {
      return { success: false, error: "Gün adı boş olamaz." };
    }

    let routine = await WorkoutRoutine.findOne({ user_id: userId });
    if (!routine) {
      routine = new WorkoutRoutine({ user_id: userId, days: [] });
    }

    const cleanedExercises = (data.exercises || [])
      .filter(e => e.name && e.name.trim() !== "")
      .map(e => ({
        name: e.name.trim(),
        sets: Number(e.sets) || 3,
        reps: String(e.reps || "10").trim(),
        weight_kg: Number(e.weight_kg) || 0
      }));

    if (cleanedExercises.length === 0) {
      return { success: false, error: "En az 1 hareket girmelisiniz." };
    }

    if (data.day_id) {
      // Update existing day
      const dayIndex = routine.days.findIndex((d: any) => d._id && d._id.toString() === data.day_id);
      if (dayIndex !== -1) {
        routine.days[dayIndex].day_name = data.day_name.trim();
        routine.days[dayIndex].exercises = cleanedExercises as any;
      } else {
        routine.days.push({
          day_name: data.day_name.trim(),
          exercises: cleanedExercises as any
        });
      }
    } else {
      // Add new day
      routine.days.push({
        day_name: data.day_name.trim(),
        exercises: cleanedExercises as any
      });
    }

    await routine.save();
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("saveWorkoutDayAction error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteWorkoutDayAction(dayId: string) {
  try {
    await connectDB();
    const userId = await getUserId();

    const routine = await WorkoutRoutine.findOne({ user_id: userId });
    if (!routine) return { success: false, error: "Program bulunamadı." };

    routine.days = routine.days.filter((d: any) => d._id && d._id.toString() !== dayId);
    await routine.save();

    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("deleteWorkoutDayAction error:", err);
    return { success: false, error: err.message };
  }
}
