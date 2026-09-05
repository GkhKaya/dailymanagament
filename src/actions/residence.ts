"use server";

import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import { User } from "@/models/User";

export interface UserResidenceSettings {
  country: string;
  is_abroad: boolean;
  language: 'tr' | 'en';
  onboarding_residence_completed: boolean;
  currency?: string;
}

export async function getUserResidenceAction(): Promise<{ success: boolean; settings?: UserResidenceSettings; error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
    if (!session?.user) {
      return { success: false, error: "Oturum bulunamadı." };
    }

    await connectDB();
    const user = await User.findById(session.user.id).lean();
    if (!user) {
      return { success: false, error: "Kullanıcı bulunamadı." };
    }

    const s = user.settings || {};
    return {
      success: true,
      settings: {
        country: s.country || 'TR',
        is_abroad: Boolean(s.is_abroad),
        language: s.language === 'en' ? 'en' : 'tr',
        onboarding_residence_completed: Boolean(s.onboarding_residence_completed),
        currency: s.currency || 'TRY'
      }
    };
  } catch (error: any) {
    console.error("getUserResidenceAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function saveUserResidenceAction(payload: {
  country: string;
  is_abroad: boolean;
  language: 'tr' | 'en';
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
    if (!session?.user) {
      return { success: false, error: "Oturum bulunamadı." };
    }

    const { country, is_abroad, language } = payload;

    // Yurt dışı ise varsayılan para birimi ve dil kuralları
    const cleanLang = is_abroad ? 'en' : (language === 'en' ? 'en' : 'tr');
    const cleanCountry = country?.trim() || (is_abroad ? 'OTHER' : 'TR');

    await connectDB();
    const user = await User.findById(session.user.id).lean();
    if (!user) {
      return { success: false, error: "Kullanıcı bulunamadı." };
    }

    const updates: Record<string, any> = {
      'settings.country': cleanCountry,
      'settings.is_abroad': is_abroad,
      'settings.language': cleanLang,
      'settings.onboarding_residence_completed': true,
    };

    // Yurt dışı kullanıcılar için para birimi TRY ise USD/EUR'a çevrilebilir veya mevcut korunabilir
    if (is_abroad && (!user.settings?.currency || user.settings?.currency === 'TRY')) {
      updates['settings.currency'] = ['DE', 'FR', 'NL', 'IT', 'ES', 'AT', 'BE'].includes(cleanCountry) ? 'EUR' : 'USD';
    }

    await User.updateOne({ _id: session.user.id }, { $set: updates });

    // Kategorileri kullanıcının seçtiği dile göre senkronize et
    try {
      const { Category } = await import('@/models/Category');
      const { CATEGORY_NAME_MAP_TR_TO_EN, CATEGORY_NAME_MAP_EN_TO_TR } = await import('@/lib/category-helpers');
      const userCategories = await Category.find({ user_id: session.user.id });
      
      if (userCategories.length > 0) {
        if (is_abroad || cleanLang === 'en') {
          for (const cat of userCategories) {
            const enName = CATEGORY_NAME_MAP_TR_TO_EN[cat.name];
            if (enName) {
              await Category.updateOne({ _id: cat._id }, { $set: { name: enName } });
            }
          }
        } else {
          for (const cat of userCategories) {
            const trName = CATEGORY_NAME_MAP_EN_TO_TR[cat.name];
            if (trName) {
              await Category.updateOne({ _id: cat._id }, { $set: { name: trName } });
            }
          }
        }
      } else {
        // Henüz kategori yoksa dile uygun kategorileri oluştur
        const defaultCats = (is_abroad || cleanLang === 'en') ? [
          { user_id: session.user.id, name: 'Groceries', type: 'expense', icon: 'cart', color: '#ef4444', is_default: false },
          { user_id: session.user.id, name: 'Transportation', type: 'expense', icon: 'car', color: '#f59e0b', is_default: false },
          { user_id: session.user.id, name: 'Entertainment', type: 'expense', icon: 'film', color: '#8b5cf6', is_default: false },
          { user_id: session.user.id, name: 'Dining Out', type: 'expense', icon: 'coffee', color: '#f43f5e', is_default: false },
          { user_id: session.user.id, name: 'Bills & Utilities', type: 'expense', icon: 'zap', color: '#0ea5e9', is_default: false },
          { user_id: session.user.id, name: 'Rent & Housing', type: 'expense', icon: 'home', color: '#10b981', is_default: false },
          { user_id: session.user.id, name: 'Healthcare', type: 'expense', icon: 'heart', color: '#ec4899', is_default: false },
          { user_id: session.user.id, name: 'Salary', type: 'income', icon: 'briefcase', color: '#22c55e', is_default: false },
          { user_id: session.user.id, name: 'Investments', type: 'income', icon: 'trending', color: '#3b82f6', is_default: false },
          { user_id: session.user.id, name: 'Other Income', type: 'income', icon: 'gift', color: '#14b8a6', is_default: false },
        ] : [
          { user_id: session.user.id, name: 'Market', type: 'expense', icon: 'cart', color: '#ef4444', is_default: false },
          { user_id: session.user.id, name: 'Ulaşım', type: 'expense', icon: 'car', color: '#f59e0b', is_default: false },
          { user_id: session.user.id, name: 'Eğlence', type: 'expense', icon: 'film', color: '#8b5cf6', is_default: false },
          { user_id: session.user.id, name: 'Kafe/Restoran', type: 'expense', icon: 'coffee', color: '#f43f5e', is_default: false },
          { user_id: session.user.id, name: 'Faturalar', type: 'expense', icon: 'zap', color: '#0ea5e9', is_default: false },
          { user_id: session.user.id, name: 'Ev/Kira', type: 'expense', icon: 'home', color: '#10b981', is_default: false },
          { user_id: session.user.id, name: 'Sağlık', type: 'expense', icon: 'heart', color: '#ec4899', is_default: false },
          { user_id: session.user.id, name: 'Maaş', type: 'income', icon: 'briefcase', color: '#22c55e', is_default: false },
          { user_id: session.user.id, name: 'Yatırım Getirisi', type: 'income', icon: 'trending', color: '#3b82f6', is_default: false },
          { user_id: session.user.id, name: 'Diğer (Gelir)', type: 'income', icon: 'gift', color: '#14b8a6', is_default: false },
        ];
        await Category.insertMany(defaultCats);
      }
    } catch (catErr) {
      console.error('Kategori senkronizasyon hatası:', catErr);
    }

    // Çerezlere de yazalım
    const cookieStore = await cookies();
    cookieStore.set('NEXT_LOCALE', cleanLang, { maxAge: 60 * 60 * 24 * 365, path: '/' });
    cookieStore.set('USER_COUNTRY', cleanCountry, { maxAge: 60 * 60 * 24 * 365, path: '/' });
    cookieStore.set('IS_ABROAD', is_abroad ? '1' : '0', { maxAge: 60 * 60 * 24 * 365, path: '/' });

    return { success: true };
  } catch (error: any) {
    console.error("saveUserResidenceAction error:", error);
    return { success: false, error: error.message };
  }
}
