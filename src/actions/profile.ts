"use server";

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { User } from "@/models/User";

async function getSession() {
  return await auth.api.getSession({
    headers: await headers()
  });
}

export async function updateWeightAction(data: { currentWeight?: number; targetWeight?: number; targetDate?: string }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();
    const userId = session.user.id;
    
    const updateFields: any = {};
    if (data.currentWeight !== undefined) updateFields.current_weight_kg = data.currentWeight;
    if (data.targetWeight !== undefined) updateFields.target_weight_kg = data.targetWeight;
    if (data.targetDate) updateFields.target_weight_date = new Date(data.targetDate);

    if (Object.keys(updateFields).length > 0) {
      await User.updateOne(
        { _id: userId },
        { $set: updateFields }
      );
    }
    
    revalidatePath('/', 'layout');
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
    
    revalidatePath('/', 'layout');
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
    const existing = await User.findOne({ name: newUsername });
    if (existing && existing._id.toString() !== userId) {
      return { success: false, error: "Bu kullanıcı adı zaten alınmış." };
    }

    const response = await auth.api.updateUser({
      body: { name: newUsername },
      headers: await headers()
    });

    if (!response || !response.status) {
      return { success: false, error: "Kullanıcı adı güncellenirken bir hata oluştu." };
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("Update Username Error:", err);
    return { success: false, error: err.message };
  }
}

export async function updateEmailAction(newEmail: string) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    await connectDB();
    const userId = session.user.id;
    
    // Check uniqueness
    const existing = await User.findOne({ email: newEmail });
    if (existing && existing._id.toString() !== userId) {
      return { success: false, error: "Bu e-posta adresi zaten kullanımda." };
    }

    // Update email in database
    await User.updateOne(
      { _id: userId },
      { $set: { email: newEmail } }
    );

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("updateEmailAction error:", err);
    return { success: false, error: err.message };
  }
}

export async function updatePasswordAction(currentPassword: string, newPassword: string) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Use better-auth to change password
    const response = await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword
      },
      headers: await headers()
    });

    if (!response || !response.user) {
      return { success: false, error: "Şifre güncellenirken bir hata oluştu." };
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("updatePasswordAction error:", err);
    return { success: false, error: err.message };
  }
}
