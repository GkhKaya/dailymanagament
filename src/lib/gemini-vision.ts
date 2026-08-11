import { Type } from '@google/genai';

export const GEMINI_VISION_MODEL = 'gemini-3.1-flash-lite';

export const nutritionVisionSchema = {
  type: Type.OBJECT,
  properties: {
    food_name: { type: Type.STRING },
    brand_name: { type: Type.STRING },
    calories_per_100g: { type: Type.NUMBER, minimum: 0 },
    protein_g_per_100g: { type: Type.NUMBER, minimum: 0 },
    carbs_g_per_100g: { type: Type.NUMBER, minimum: 0 },
    fat_g_per_100g: { type: Type.NUMBER, minimum: 0 },
    sugar_g_per_100g: { type: Type.NUMBER, minimum: 0 }
  },
  required: [
    'food_name',
    'brand_name',
    'calories_per_100g',
    'protein_g_per_100g',
    'carbs_g_per_100g',
    'fat_g_per_100g',
    'sugar_g_per_100g'
  ],
  propertyOrdering: [
    'food_name',
    'brand_name',
    'calories_per_100g',
    'protein_g_per_100g',
    'carbs_g_per_100g',
    'fat_g_per_100g',
    'sugar_g_per_100g'
  ]
} as const;

export const nutritionVisionPrompt = `Bu bir gıda ürününün besin etiketi fotoğrafıdır.
Sadece etikette açıkça yazan 100 g başına değerleri çıkar. Tahmin etme.
Kalori alanına kcal değerini yaz; kJ değerini yazma. Şekerler / toplam şeker alanını sugar_g_per_100g olarak yaz; ilave şeker alanını kullanma. Türkçe ondalık virgüllerini sayıya dönüştür.
Etikette 0 g yazıyorsa 0 döndür. Ürün veya marka okunamıyorsa boş metin döndür.`;
