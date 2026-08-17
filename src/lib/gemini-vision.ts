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

export const mealPhotoSchema = {
  type: Type.OBJECT,
  properties: {
    meal_name: { type: Type.STRING },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          food_name_tr: { type: Type.STRING },
          food_name_en: { type: Type.STRING },
          estimated_amount: { type: Type.NUMBER, minimum: 1 },
          unit_type: { 
            type: Type.STRING,
            enum: ['gram', 'adet', 'kase', 'bardak', 'tabak', 'dilim', 'yemek kaşığı'] 
          },
          description: { type: Type.STRING }
        },
        required: ['food_name_tr', 'food_name_en', 'estimated_amount', 'unit_type', 'description']
      }
    }
  },
  required: ['meal_name', 'items']
} as const;

export const mealPhotoPrompt = `Sen uzman bir diyetisyen ve görsel besin analizörüsün.
Aşağıdaki yemek/tabak fotoğrafını dikkatlice incele.
Fotoğraftaki yemeği ve tabağın içindeki TÜM ayrı yiyecekleri/bileşenleri tespit et.
Her bileşen için:
- Gerçekçi bir gramaj/porsiyon tahmini yap (örn. 150 gram, 1 kase, 2 dilim).
- Türk mutfağı yemeklerini doğru Türkçe isimleriyle adlandır (örn: "Izgara Tavuk Göğsü", "Bulgur Pilavı", "Çoban Salata", "Süzme Mercimek Çorbası", "Tam Buğday Ekmeği").
- Birim türünü şu seçeneklerden biri seç: 'gram', 'adet', 'kase', 'bardak', 'tabak', 'dilim', 'yemek kaşığı'.
- Gramajlı gıdalarda tercihen 'gram' olarak tahmini pişmiş ağırlığı yaz.
- İçecek, sos veya garnitürler varsa onları da ayrı birer bileşen olarak ekle.`;

