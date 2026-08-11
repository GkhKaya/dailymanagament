import { NextResponse } from 'next/server';
import { parseNutritionAnnotation } from '@/lib/mistral-ocr';

export const runtime = 'nodejs';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

const annotationPrompt = `Bu bir gıda ürününün besin etiketi fotoğrafıdır. Etiketteki değerleri sadece 100 g bazında çıkar.
JSON alanlarını tam olarak şu isimlerle döndür: food_name, brand_name, calories_per_100g, protein_g_per_100g, carbs_g_per_100g, fat_g_per_100g.
Türkçe ondalık virgülleri sayıya dönüştür. Bir değer okunamıyorsa tahmin etme; null döndür. Ürün adını ve markayı etiketten al.`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'MISTRAL_API_KEY tanımlı değil.' }, { status: 500 });

    const formData = await request.formData();
    const file = formData.get('image');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Bir etiket fotoğrafı seçin.' }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'JPG, PNG, WEBP veya AVIF fotoğraf yükleyin.' }, { status: 400 });
    if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: 'Fotoğraf 10 MB’dan küçük olmalı.' }, { status: 400 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const imageUrl = `data:${file.type};base64,${bytes.toString('base64')}`;
    const response = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        document: { type: 'image_url', image_url: imageUrl },
        document_annotation_format: { type: 'json_object' },
        document_annotation_prompt: annotationPrompt
      })
    });

    const payload = await response.json() as { document_annotation?: string | null; error?: { message?: string } };
    if (!response.ok) throw new Error(payload.error?.message || `Mistral OCR hatası (${response.status}).`);
    const nutrition = parseNutritionAnnotation(payload.document_annotation);
    return NextResponse.json({ success: true, nutrition, source: 'mistral-ocr' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Etiket okunamadı.';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
