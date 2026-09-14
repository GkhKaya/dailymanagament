"use server";

import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { WorkoutRoutine, IWorkoutExercise, IExerciseSet } from "@/models/WorkoutRoutine";
import { createDefaultSets } from "@/lib/workout-utils";

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
      return { success: true, days: [] };
    }

    const days = (routine.days || []).map((day: any) => ({
      id: day._id ? day._id.toString() : "",
      day_name: day.day_name,
      note: day.note || "",
      notes: (day.notes || []).map((n: any) => ({
        id: n._id ? n._id.toString() : "",
        content: n.content,
        created_at: n.created_at ? new Date(n.created_at).toISOString() : new Date().toISOString()
      })),
      exercises: (day.exercises || []).map((ex: any) => {
        const setsCount = Number(ex.sets) || 3;
        let setsDetail = ex.sets_detail;
        if (!setsDetail || setsDetail.length === 0) {
          setsDetail = createDefaultSets(setsCount, Number(ex.weight_kg) || 0, String(ex.reps || "10"));
        } else {
          setsDetail = setsDetail.map((s: any, idx: number) => ({
            set_number: Number(s.set_number) || idx + 1,
            weight_kg: Number(s.weight_kg) || 0,
            reps: String(s.reps || "10"),
            completed: Boolean(s.completed)
          }));
        }

        return {
          id: ex._id ? ex._id.toString() : "",
          name: ex.name,
          sets: setsCount,
          reps: ex.reps || "10",
          weight_kg: ex.weight_kg || 0,
          sets_detail: setsDetail,
          note: ex.note || ""
        };
      })
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
  note?: string;
  exercises: { 
    name: string; 
    sets: number; 
    reps?: string; 
    weight_kg?: number;
    sets_detail?: IExerciseSet[];
    note?: string;
  }[];
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
      .map(e => {
        const setsCount = Math.max(1, Number(e.sets) || 3);
        const weightKg = Number(e.weight_kg) || 0;
        const reps = String(e.reps || "10").trim();
        
        // Prepare or preserve sets_detail
        let setsDetail = e.sets_detail;
        if (!setsDetail || setsDetail.length === 0) {
          setsDetail = createDefaultSets(setsCount, weightKg, reps);
        } else {
          setsDetail = setsDetail.map((s, idx) => ({
            set_number: idx + 1,
            weight_kg: Number(s.weight_kg) || 0,
            reps: String(s.reps || reps),
            completed: Boolean(s.completed)
          }));
        }

        return {
          name: e.name.trim(),
          sets: setsCount,
          reps,
          weight_kg: weightKg,
          sets_detail: setsDetail,
          note: e.note ? String(e.note).trim() : ""
        };
      });

    if (cleanedExercises.length === 0) {
      return { success: false, error: "En az 1 hareket girmelisiniz." };
    }

    const dayPayload = {
      day_name: data.day_name.trim(),
      note: data.note ? data.note.trim() : "",
      exercises: cleanedExercises
    };

    if (data.day_id) {
      // Update existing day
      const dayIndex = routine.days.findIndex((d: any) => d._id && d._id.toString() === data.day_id);
      if (dayIndex !== -1) {
        routine.days[dayIndex].day_name = dayPayload.day_name;
        if (data.note !== undefined) {
          routine.days[dayIndex].note = dayPayload.note;
        }
        routine.days[dayIndex].exercises = cleanedExercises as any;
      } else {
        routine.days.push(dayPayload as any);
      }
    } else {
      // Add new day
      routine.days.push(dayPayload as any);
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

/**
 * Günün notunu doğrudan kaydeder veya günceller
 */
export async function saveWorkoutDayNoteAction(dayId: string, note: string) {
  try {
    await connectDB();
    const userId = await getUserId();

    const routine = await WorkoutRoutine.findOne({ user_id: userId });
    if (!routine) return { success: false, error: "Program bulunamadı." };

    const day = routine.days.find((d: any) => d._id && d._id.toString() === dayId);
    if (!day) return { success: false, error: "Antrenman günü bulunamadı." };

    day.note = note.trim();
    await routine.save();

    return { success: true, note: day.note };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("saveWorkoutDayNoteAction error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * O güne ait yeni bir tarihli not girdisi ekler (Antrenman günlüğü)
 */
export async function addWorkoutDayNoteEntryAction(dayId: string, content: string) {
  try {
    await connectDB();
    const userId = await getUserId();

    if (!content || content.trim() === "") {
      return { success: false, error: "Not boş olamaz." };
    }

    const routine = await WorkoutRoutine.findOne({ user_id: userId });
    if (!routine) return { success: false, error: "Program bulunamadı." };

    const day = routine.days.find((d: any) => d._id && d._id.toString() === dayId);
    if (!day) return { success: false, error: "Antrenman günü bulunamadı." };

    if (!day.notes) day.notes = [];
    day.notes.unshift({
      content: content.trim(),
      created_at: new Date()
    } as any);

    await routine.save();
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("addWorkoutDayNoteEntryAction error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * O güne ait bir not girdisini siler
 */
export async function deleteWorkoutDayNoteEntryAction(dayId: string, noteId: string) {
  try {
    await connectDB();
    const userId = await getUserId();

    const routine = await WorkoutRoutine.findOne({ user_id: userId });
    if (!routine) return { success: false, error: "Program bulunamadı." };

    const day = routine.days.find((d: any) => d._id && d._id.toString() === dayId);
    if (!day) return { success: false, error: "Antrenman günü bulunamadı." };

    if (day.notes) {
      day.notes = day.notes.filter((n: any) => n._id && n._id.toString() !== noteId);
      await routine.save();
    }

    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("deleteWorkoutDayNoteEntryAction error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Belirli bir egzersizin setlerini (kilo, tekrar, tamamlandı) günceller
 */
export async function updateExerciseSetsAction(
  dayId: string,
  exerciseIndex: number,
  setsDetail: IExerciseSet[]
) {
  try {
    await connectDB();
    const userId = await getUserId();

    const routine = await WorkoutRoutine.findOne({ user_id: userId });
    if (!routine) return { success: false, error: "Program bulunamadı." };

    const day = routine.days.find((d: any) => d._id && d._id.toString() === dayId);
    if (!day) return { success: false, error: "Antrenman günü bulunamadı." };

    if (!day.exercises[exerciseIndex]) {
      return { success: false, error: "Egzersiz bulunamadı." };
    }

    const cleanedSets = setsDetail.map((s, idx) => ({
      set_number: idx + 1,
      weight_kg: Number(s.weight_kg) || 0,
      reps: String(s.reps || "10"),
      completed: Boolean(s.completed)
    }));

    day.exercises[exerciseIndex].sets_detail = cleanedSets as any;
    day.exercises[exerciseIndex].sets = cleanedSets.length;
    if (cleanedSets.length > 0) {
      day.exercises[exerciseIndex].weight_kg = cleanedSets[0].weight_kg;
      day.exercises[exerciseIndex].reps = cleanedSets[0].reps;
    }

    await routine.save();
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("updateExerciseSetsAction error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Tek bir setin tamamlanma (tik) durumunu veya kilosunu hızlıca günceller
 */
export async function toggleSetCompletedAction(
  dayId: string,
  exerciseIndex: number,
  setIndex: number
) {
  try {
    await connectDB();
    const userId = await getUserId();

    const routine = await WorkoutRoutine.findOne({ user_id: userId });
    if (!routine) return { success: false, error: "Program bulunamadı." };

    const day = routine.days.find((d: any) => d._id && d._id.toString() === dayId);
    if (!day || !day.exercises[exerciseIndex]) {
      return { success: false, error: "Egzersiz bulunamadı." };
    }

    const ex = day.exercises[exerciseIndex];
    if (!ex.sets_detail || ex.sets_detail.length === 0) {
      ex.sets_detail = createDefaultSets(ex.sets, ex.weight_kg, ex.reps) as any;
    }

    if (ex.sets_detail[setIndex]) {
      ex.sets_detail[setIndex].completed = !ex.sets_detail[setIndex].completed;
      routine.markModified('days');
      await routine.save();
      return { success: true, completed: ex.sets_detail[setIndex].completed };
    }

    return { success: false, error: "Set bulunamadı." };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("toggleSetCompletedAction error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Antrenman günündeki tüm tamamlanan setleri sıfırlar (yeni gün antrenmanı için)
 */
export async function resetWorkoutDaySetsAction(dayId: string) {
  try {
    await connectDB();
    const userId = await getUserId();

    const routine = await WorkoutRoutine.findOne({ user_id: userId });
    if (!routine) return { success: false, error: "Program bulunamadı." };

    const day = routine.days.find((d: any) => d._id && d._id.toString() === dayId);
    if (!day) return { success: false, error: "Antrenman günü bulunamadı." };

    for (const ex of day.exercises) {
      if (ex.sets_detail) {
        for (const s of ex.sets_detail) {
          s.completed = false;
        }
      }
    }

    routine.markModified('days');
    await routine.save();
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("resetWorkoutDaySetsAction error:", err);
    return { success: false, error: err.message };
  }
}

export async function importWorkoutRoutineAction(days: any[]) {
  try {
    await connectDB();
    const userId = await getUserId();

    if (!Array.isArray(days)) {
      return { success: false, error: "Geçersiz format. Lütfen örnek şablonu kullanın." };
    }

    const cleanedDays = days.map((day: any) => {
      const dayName = day.day_name || day.name || "İsimsiz Gün";
      const note = day.note ? String(day.note).trim() : "";
      const exercises = Array.isArray(day.exercises) ? day.exercises.map((e: any) => {
        const setsCount = Number(e.sets) || 3;
        const weightKg = Number(e.weight_kg) || 0;
        const reps = String(e.reps || "10").trim();
        let setsDetail = e.sets_detail;
        if (!Array.isArray(setsDetail) || setsDetail.length === 0) {
          setsDetail = createDefaultSets(setsCount, weightKg, reps);
        } else {
          setsDetail = setsDetail.map((s, idx) => ({
            set_number: idx + 1,
            weight_kg: Number(s.weight_kg) || 0,
            reps: String(s.reps || reps),
            completed: Boolean(s.completed)
          }));
        }

        return {
          name: String(e.name || "").trim(),
          sets: setsCount,
          reps,
          weight_kg: weightKg,
          sets_detail: setsDetail,
          note: e.note ? String(e.note).trim() : ""
        };
      }).filter((e: any) => e.name !== "") : [];
      return { day_name: dayName, note, exercises };
    }).filter((day: any) => day.exercises.length > 0);

    if (cleanedDays.length === 0) {
      return { success: false, error: "İçe aktarılacak geçerli hareket bulunamadı." };
    }

    let routine = await WorkoutRoutine.findOne({ user_id: userId });
    if (!routine) {
      routine = new WorkoutRoutine({ user_id: userId, days: cleanedDays });
    } else {
      routine.days = cleanedDays as any;
    }

    await routine.save();
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("importWorkoutRoutineAction error:", err);
    return { success: false, error: err.message };
  }
}
