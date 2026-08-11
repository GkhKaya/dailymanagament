"use server";

import { GoogleGenAI, Type } from '@google/genai';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { Account } from '@/models/Account';
import { Category } from '@/models/Category';
import { addTransactionAction } from '@/actions/finance';
import { addMealsAction } from '@/actions/health';

type TransactionType = 'expense' | 'income';
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type NutritionBasis = 'per_gram' | 'per_unit';

interface FinanceDraft {
  transaction_type: TransactionType;
  amount: number;
  description: string;
  date: string;
  account_id: string | null;
  category_id: string | null;
  accounts: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}

interface AssistantFood {
  name: string;
  quantity: number;
  unit: string;
  nutrition_basis: NutritionBasis;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Unauthorized');
  return session.user.id;
}

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase('tr-TR');
}

function matchByKeyword<T extends { name: string }>(items: T[], keyword: string | undefined) {
  if (!keyword?.trim()) return null;
  const normalized = normalizeText(keyword);
  const exact = items.find((item) => normalizeText(item.name) === normalized);
  if (exact) return exact;
  const matches = items.filter((item) => normalizeText(item.name).includes(normalized) || normalized.includes(normalizeText(item.name)));
  return matches.length === 1 ? matches[0] : null;
}

function validNumber(value: unknown, max: number) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 && number <= max ? number : null;
}

function voiceSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ['finance', 'health', 'unknown'] },
      finance_data: {
        type: Type.OBJECT,
        nullable: true,
        properties: {
          transaction_type: { type: Type.STRING, enum: ['expense', 'income'] },
          amount: { type: Type.NUMBER, minimum: 0 },
          account_keyword: { type: Type.STRING },
          category_keyword: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ['transaction_type', 'amount', 'account_keyword', 'category_keyword', 'description']
      },
      health_data: {
        type: Type.OBJECT,
        nullable: true,
        properties: {
          meal_type: { type: Type.STRING, enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
          foods: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                quantity: { type: Type.NUMBER, minimum: 0 },
                unit: { type: Type.STRING },
                nutrition_basis: { type: Type.STRING, enum: ['per_gram', 'per_unit'] },
                calories: { type: Type.NUMBER, minimum: 0 },
                protein_g: { type: Type.NUMBER, minimum: 0 },
                carbs_g: { type: Type.NUMBER, minimum: 0 },
                fat_g: { type: Type.NUMBER, minimum: 0 }
              },
              required: ['name', 'quantity', 'unit', 'nutrition_basis', 'calories', 'protein_g', 'carbs_g', 'fat_g']
            }
          }
        },
        required: ['meal_type', 'foods']
      }
    },
    required: ['type']
  };
}

async function parseVoiceCommand(text: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY tanımlı değil.');
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: `Türkçe kişisel finans ve yemek günlüğü komutunu JSON'a çevir.
Finans için yalnız söylenen bilgileri çıkar. Bilinmeyen hesabı veya kategoriyi uydurma.
Yemek için gram söylendiyse quantity gerçek gram sayısı, nutrition_basis per_gram, nutrition değerleri 1 gram için olmalı.
Adet, dilim, porsiyon veya bardak için nutrition_basis per_unit, değerler 1 birim için olmalı.
Kullanıcı komutu: "${text}"`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: voiceSchema(),
      temperature: 0.1
    }
  });
  if (!response.text) throw new Error('Yapay zeka boş yanıt döndürdü.');
  return JSON.parse(response.text) as Record<string, unknown>;
}

