import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { GEMINI_VISION_MODEL, nutritionVisionPrompt, nutritionVisionSchema } from '@/lib/gemini-vision';
import { extractMistralErrorMessage, nutritionAnnotationFormat, parseNutritionAnnotation } from '@/lib/mistral-ocr';

export const runtime = 'nodejs';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

const annotationPrompt = `Bu bir gıda ürününün besin etiketi fotoğrafıdır. Etiketteki değerleri sadece 100 g bazında çıkar.
Türkçe ondalık virgülleri sayıya dönüştür. Bir değer okunamıyorsa tahmin etme; null döndür. Ürün adını ve markayı etiketten al.`;

type OcrProvider = 'gemini' | 'mistral';

async function readWithGemini(bytes: Buffer, mimeType: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY tanımlı değil.');

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: GEMINI_VISION_MODEL,
    contents: [
      { inlineData: { mimeType, data: bytes.toString('base64') } },
      { text: nutritionVisionPrompt }
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: nutritionVisionSchema,
      temperature: 0
    }
  });
  if (!response.text) throw new Error('Gemini Vision boş yanıt döndürdü.');
  return parseNutritionAnnotation(response.text);
}

async function readWithMistral(bytes: Buffer, mimeType: string) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error('MISTRAL_API_KEY tanımlı değil.');

  const imageUrl = `data:${mimeType};base64,${bytes.toString('base64')}`;
  const response = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: { type: 'image_url', image_url: imageUrl },
      document_annotation_format: nutritionAnnotationFormat,
      document_annotation_prompt: annotationPrompt
    })
  });

  const responseText = await response.text();
  let payload: { document_annotation?: string | null } | null = null;
  try {
    payload = JSON.parse(responseText) as { document_annotation?: string | null };
  } catch {
    // Mistral hata yanıtı JSON olmayabilir; aşağıdaki logda sınırlı metni gösteririz.
  }

  if (!response.ok) {
    const errorMessage = extractMistralErrorMessage(payload) || responseText.slice(0, 1_000) || `Mistral OCR hatası (${response.status}).`;
    console.error('Mistral OCR request failed', { status: response.status, statusText: response.statusText, errorMessage });
    throw new Error(`Mistral OCR hatası (${response.status}): ${errorMessage}`);
  }
  if (!payload) throw new Error('Mistral OCR geçersiz bir yanıt döndürdü.');
  return parseNutritionAnnotation(payload.document_annotation);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    const provider = formData.get('provider');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Bir etiket fotoğrafı seçin.' }, { status: 400 });
    if (provider !== 'gemini' && provider !== 'mistral') return NextResponse.json({ error: 'Geçerli bir OCR sağlayıcısı seçin.' }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'JPG, PNG, WEBP veya AVIF fotoğraf yükleyin.' }, { status: 400 });
    if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: 'Fotoğraf 10 MB’dan küçük olmalı.' }, { status: 400 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const ocrProvider = provider as OcrProvider;
    const nutrition = ocrProvider === 'gemini'
      ? await readWithGemini(bytes, file.type)
      : await readWithMistral(bytes, file.type);
    return NextResponse.json({ success: true, nutrition, source: `${ocrProvider}-ocr` });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Etiket okunamadı.';
    console.error('Food label OCR failed', { message });
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
