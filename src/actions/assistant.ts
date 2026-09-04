"use server";

import { GoogleGenAI, Type } from '@google/genai';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { Account } from '@/models/Account';
import { Category } from '@/models/Category';
import { addTransactionAction } from '@/actions/finance';
import { addMealsAction } from '@/actions/health';
import { toUserFacingError } from '@/lib/error-management';
import { enrichAssistantFoodsWithDB } from '@/lib/assistant-db-matcher';

export type {
  TransactionType,
  MealType,
  NutritionBasis,
  FinanceDraft,
  AssistantFoodItem,
  HealthDraft,
  AssistantFood
} from '@/lib/assistant-helpers';

import {
  type MealType,
  type AssistantFood,
  type FinanceDraft,
  type HealthDraft,
  validNumber,
  buildHealthDraftFromFoods,
  validateHealthDraft,
  validateFinanceDraft
} from '@/lib/assistant-helpers';

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
                total_calories: { type: Type.NUMBER, minimum: 0 },
                total_protein_g: { type: Type.NUMBER, minimum: 0 },
                total_carbs_g: { type: Type.NUMBER, minimum: 0 },
                total_fat_g: { type: Type.NUMBER, minimum: 0 }
              },
              required: ['name', 'quantity', 'unit', 'total_calories', 'total_protein_g', 'total_carbs_g', 'total_fat_g']
            }
          }
        },
        required: ['foods']
      }
    },
    required: ['type']
  };
}

