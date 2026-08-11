import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FoodCache } from '@/models/FoodCache';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const OPENROUTER_MODEL = 'openrouter/free';
const REQUEST_TIMEOUT_MS = 12_000;

type UnitType = 'gram' | 'adet' | 'kase' | 'bardak' | 'tabak' | 'çay kaşığı' | 'tatlı kaşığı' | 'çorba kaşığı' | 'yemek kaşığı';
type Provider = 'gemini' | 'openrouter';

interface NutritionResult {
  food_name: string;
  food_name_en: string;
  unit_type: UnitType;
  per_unit: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    sugar_g: number;
    fiber_g: number;
  };
  calculated: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    sugar_g: number;
  };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function parseJsonResponse(text: string): Record<string, unknown> {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }
  return JSON.parse(cleaned) as Record<string, unknown>;
}

function calculateNutrition(perUnit: NutritionResult['per_unit'], amount: number): NutritionResult['calculated'] {
  return {
    calories: Math.round(perUnit.calories * amount),
    protein_g: Math.round(perUnit.protein_g * amount * 10) / 10,
    carbs_g: Math.round(perUnit.carbs_g * amount * 10) / 10,
    fat_g: Math.round(perUnit.fat_g * amount * 10) / 10,
    sugar_g: Math.round(perUnit.sugar_g * amount * 10) / 10
  };
}

function buildResult(payload: Record<string, unknown>, foodName: string, amount: number, unit: UnitType): NutritionResult {
  const perUnit = {
    calories: normalizeNumber(payload.per_unit_calories),
    protein_g: normalizeNumber(payload.per_unit_protein_g),
    carbs_g: normalizeNumber(payload.per_unit_carbs_g),
    fat_g: normalizeNumber(payload.per_unit_fat_g),
    sugar_g: normalizeNumber(payload.per_unit_sugar_g),
    fiber_g: normalizeNumber(payload.per_unit_fiber_g)
  };

  return {
    food_name: typeof payload.food_name_tr === 'string' && payload.food_name_tr.trim() ? payload.food_name_tr.trim() : foodName,
    food_name_en: typeof payload.food_name_en === 'string' && payload.food_name_en.trim() ? payload.food_name_en.trim() : foodName,
    unit_type: unit,
    per_unit: perUnit,
    calculated: calculateNutrition(perUnit, amount)
  };
}

function foodSchema(unit: UnitType) {
  return {
    type: Type.OBJECT,
    properties: {
      food_name_tr: { type: Type.STRING },
      food_name_en: { type: Type.STRING },
      per_unit_calories: { type: Type.NUMBER, minimum: 0 },
      per_unit_protein_g: { type: Type.NUMBER, minimum: 0 },
      per_unit_carbs_g: { type: Type.NUMBER, minimum: 0 },
      per_unit_fat_g: { type: Type.NUMBER, minimum: 0 },
      per_unit_sugar_g: { type: Type.NUMBER, minimum: 0 },
      per_unit_fiber_g: { type: Type.NUMBER, minimum: 0 }
    },
    required: [
      'food_name_tr',
      'food_name_en',
      'per_unit_calories',
      'per_unit_protein_g',
      'per_unit_carbs_g',
      'per_unit_fat_g',
      'per_unit_sugar_g',
      'per_unit_fiber_g'
    ],
    propertyOrdering: [
      'food_name_tr',
      'food_name_en',
      'per_unit_calories',
      'per_unit_protein_g',
      'per_unit_carbs_g',
      'per_unit_fat_g',
      'per_unit_sugar_g',
      'per_unit_fiber_g'
    ],
    description: unit === 'gram' ? 'All nutrition values must be per 1 gram.' : `All nutrition values must be per 1 ${unit}.`
  };
}

function foodPrompt(foodName: string, unit: UnitType) {
  const basis = unit === 'gram' ? '1 gram' : `1 ${unit} (ortalama porsiyon)`;
  return `Sen bir beslenme uzmanısın. Aşağıdaki Türkçe besin için USDA, TÜBİTAK veya güvenilir beslenme veri tabanlarına dayalı doğru beslenme değerlerini üret.
Besin adı: "${foodName}"
Birim: Değerler ${basis} için olmalı.
Önemli kurallar:
- Tüm sayısal değerler 0 veya daha büyük olmalı (negatif değer yasak)
- Türk mutfağına özgü yemekler için pişmiş/hazır hali baz al
- Çorba, pilav, yemek gibi ürünler için pişmiş ağırlık baz al
- Marka belirsizse genel/ev yapımı değerini kullan
- Toplam şeker değerini per_unit_sugar_g alanına yaz; ilave şeker değil, toplam şeker olmalı
- food_name_tr alanına en yaygın Türkçe adı yaz
- food_name_en alanına İngilizce karşılığını yaz`;
}

