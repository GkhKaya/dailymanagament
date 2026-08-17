import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { connectDB } from '@/lib/db';
import { FoodCache } from '@/models/FoodCache';
import { GEMINI_VISION_MODEL, mealPhotoPrompt, mealPhotoSchema } from '@/lib/gemini-vision';

type UnitType = 'gram' | 'adet' | 'kase' | 'bardak' | 'tabak' | 'dilim' | 'yemek kaşığı';

interface AIItem {
  food_name_tr: string;
  food_name_en: string;
  estimated_amount: number;
  unit_type: UnitType;
  description: string;
}

interface AnalyzedItem {
  id: string;
  food_name: string;
  food_name_en: string;
  amount: number;
  unit_type: UnitType;
  description: string;
  matched_in_db: boolean;
  food_cache_id?: string;
  per_unit: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    sugar_g: number;
  };
  calculated: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    sugar_g: number;
  };
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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function calculateNutrition(perUnit: { calories: number; protein_g: number; carbs_g: number; fat_g: number; sugar_g: number }, amount: number) {
  return {
    calories: Math.round(perUnit.calories * amount),
    protein_g: Math.round(perUnit.protein_g * amount * 10) / 10,
    carbs_g: Math.round(perUnit.carbs_g * amount * 10) / 10,
    fat_g: Math.round(perUnit.fat_g * amount * 10) / 10,
    sugar_g: Math.round(perUnit.sugar_g * amount * 10) / 10,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { imageBase64?: string; mimeType?: string; userDirective?: string };
    if (!body.imageBase64) {
      return NextResponse.json({ error: 'Fotoğraf verisi (imageBase64) gerekli.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY tanımlı değil.' }, { status: 500 });
    }

    // Clean base64 string
    let cleanBase64 = body.imageBase64;
    let detectedMimeType = body.mimeType || 'image/jpeg';
    if (cleanBase64.includes(';base64,')) {
      const parts = cleanBase64.split(';base64,');
      const header = parts[0];
      if (header.startsWith('data:')) {
        detectedMimeType = header.replace('data:', '');
      }
      cleanBase64 = parts[1];
    }

    // Prepare prompt with user directive
    let effectivePrompt = mealPhotoPrompt;
    if (body.userDirective && body.userDirective.trim()) {
      const directive = body.userDirective.trim();
      effectivePrompt += `\n\nKULLANICI ÖZEL DİREKTİFİ / NOTU: "${directive}"\nÖNEMLİ DİREKTİF KURALI: Kullanıcının yukarıdaki özel notuna göre malzeme, porsiyon tahmini ve özellikle YAĞ (fat_g) / TEREYAĞI / SOS miktarlarını ayarla.\nÖrnekler:\n- "anne yemeği" veya "ev yemeği" ise: Geleneksel ev yapımı yağ ve lezzet oranını kullan (örn. tavuk sotede ev usulü sıvıyağ/tereyağını daha yüksek hesapla).\n- "restoran yemeği" veya "dışarıda" ise: Restoran tarzı ekstra yağ, krema veya tereyağı kullanımını dikkate al.\n- "az yağlı", "diyet" veya "fit" ise: Yağ miktarını ve kaloriyi düşük tut.\n- "bol tereyağlı" veya "ekstra soslu" ise: İlgili yağı veya sosu ayrıca ekle ve kalorisini artır.`;
    }

    // Initialize Gemini AI
    const ai = new GoogleGenAI({ apiKey });
    
    // Send image to Gemini Vision
    const response = await ai.models.generateContent({
      model: GEMINI_VISION_MODEL,
      contents: [
        {
          inlineData: {
            mimeType: detectedMimeType,
            data: cleanBase64,
          },
        },
        {
          text: effectivePrompt,
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: mealPhotoSchema as any,
        temperature: 0.2,
      },
    });

    if (!response.text) {
      throw new Error('Gemini Vision modelinden yanıt alınamadı.');
    }

    const aiResult = parseJsonResponse(response.text) as {
      meal_name?: string;
      items?: AIItem[];
    };

    const mealName = aiResult.meal_name || 'Görsel Yemek Menüsü';
    const rawItems = Array.isArray(aiResult.items) ? aiResult.items : [];

    if (rawItems.length === 0) {
      return NextResponse.json({ error: 'Fotoğrafta belirgin bir yemek tespit edilemedi.' }, { status: 422 });
    }

    await connectDB();

    const processedItems: AnalyzedItem[] = [];

    for (let i = 0; i < rawItems.length; i++) {
      const raw = rawItems[i];
      const foodNameTr = (raw.food_name_tr || 'Bilinmeyen Yemek').trim();
      const foodNameEn = (raw.food_name_en || foodNameTr).trim();
      const amount = Math.max(1, Math.round(raw.estimated_amount || 100));
      const unit = (raw.unit_type || 'gram') as UnitType;
      const description = raw.description || `${amount} ${unit}`;

      // Search DB
      const exactName = escapeRegex(foodNameTr);
      const existing = await FoodCache.findOne({
        $or: [
          { food_name: { $regex: `^${exactName}$`, $options: 'i' } },
          { food_name: { $regex: escapeRegex(foodNameTr), $options: 'i' } },
          { search_tags: { $in: [foodNameTr.toLowerCase()] } }
        ],
      }).lean();

      if (existing) {
        const perUnit = {
          calories: normalizeNumber(existing.per_unit.calories),
          protein_g: normalizeNumber(existing.per_unit.protein_g),
          carbs_g: normalizeNumber(existing.per_unit.carbs_g),
          fat_g: normalizeNumber(existing.per_unit.fat_g),
          sugar_g: normalizeNumber(existing.per_unit.sugar_g || 0),
        };

        processedItems.push({
          id: `item-${i}-${Date.now()}`,
          food_name: existing.food_name,
          food_name_en: existing.food_name_en || foodNameEn,
          amount,
          unit_type: existing.unit_type as UnitType || unit,
          description,
          matched_in_db: true,
          food_cache_id: existing._id.toString(),
          per_unit: perUnit,
          calculated: calculateNutrition(perUnit, amount),
        });
      } else {
        // AI Estimate fallback per unit
        // Default standard estimations based on unit type
        const isGram = unit === 'gram';
        const fallbackPerUnit = {
          calories: isGram ? 1.5 : 180,
          protein_g: isGram ? 0.08 : 8,
          carbs_g: isGram ? 0.15 : 20,
          fat_g: isGram ? 0.06 : 6,
          sugar_g: isGram ? 0.02 : 2,
        };

        // Cache into FoodCache
        const upsertRes = await FoodCache.findOneAndUpdate(
          { food_name: foodNameTr, brand_name: null },
          {
            $set: {
              food_name_en: foodNameEn,
              unit_type: unit,
              per_unit: fallbackPerUnit,
              source: 'gemini_vision',
              ai_provider: 'gemini',
              nutrition_basis: isGram ? 'per_gram' : 'per_unit',
              generated_at: new Date(),
              search_tags: [foodNameTr.toLowerCase()],
            },
          },
          { upsert: true, new: true }
        ).lean();

        processedItems.push({
          id: `item-${i}-${Date.now()}`,
          food_name: foodNameTr,
          food_name_en: foodNameEn,
          amount,
          unit_type: unit,
          description,
          matched_in_db: false,
          food_cache_id: upsertRes ? upsertRes._id.toString() : undefined,
          per_unit: fallbackPerUnit,
          calculated: calculateNutrition(fallbackPerUnit, amount),
        });
      }
    }

    const grandTotals = processedItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calculated.calories,
        protein_g: Math.round((acc.protein_g + item.calculated.protein_g) * 10) / 10,
        carbs_g: Math.round((acc.carbs_g + item.calculated.carbs_g) * 10) / 10,
        fat_g: Math.round((acc.fat_g + item.calculated.fat_g) * 10) / 10,
        sugar_g: Math.round((acc.sugar_g + item.calculated.sugar_g) * 10) / 10,
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, sugar_g: 0 }
    );

    return NextResponse.json({
      success: true,
      meal_name: mealName,
      items: processedItems,
      totals: grandTotals,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Analyze Photo Error:', err);
    return NextResponse.json({ error: err.message || 'Fotoğraf analizi yapılamadı.' }, { status: 500 });
  }
}
