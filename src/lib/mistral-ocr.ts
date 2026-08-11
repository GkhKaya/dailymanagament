export interface NutritionAnnotation {
  food_name: string;
  brand_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export const nutritionAnnotationFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'nutrition_label',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        food_name: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'Ürünün etikette yazan adı.' },
        brand_name: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'Ürünün markası.' },
        calories_per_100g: { anyOf: [{ type: 'number' }, { type: 'null' }], description: '100 gram başına kcal.' },
        protein_g_per_100g: { anyOf: [{ type: 'number' }, { type: 'null' }], description: '100 gram başına protein, gram.' },
        carbs_g_per_100g: { anyOf: [{ type: 'number' }, { type: 'null' }], description: '100 gram başına karbonhidrat, gram.' },
        fat_g_per_100g: { anyOf: [{ type: 'number' }, { type: 'null' }], description: '100 gram başına yağ, gram.' }
      },
      required: [
        'food_name',
        'brand_name',
        'calories_per_100g',
        'protein_g_per_100g',
        'carbs_g_per_100g',
        'fat_g_per_100g'
      ]
    }
  }
} as const;

export function extractMistralErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = payload as Record<string, unknown>;
  if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
  if (typeof data.detail === 'string' && data.detail.trim()) return data.detail.trim();
  if (data.error && typeof data.error === 'object') {
    const error = data.error as Record<string, unknown>;
    if (typeof error.message === 'string' && error.message.trim()) return error.message.trim();
  }
  return null;
}

export function resolveFoodName(existingName: string, detectedName: string): string {
  return existingName.trim() || detectedName.trim();
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const match = value.replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    return JSON.parse(cleaned) as Record<string, unknown>;
  }
  if (value && typeof value === 'object') return value as Record<string, unknown>;
  throw new Error('OCR yanıtı geçerli JSON değil.');
}

export function parseNutritionAnnotation(annotation: unknown): NutritionAnnotation {
  const data = asRecord(annotation);
  const foodName = typeof data.food_name === 'string' ? data.food_name.trim() : '';
  const brandName = typeof data.brand_name === 'string' ? data.brand_name.trim() : '';
  const values = {
    calories: toNumber(data.calories_per_100g),
    protein_g: toNumber(data.protein_g_per_100g),
    carbs_g: toNumber(data.carbs_g_per_100g),
    fat_g: toNumber(data.fat_g_per_100g)
  };

  if (Object.values(values).some((value) => value === null || value < 0)) {
    throw new Error('Etikette geçerli 100 g besin değerleri bulunamadı.');
  }
  if (Object.values(values).every((value) => value === 0)) {
    throw new Error('Etikette besin değerleri okunamadı. Daha net bir etiket fotoğrafı deneyin.');
  }

  return {
    food_name: foodName,
    brand_name: brandName,
    calories: values.calories as number,
    protein_g: values.protein_g as number,
    carbs_g: values.carbs_g as number,
    fat_g: values.fat_g as number
  };
}