async function parseVoiceCommand(text: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY tanımlı değil.');
  const ai = new GoogleGenAI({ apiKey });

  const primaryModel = 'gemini-3.6-flash';
  const fallbackModel = 'gemini-3.1-flash-lite';

  const generateWithModel = async (model: string) => {
    const response = await ai.models.generateContent({
      model,
      contents: `Türkçe kişisel finans ve beslenme komutunu JSON'a dönüştür.

FİNANS KURALLARI:
- Yalnız söylenen bilgileri çıkar. Bilinmeyen hesabı veya kategoriyi uydurma.

BESLENME KURALLARI:
1. Eğer öğün türü (kahvaltı, öğle, akşam, ara öğün) komutta varsa meal_type olarak belirt ('breakfast'|'lunch'|'dinner'|'snack'). Belirtilmemişse yiyecek türüne göre en uygun öğünü seç veya null bırak.
2. Türkçe ölçü birimlerini eksiksiz ve doğru yorumla:
   - "kilogram", "kilo", "kg" dendiğinde grama çevir (örn: 1 kilo = 1000 gram, yarım kilo = 500 gram), unit="gram".
   - "gram", "gr", "g" dendiğinde quantity=söylenen gram, unit="gram".
   - "adet", "tane", "yumurta", "elma" dendiğinde quantity=adet, unit="adet".
   - "dilim" dendiğinde quantity=dilim, unit="dilim".
   - "porsiyon", "tabak" dendiğinde quantity=porsiyon, unit="porsiyon".
   - "bardak", "su bardağı" dendiğinde quantity=bardak, unit="bardak".
   - "çay bardağı" dendiğinde quantity=çay bardağı, unit="çay bardağı".
   - "kase" dendiğinde quantity=kase, unit="kase".
   - "kaşık", "yemek kaşığı", "tatlı kaşığı", "çay kaşığı" dendiğinde unit olarak bunu yaz.
3. Komutta birden fazla yiyecek varsa hepsini ayrı ayrı foods dizisine ekle.
4. total_calories, total_protein_g, total_carbs_g, total_fat_g alanlarına belirtilen MİKTARIN TAMAMI için toplam besin değerlerini yaz. (Örn: 2 yumurta için ~140 kcal, 100g peynir için ~260 kcal, 2 dilim ekmek için ~130 kcal). Pozitif ve gerçekçi değerler ver.

Kullanıcı komutu: "${text}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: voiceSchema(),
        temperature: 0.1
      }
    });
    if (!response.text) throw new Error('Yapay zeka boş yanıt döndürdü.');
    return JSON.parse(response.text) as Record<string, unknown>;
  };

  try {
    return await generateWithModel(primaryModel);
  } catch (err) {
    console.warn(`[Assistant] ${primaryModel} hatası, ${fallbackModel} deneniyor:`, err);
    return await generateWithModel(fallbackModel);
  }
}


export type ProcessVoiceResult =
  | { success: true; action: 'finance_preview'; draft: FinanceDraft; error?: undefined }
  | { success: true; action: 'health_preview'; draft: HealthDraft; error?: undefined }
  | { success: false; error: string; action?: undefined; draft?: undefined };

export async function processAssistantVoiceAction(text: string, currentDateStr?: string): Promise<ProcessVoiceResult> {
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
      return { success: true, action: 'finance_preview', draft };
    }

    if (parsed.type === 'health') {
      const health = parsed.health_data as { meal_type?: MealType; foods?: AssistantFood[] } | undefined;
      if (!health || !Array.isArray(health.foods) || health.foods.length === 0) {
        return { success: false, error: 'Besin bilgisi anlaşılmadı. Lütfen ne yediğinizi (örn: "2 yumurta ve 100 gram peynir yedim") açıkça söyleyin.' };
      }

      // Önce veritabanımızdaki FoodCache koleksiyonunda var mı diye bakılır
      const enrichedFoods = await enrichAssistantFoodsWithDB(health.foods, userId);
      const draft = buildHealthDraftFromFoods({ ...health, foods: enrichedFoods }, text, currentDateStr);

      return {
        success: true,
        action: 'health_preview',
        draft
      };
    }

    return { success: false, error: 'Komut anlaşılmadı. Finans harcamanızı veya yediğiniz besinleri net bir şekilde ifade edin.' };
  } catch (error: unknown) {
    console.error('[Assistant] processAssistantVoiceAction error:', error);
    return { success: false, error: toUserFacingError(error, 'Yapay zeka asistanı komutu işleyemedi. Lütfen tekrar deneyin.') };
  }
}


export async function confirmAssistantFinanceAction(draft: Pick<FinanceDraft, 'transaction_type' | 'amount' | 'description' | 'date' | 'account_id' | 'category_id'>) {
  try {
    const validation = validateFinanceDraft(draft);
    if (!validation.valid || !validation.amount) {
      return { success: false, error: validation.error || 'Tutar, hesap ve kategori seçilmelidir.' };
    }

    const userId = await getUserId();
    await connectDB();

    const [account, category] = await Promise.all([
      Account.findOne({ _id: draft.account_id, user_id: userId, is_active: true }).lean(),
      Category.findOne({ _id: draft.category_id, user_id: userId, type: draft.transaction_type }).lean()
    ]);
    if (!account || !category) return { success: false, error: 'Seçilen hesap veya kategori geçersiz.' };

    return await addTransactionAction({
      type: draft.transaction_type,
      amount: validation.amount,
      account_id: account._id.toString(),
      category_id: category._id.toString(),
      date: draft.date,
      description: draft.description.trim().slice(0, 120),
      source: 'voice'
    });
  } catch (error: unknown) {
    console.error('[Assistant] confirmAssistantFinanceAction error:', error);
    return { success: false, error: toUserFacingError(error, 'Finans işlemi kaydedilemedi. Lütfen tekrar deneyin.') };
  }
}

export async function confirmAssistantHealthAction(draft: HealthDraft) {
  try {
    const validation = validateHealthDraft(draft);
    if (!validation.valid || !validation.foods) {
      return { success: false, error: validation.error || 'Besin verisi geçersiz.' };
    }

    await getUserId();
    await connectDB();

    const mealResult = await addMealsAction(validation.foods);
    if (!mealResult.success) {
      return { success: false, error: mealResult.error || 'Öğün kaydı tamamlanamadı.' };
    }

    const mealLabel = draft.meal_type === 'breakfast'
      ? 'Kahvaltı'
      : draft.meal_type === 'lunch'
      ? 'Öğle Yemeği'
      : draft.meal_type === 'dinner'
      ? 'Akşam Yemeği'
      : 'Ara Öğün';

    return {
      success: true,
      message: `${draft.foods.length} besin ${mealLabel} öğününe eklendi.`
    };
  } catch (error: unknown) {
    console.error('[Assistant] confirmAssistantHealthAction error:', error);
    return { success: false, error: toUserFacingError(error, 'Besin kaydı sırasında bir hata oluştu. Lütfen tekrar deneyin.') };
  }
}
