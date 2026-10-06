import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { connectDB } from '@/lib/db';
import { FoodCache } from '@/models/FoodCache';
import {
  validatePromptMealRequest,
  validatePromptMealResult,
  type PromptMealResult,
} from '@/lib/ai-prompt-meal';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 15_000;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    food_name: { type: Type.STRING },
    serving_description: { type: Type.STRING },
    quantity: { type: Type.NUMBER, minimum: 0.01 },
    calculated: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.NUMBER, minimum: 0 },
        protein_g: { type: Type.NUMBER, minimum: 0 },
        carbs_g: { type: Type.NUMBER, minimum: 0 },
        fat_g: { type: Type.NUMBER, minimum: 0 },
        sugar_g: { type: Type.NUMBER, minimum: 0 },
      },
      required: ['calories', 'protein_g', 'carbs_g', 'fat_g', 'sugar_g'],
    },
  },
  required: ['food_name', 'serving_description', 'quantity', 'calculated'],
};

function stripJsonFence(text: string) {
  return text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
}

function promptContext(prompt: string, databaseContext: string) {
  return `Sen Türkiye'de kullanılan paketli ürünleri, ev tariflerini ve porsiyonları değerlendiren bir beslenme uzmanısın. Kullanıcının serbest metnindeki malzemeleri, miktarları ve TÜKETTİĞİ kısmı dikkatle yorumla.

Kullanıcı metni: "${prompt}"

Kurallar:
- Paket, yarım paket, gram, adet, kase, bardak, tabak, kepçe, porsiyon, 1/4, yarısı, üçte biri, 2.5 tabak gibi her miktarı yorumla.
- Önce hazırlanan/ifade edilen toplamı tahmin et, ardından kullanıcının yediği oran veya miktar için makroları hesapla.
- Tüketim oranı belirtilmemişse metinde doğrudan belirtilen tüketim miktarını baz al.
- food_name yalnızca kullanıcının yediği yemeğin kısa Türkçe adı olsun.
- serving_description tüketim açıklamasını taşısın; örnek: "Tarifin 1/4'ü" veya "2,5 tabak".
- quantity tüketilen porsiyon sayısı olsun. Bir tarifin 1/4'ü için 0.25 kullan.
- calculated yalnızca tüketilen miktarın toplam kalori ve makrolarıdır.
- Değerler tahmindir; negatif, NaN veya gerçek dışı büyüklükte değer üretme.
- Sadece belirtilen alanlardan oluşan JSON döndür.
${databaseContext}`;
}

function safeTokenRegex(prompt: string) {
  const tokens = prompt.toLocaleLowerCase('tr-TR').match(/[a-zçğıöşü]{3,}/gi) || [];
  return [...new Set(tokens)].slice(0, 8).map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

async function readDatabaseContext(prompt: string) {
  const tokens = safeTokenRegex(prompt);
  if (tokens.length === 0) return '';
  await connectDB();
  const foods = await FoodCache.find({
    $or: tokens.flatMap((token) => [
      { food_name: { $regex: token, $options: 'i' } },
      { search_tags: { $regex: token, $options: 'i' } },
    ]),
  }).select('food_name unit_type per_unit').limit(8).lean();

  if (foods.length === 0) return '\nVeritabanında ilgili referans bulunamadı; genel güvenilir tahmin kullan.';
  const summary = foods.map((food) => `${food.food_name}: 1 ${food.unit_type} için ${food.per_unit.calories} kcal, P ${food.per_unit.protein_g}g, K ${food.per_unit.carbs_g}g, Y ${food.per_unit.fat_g}g`).join('\n');
  return `\nKullanıcının açtığı veritabanı seçeneği için salt-okunur referanslar:\n${summary}\nBu bilgiler yalnızca bağlamdır; yeni kayıt oluşturma veya mevcut kayıt güncelleme.`;
}

async function queryGemini(contents: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY tanımlı değil.');
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents,
    config: { responseMimeType: 'application/json', responseSchema, temperature: 0.15 },
  });
  if (!response.text) throw new Error('Gemini boş yanıt döndürdü.');
  return JSON.parse(stripJsonFence(response.text)) as unknown;
}

async function queryOpenRouter(contents: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY tanımlı değil.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST', signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005',
        'X-Title': 'DailyM', 'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'openrouter/free', messages: [{ role: 'user', content: `${contents}\nJSON şeması: ${JSON.stringify(responseSchema)}` }], response_format: { type: 'json_object' }, temperature: 0.15 }),
    });
    if (!response.ok) throw new Error(`OpenRouter API hatası: ${response.status}`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('OpenRouter boş yanıt döndürdü.');
    return JSON.parse(stripJsonFence(text)) as unknown;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
    if (!session?.user) return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 });
    const input = validatePromptMealRequest(await request.json());
    const context = input.useDatabase ? await readDatabaseContext(input.prompt) : '';
    const contents = promptContext(input.prompt, context);

    let result: PromptMealResult;
    try {
      result = { ...validatePromptMealResult(await queryGemini(contents)), source: input.useDatabase ? 'ai_with_database_context' : 'ai', provider: 'gemini' };
    } catch (geminiError) {
      if (!process.env.OPENROUTER_API_KEY) throw geminiError;
      result = { ...validatePromptMealResult(await queryOpenRouter(contents)), source: input.useDatabase ? 'ai_with_database_context' : 'ai', provider: 'openrouter' };
    }
    return NextResponse.json({ success: true, ...result, warning: 'AI tahminidir; öğüne eklemeden önce değerleri kontrol edin.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI tarif hesabı tamamlanamadı.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
