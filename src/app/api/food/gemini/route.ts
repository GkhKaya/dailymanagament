import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FoodCache } from '@/models/FoodCache';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openrouter/free'; // OpenRouter'daki her zaman aktif ücretsiz model havuzu

// Global Queue for OpenRouter Rate Limiting (Kuyruğu koruyoruz, ancak limiti biraz daha esnek yapabiliriz)
let nextAvailableTime = 0;
const MIN_DELAY_MS = 3000; // OpenRouter'da ücretsiz modeller için 3 saniye yeterli

async function waitInQueue() {
  const now = Date.now();
  let waitTime = 0;
  
  if (now < nextAvailableTime) {
    waitTime = nextAvailableTime - now;
    nextAvailableTime += MIN_DELAY_MS;
  } else {
    nextAvailableTime = now + MIN_DELAY_MS;
  }

  if (waitTime > 0) {
    console.log(`[OpenRouter Queue] Waiting ${Math.round(waitTime/1000)}s...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
}

interface NutritionResult {
  food_name: string;
  food_name_en: string;
  unit_type: 'gram' | 'adet';
  per_unit: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
  calculated: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
}

async function performWebSearch(query: string): Promise<string> {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' kalori besin değerleri')}`;
    
    // 3 Saniyelik zaman aşımı (timeout) ekle
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timeoutId);

    if (!response.ok) return '';
    const html = await response.text();
    
    // Basit regex ile arama snippet'lerini çek
    const snippetMatches = html.match(/<a class="result__snippet[^>]*>(.*?)<\/a>/g);
    if (!snippetMatches) return '';

    // İlk 3 arama sonucunun metnini birleştir (HTML tag'lerini temizle)
    const textSnippets = snippetMatches
      .slice(0, 3)
      .map(s => s.replace(/<[^>]+>/g, '').trim())
      .join(' ');

    return textSnippets.slice(0, 800); // Max 800 karakter
  } catch (err) {
    console.warn('[Web Search] DuckDuckGo arama zaman aşımına uğradı veya hata verdi:', err);
    return '';
  }
}

async function queryOpenRouter(foodName: string, amount: number, unit: 'gram' | 'adet'): Promise<NutritionResult> {
  await waitInQueue();

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY ortam değişkeni tanımlı değil');
  }

  const perUnitLabel = unit === 'gram' ? '1 gram' : '1 adet';
  const unitLabel = unit === 'gram' ? 'gram' : 'adet';

  console.log(`[Web Search] Aranıyor: ${foodName}...`);
  const searchResults = await performWebSearch(foodName);
  const searchContext = searchResults ? `\nİNTERNET ARAMA SONUÇLARI (REFERANS OLARAK KULLAN):\n${searchResults}\n` : '';

  const prompt = `Sen bir beslenme uzmanısın. "${foodName}" için besin değerlerini ver.${searchContext}
  
ÖNEMLİ KURALLAR:
- Eğer internet arama sonuçlarında (veya hafızanda) spesifik markalı ürün (örn: Carrefour, Eti, Ülker) geçiyorsa o değerleri KESİNLİKLE kullan.
- Eğer ölçü birimi "gram" ise: ${perUnitLabel} başına değerleri ver (çiğ/ham hali varsayılan).
- Eğer ölçü birimi "adet" (paket, kutu, vb.) ise: Ürünün standart 1 paketinin/kutusunun KAÇ GRAM olduğunu internet sonuçlarından veya hafızandan bul. Ardından, 100 gram besin değerini o paketin gramajına göre oranla ve SADECE 1 PAKET (adet) için geçerli olan toplam değerleri yaz. (Örnek: Ürün 1 paket 56 gramsa ve 100 gramı 90 kalori ise, 1 adet kalorisi ~50 kalori olmalıdır).
- Sadece JSON formatında yanıt ver, başka hiçbir şey yazma.
- Tüm sayılar ondalık (float) olabilir, negatif olamaz.

JSON formatı (kesinlikle bu formatta):
{
  "food_name_tr": "Türkçe yemek adı",
  "food_name_en": "English food name",
  "unit_type": "${unit}",
  "per_unit_calories": 0.0,
  "per_unit_protein_g": 0.0,
  "per_unit_carbs_g": 0.0,
  "per_unit_fat_g": 0.0,
  "per_unit_fiber_g": 0.0
}

Yemek: ${foodName}
Miktar: ${amount} ${unitLabel}`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005',
      'X-Title': 'DailyManagement',
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1
    })
  });

  if (response.status === 429) {
    console.warn('[OpenRouter API] 429 Too Many Requests hit, retrying in 5s...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    return queryOpenRouter(foodName, amount, unit);
  }

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[OpenRouter API] Error response: ${response.status}`, errText);
    throw new Error(`OpenRouter API hatası: ${response.status} — ${errText}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content || '';
  console.log(`[OpenRouter API] Response received successfully. Content length: ${rawText.length}`);

  // JSON bloğunu çıkar
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error(`[OpenRouter API] Failed to parse JSON from response. Raw text:`, rawText);
    throw new Error('Yapay Zeka geçerli JSON döndürmedi');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  console.log(`[OpenRouter API] Successfully parsed nutrition data for: ${parsed.food_name_tr || foodName}`);

  const perUnit = {
    calories: Math.max(0, parseFloat(parsed.per_unit_calories) || 0),
    protein_g: Math.max(0, parseFloat(parsed.per_unit_protein_g) || 0),
    carbs_g: Math.max(0, parseFloat(parsed.per_unit_carbs_g) || 0),
    fat_g: Math.max(0, parseFloat(parsed.per_unit_fat_g) || 0),
    fiber_g: Math.max(0, parseFloat(parsed.per_unit_fiber_g) || 0)
  };

  return {
    food_name: parsed.food_name_tr || foodName,
    food_name_en: parsed.food_name_en || foodName,
    unit_type: unit,
    per_unit: perUnit,
    calculated: {
      calories: Math.round(perUnit.calories * amount),
      protein_g: Math.round(perUnit.protein_g * amount * 10) / 10,
      carbs_g: Math.round(perUnit.carbs_g * amount * 10) / 10,
      fat_g: Math.round(perUnit.fat_g * amount * 10) / 10
    }
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { food_name, amount, unit } = body as { food_name: string; amount: number; unit: 'gram' | 'adet' };

    if (!food_name || !amount || !unit) {
      return NextResponse.json({ error: 'food_name, amount ve unit gerekli' }, { status: 400 });
    }

    if (amount <= 0 || amount > 10000) {
      return NextResponse.json({ error: 'Geçersiz miktar' }, { status: 400 });
    }

    // 1. Önce FoodCache'de ara — zaten var mı?
    await connectDB();
    const existing = await FoodCache.findOne({
      $or: [
        { food_name: { $regex: `^${food_name}$`, $options: 'i' } },
        { food_name_en: { $regex: `^${food_name}$`, $options: 'i' } }
      ],
      unit_type: unit
    }).lean() as any;

    let result: NutritionResult;

    if (existing) {
      // DB'den hesapla
      result = {
        food_name: existing.food_name,
        food_name_en: existing.food_name_en,
        unit_type: existing.unit_type,
        per_unit: existing.per_unit,
        calculated: {
          calories: Math.round(existing.per_unit.calories * amount),
          protein_g: Math.round(existing.per_unit.protein_g * amount * 10) / 10,
          carbs_g: Math.round(existing.per_unit.carbs_g * amount * 10) / 10,
          fat_g: Math.round(existing.per_unit.fat_g * amount * 10) / 10
        }
      };
    } else {
      // OpenRouter / Gemini'ye sor
      result = await queryOpenRouter(food_name, amount, unit);

      // FoodCache'e kaydet
      try {
        await FoodCache.updateOne(
          {
            food_name: { $regex: `^${result.food_name}$`, $options: 'i' },
            unit_type: unit
          },
          {
            $setOnInsert: {
              food_name: result.food_name,
              food_name_en: result.food_name_en,
              unit_type: result.unit_type,
              per_unit: result.per_unit,
              brand_name: null,
              source: 'gemini',
              search_tags: [food_name.toLowerCase()]
            }
          },
          { upsert: true }
        );
      } catch (cacheErr) {
        console.error('FoodCache upsert hatası (devam ediliyor):', cacheErr);
      }
    }

    return NextResponse.json({
      success: true,
      food_name: result.food_name,
      food_name_en: result.food_name_en,
      unit_type: result.unit_type,
      per_unit: result.per_unit,
      amount,
      calculated: result.calculated,
      source: existing ? 'db' : 'gemini'
    });
  } catch (error: any) {
    console.error('OpenRouter food query error:', error);
    return NextResponse.json({ error: error.message || 'Besin değeri alınamadı' }, { status: 500 });
  }
}
