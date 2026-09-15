"use server";

import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { WorkoutNote } from "@/models/WorkoutNote";

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export interface WorkoutNoteHeaderDTO {
  id: string;
  date: string;
  title?: string;
  excerpt: string;
  updated_at: string;
}

export interface WorkoutNoteDetailDTO {
  id: string;
  date: string;
  title?: string;
  content: string;
  updated_at: string;
}

/**
 * Kullanıcının not aldığı tarihleri ve kısa önizlemelerini listeler.
 * NOT: Bu fonksiyon sadece kullanıcı 'Notlar' sekmesini açtığında çağrılır (Lazy load).
 */
export async function getWorkoutNoteHeadersAction(): Promise<{
  success: boolean;
  notes?: WorkoutNoteHeaderDTO[];
  error?: string;
}> {
  try {
    await connectDB();
    const userId = await getUserId();

    const rawNotes = await WorkoutNote.find({ user_id: userId })
      .select("date title content updated_at")
      .sort({ date: -1 })
      .limit(100)
      .lean();

    const notes: WorkoutNoteHeaderDTO[] = rawNotes.map((n: any) => {
      const rawContent = n.content || "";
      const excerpt = rawContent.length > 80 ? rawContent.slice(0, 80) + "..." : rawContent;
      return {
        id: n._id ? n._id.toString() : n.date,
        date: n.date,
        title: n.title || "",
        excerpt,
        updated_at: n.updated_at ? new Date(n.updated_at).toISOString() : new Date().toISOString()
      };
    });

    return { success: true, notes };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("getWorkoutNoteHeadersAction error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Belirli bir güne ait detaylı not içeriğini getirir.
 * "basınca o günün notu açılsın ben basmadan veriyi çekmesin" kuralına göre
 * kullanıcı geçmiş bir günün toggle'ına bastığında talep doğrultusunda çekilir.
 */
export async function getWorkoutNoteDetailAction(date: string): Promise<{
  success: boolean;
  note?: WorkoutNoteDetailDTO | null;
  error?: string;
}> {
  try {
    await connectDB();
    const userId = await getUserId();

    const cleanDate = date.trim();
    const rawNote = await WorkoutNote.findOne({ user_id: userId, date: cleanDate }).lean();

    if (!rawNote) {
      return { success: true, note: null };
    }

    const note: WorkoutNoteDetailDTO = {
      id: (rawNote as any)._id.toString(),
      date: (rawNote as any).date,
      title: (rawNote as any).title || "",
      content: (rawNote as any).content || "",
      updated_at: (rawNote as any).updated_at
        ? new Date((rawNote as any).updated_at).toISOString()
        : new Date().toISOString()
    };

    return { success: true, note };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("getWorkoutNoteDetailAction error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Seçilen güne ait antrenman notunu kaydeder veya günceller (Upsert).
 */
export async function saveWorkoutNoteAction(data: {
  date: string;
  title?: string;
  content: string;
}): Promise<{
  success: boolean;
  note?: WorkoutNoteDetailDTO;
  error?: string;
}> {
  try {
    await connectDB();
    const userId = await getUserId();

    const cleanDate = data.date ? data.date.trim() : new Date().toISOString().split("T")[0];
    const cleanContent = data.content ? data.content.trim() : "";
    const cleanTitle = data.title ? data.title.trim() : "";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return { success: false, error: "Geçersiz tarih formatı (YYYY-AA-GG olmalı)." };
    }

    if (!cleanContent) {
      return { success: false, error: "Not içeriği boş olamaz." };
    }

    const updated = await WorkoutNote.findOneAndUpdate(
      { user_id: userId, date: cleanDate },
      {
        $set: {
          title: cleanTitle,
          content: cleanContent,
          updated_at: new Date()
        },
        $setOnInsert: {
          created_at: new Date()
        }
      },
      { upsert: true, new: true }
    ).lean();

    const note: WorkoutNoteDetailDTO = {
      id: (updated as any)._id.toString(),
      date: (updated as any).date,
      title: (updated as any).title || "",
      content: (updated as any).content || "",
      updated_at: (updated as any).updated_at
        ? new Date((updated as any).updated_at).toISOString()
        : new Date().toISOString()
    };

    return { success: true, note };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("saveWorkoutNoteAction error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Belirli bir güne ait antrenman notunu siler.
 */
export async function deleteWorkoutNoteAction(date: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await connectDB();
    const userId = await getUserId();

    const cleanDate = date.trim();
    await WorkoutNote.deleteOne({ user_id: userId, date: cleanDate });

    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("deleteWorkoutNoteAction error:", err);
    return { success: false, error: err.message };
  }
}