async function queryGemini(foodName: string, amount: number, unit: UnitType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY tanımlı değil');

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: foodPrompt(foodName, unit),
    config: {
      responseMimeType: 'application/json',
      responseSchema: foodSchema(unit),
      temperature: 0.1
    }
  });

  if (!response.text) throw new Error('Gemini boş yanıt döndürdü');
  return buildResult(parseJsonResponse(response.text), foodName, amount, unit);
}

async function queryOpenRouter(foodName: string, amount: number, unit: UnitType) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY tanımlı değil');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005',
        'X-Title': 'DailyManagement',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: 'user', content: `${foodPrompt(foodName, unit)}\n${JSON.stringify(foodSchema(unit))}` }],
        response_format: { type: 'json_object' },
        temperature: 0.1
      })
    });
    if (!response.ok) throw new Error(`OpenRouter API hatası: ${response.status}`);

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('OpenRouter boş yanıt döndürdü');
    return buildResult(parseJsonResponse(text), foodName, amount, unit);
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { food_name?: string; amount?: number; unit?: UnitType };
    const foodName = body.food_name?.trim();
    const amount = Number(body.amount);
    const unit = body.unit;

    if (!foodName || foodName.length > 120 || !Number.isFinite(amount) || amount <= 0 || amount > 10_000 || !['gram', 'adet', 'kase', 'bardak', 'tabak', 'çay kaşığı', 'tatlı kaşığı', 'çorba kaşığı', 'yemek kaşığı'].includes(unit as string)) {
      return NextResponse.json({ error: 'Geçerli yemek adı, miktar ve birim gerekli.' }, { status: 400 });
    }

    await connectDB();
    const exactName = escapeRegex(foodName);
    const existing = await FoodCache.findOne({
      $or: [
        { food_name: { $regex: `^${exactName}$`, $options: 'i' } },
        { food_name_en: { $regex: `^${exactName}$`, $options: 'i' } }
      ],
      unit_type: unit
    }).lean();

    if (existing) {
      const perUnit = {
        calories: existing.per_unit.calories,
        protein_g: existing.per_unit.protein_g,
        carbs_g: existing.per_unit.carbs_g,
        fat_g: existing.per_unit.fat_g,
        sugar_g: existing.per_unit.sugar_g || 0,
        fiber_g: existing.per_unit.fiber_g || 0
      };
      return NextResponse.json({
        success: true,
        food_name: existing.food_name,
        food_name_en: existing.food_name_en || foodName,
        unit_type: existing.unit_type,
        per_unit: perUnit,
        amount,
        calculated: calculateNutrition(perUnit, amount),
        source: 'db',
        provider: existing.ai_provider || null,
        nutrition_basis: existing.unit_type === 'gram' ? 'per_gram' : 'per_unit',
        warning: existing.ai_provider ? 'AI tahmini cache kaydı. Değerleri kontrol edin.' : null
      });
    }

    let result: NutritionResult;
    let provider: Provider;
    try {
      result = await queryGemini(foodName, amount, unit as UnitType);
      provider = 'gemini';
    } catch (geminiError) {
      if (!process.env.OPENROUTER_API_KEY) throw geminiError;
      try {
        result = await queryOpenRouter(foodName, amount, unit as UnitType);
        provider = 'openrouter';
      } catch (openRouterError) {
        const geminiMessage = geminiError instanceof Error ? geminiError.message : 'Gemini kullanılamadı.';
        const openRouterMessage = openRouterError instanceof Error ? openRouterError.message : 'OpenRouter kullanılamadı.';
        throw new Error(`AI sağlayıcıları çalışmadı. Gemini: ${geminiMessage} OpenRouter: ${openRouterMessage}`);
      }
    }

    await FoodCache.updateOne(
      { food_name: result.food_name, brand_name: null },
      {
        $set: {
          food_name_en: result.food_name_en,
          unit_type: result.unit_type,
          per_unit: result.per_unit,
          source: 'gemini',
          ai_provider: provider,
          nutrition_basis: unit === 'gram' ? 'per_gram' : 'per_unit',
          generated_at: new Date(),
          search_tags: [foodName.toLocaleLowerCase('tr-TR')]
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      ...result,
      amount,
      source: 'ai',
      provider,
      nutrition_basis: unit === 'gram' ? 'per_gram' : 'per_unit',
      warning: 'AI tahmini. Öğüne eklemeden önce değerleri kontrol edin.'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Besin değeri alınamadı.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