export async function processAssistantVoiceAction(text: string, currentDateStr?: string) {
  try {
    if (!text.trim() || text.length > 500) return { success: false, error: 'Komut boş veya fazla uzun.' };

    const userId = await getUserId();
    await connectDB();
    const parsed = await parseVoiceCommand(text);

    if (parsed.type === 'finance') {
      const finance = parsed.finance_data as Record<string, unknown> | undefined;
      if (!finance) return { success: false, error: 'Finans bilgisi anlaşılmadı.' };
      const transactionType = finance?.transaction_type;
      const amount = validNumber(finance?.amount, 1_000_000);
      if ((transactionType !== 'income' && transactionType !== 'expense') || !amount) {
        return { success: false, error: 'Tutar veya işlem türü anlaşılmadı.' };
      }

      const [accounts, categories] = await Promise.all([
        Account.find({ user_id: userId, is_active: true }).lean(),
        Category.find({ user_id: userId, type: transactionType }).lean()
      ]);
      const matchedAccount = matchByKeyword(accounts, typeof finance.account_keyword === 'string' ? finance.account_keyword : '');
      const matchedCategory = matchByKeyword(categories, typeof finance.category_keyword === 'string' ? finance.category_keyword : '') || categories.find((category) => category.is_default) || null;

      const draft: FinanceDraft = {
        transaction_type: transactionType,
        amount,
        description: typeof finance.description === 'string' ? finance.description.trim().slice(0, 120) : '',
        date: currentDateStr || new Date().toISOString(),
        account_id: matchedAccount?._id.toString() || null,
        category_id: matchedCategory?._id.toString() || null,
        accounts: accounts.map((account) => ({ id: account._id.toString(), name: account.name })),
        categories: categories.map((category) => ({ id: category._id.toString(), name: category.name }))
      };
      return { success: true, action: 'finance_preview' as const, draft };
    }

    if (parsed.type === 'health') {
      const health = parsed.health_data as { meal_type?: MealType; foods?: AssistantFood[] } | undefined;
      if (!health || !['breakfast', 'lunch', 'dinner', 'snack'].includes(health.meal_type || '') || !Array.isArray(health.foods) || health.foods.length === 0) {
        return { success: false, error: 'Öğün bilgisi anlaşılmadı.' };
      }

      const foods = health.foods.map((food) => {
        const quantity = validNumber(food.quantity, 10_000);
        const calories = validNumber(food.calories, 10_000);
        if (!food.name?.trim() || !quantity || calories === null || !['per_gram', 'per_unit'].includes(food.nutrition_basis)) throw new Error('Öğün içindeki besin bilgisi geçersiz.');
        const multiplier = quantity;
        return {
          food_name: food.name.trim().slice(0, 120),
          serving_description: `${quantity} ${food.unit || (food.nutrition_basis === 'per_gram' ? 'gram' : 'adet')}`,
          quantity,
          unit_type: food.nutrition_basis === 'per_gram' ? 'gram' : 'adet',
          calories: Math.round(calories * multiplier),
          protein_g: Math.round(Math.max(0, Number(food.protein_g) || 0) * multiplier * 10) / 10,
          carbs_g: Math.round(Math.max(0, Number(food.carbs_g) || 0) * multiplier * 10) / 10,
          fat_g: Math.round(Math.max(0, Number(food.fat_g) || 0) * multiplier * 10) / 10
        };
      });

      const mealResult = await addMealsAction(foods.map((food) => ({ date: currentDateStr || new Date().toISOString(), type: health.meal_type!, ...food })));
      if (!mealResult.success) return { success: false, error: mealResult.error || 'Öğün kaydı tamamlanamadı. Tekrar deneyin.' };
      return { success: true, action: 'health_saved' as const, message: `Öğüne eklendi: ${foods.map((food) => food.serving_description + ' ' + food.food_name).join(', ')}` };
    }

    return { success: false, error: 'Komut anlaşılmadı. Finans veya yenilen besini açıkça söyleyin.' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Yapay zeka komutu işleyemedi.';
    return { success: false, error: message };
  }
}

export async function confirmAssistantFinanceAction(draft: Pick<FinanceDraft, 'transaction_type' | 'amount' | 'description' | 'date' | 'account_id' | 'category_id'>) {
  try {
    const userId = await getUserId();
    await connectDB();
    const amount = validNumber(draft.amount, 1_000_000);
    if (!amount || !draft.account_id || !draft.category_id || (draft.transaction_type !== 'income' && draft.transaction_type !== 'expense')) {
      return { success: false, error: 'Tutar, hesap ve kategori seçilmelidir.' };
    }

    const [account, category] = await Promise.all([
      Account.findOne({ _id: draft.account_id, user_id: userId, is_active: true }).lean(),
      Category.findOne({ _id: draft.category_id, user_id: userId, type: draft.transaction_type }).lean()
    ]);
    if (!account || !category) return { success: false, error: 'Seçilen hesap veya kategori geçersiz.' };

    return await addTransactionAction({
      type: draft.transaction_type,
      amount,
      account_id: account._id.toString(),
      category_id: category._id.toString(),
      date: draft.date,
      description: draft.description.trim().slice(0, 120),
      source: 'voice'
    });
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Finans işlemi kaydedilemedi.' };
  }
}
