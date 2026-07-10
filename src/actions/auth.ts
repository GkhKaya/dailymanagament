"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";

export async function loginAction(formData: FormData) {
  try {
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const rememberMe = formData.get("rememberMe") === "true";

    if (!email || !password) {
      return { success: false, error: "Email ve şifre zorunludur." };
    }

    // Better Auth ile giriş yap
    const response = await auth.api.signInEmail({
      body: {
        email,
        password,
        rememberMe,
      },
      headers: await headers(),
    });

    if (response?.user) {
      return { success: true };
    }

    return { success: false, error: "Giriş başarısız oldu." };
  } catch (error: any) {
    console.error("Login Error:", error);
    // better-auth throws an error for invalid credentials
    return { success: false, error: error.message || "Giriş yapılırken bir hata oluştu." };
  }
}

export async function registerAction(formData: FormData) {
  try {
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const name = formData.get("name")?.toString();

    if (!email || !password || !name) {
      return { success: false, error: "Tüm alanları doldurmak zorunludur." };
    }

    const response = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
      headers: await headers(),
    });

    if (response?.user) {
      try {
        await connectDB();
        const defaultCats = [
          { user_id: response.user.id, name: 'Market', type: 'expense', icon: 'cart', color: '#ef4444', is_default: false },
          { user_id: response.user.id, name: 'Ulaşım', type: 'expense', icon: 'car', color: '#f59e0b', is_default: false },
          { user_id: response.user.id, name: 'Eğlence', type: 'expense', icon: 'film', color: '#8b5cf6', is_default: false },
          { user_id: response.user.id, name: 'Kafe/Restoran', type: 'expense', icon: 'coffee', color: '#f43f5e', is_default: false },
          { user_id: response.user.id, name: 'Faturalar', type: 'expense', icon: 'zap', color: '#0ea5e9', is_default: false },
          { user_id: response.user.id, name: 'Ev/Kira', type: 'expense', icon: 'home', color: '#10b981', is_default: false },
          { user_id: response.user.id, name: 'Sağlık', type: 'expense', icon: 'heart', color: '#ec4899', is_default: false },
          { user_id: response.user.id, name: 'Maaş', type: 'income', icon: 'briefcase', color: '#22c55e', is_default: false },
          { user_id: response.user.id, name: 'Yatırım Getirisi', type: 'income', icon: 'trending', color: '#3b82f6', is_default: false },
          { user_id: response.user.id, name: 'Diğer (Gelir)', type: 'income', icon: 'gift', color: '#14b8a6', is_default: false },
        ];
        await Category.insertMany(defaultCats);
      } catch (err) {
        console.error("Failed to seed default categories for new user:", err);
      }
      return { success: true };
    }

    return { success: false, error: "Kayıt başarısız oldu." };
  } catch (error: any) {
    console.error("Register Error:", error);
    return { success: false, error: error.message || "Kayıt olurken bir hata oluştu." };
  }
}

export async function logoutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });
  return { success: true };
}

export async function forgotPasswordAction(formData: FormData) {
  try {
    const email = formData.get("email")?.toString();

    if (!email) {
      return { success: false, error: "Email zorunludur." };
    }

    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: "/reset-password",
      },
      headers: await headers(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return { success: false, error: error.message || "Bir hata oluştu." };
  }
}

export async function resetPasswordAction(formData: FormData) {
  try {
    const newPassword = formData.get("newPassword")?.toString();
    const token = formData.get("token")?.toString();

    if (!newPassword || !token) {
      return { success: false, error: "Şifre ve token zorunludur." };
    }

    await auth.api.resetPassword({
      body: {
        newPassword,
        token,
      },
      headers: await headers(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return { success: false, error: error.message || "Şifre sıfırlanırken bir hata oluştu." };
  }
}
