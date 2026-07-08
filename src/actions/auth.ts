"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
