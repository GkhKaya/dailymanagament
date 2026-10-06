export type PromptMealCalculated = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sugar_g: number;
};

export type PromptMealResult = {
  food_name: string;
  serving_description: string;
  quantity: number;
  unit_type: 'porsiyon';
  calculated: PromptMealCalculated;
  source?: 'ai' | 'ai_with_database_context';
  provider?: 'gemini' | 'openrouter';
};

export function validatePromptMealRequest(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Geçerli bir istek gerekli.');
  const payload = value as { prompt?: unknown; useDatabase?: unknown };
  const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : '';
  if (prompt.length < 1 || prompt.length > 1500) throw new Error('Prompt 1-1500 karakter arasında olmalıdır.');
  if (typeof payload.useDatabase !== 'boolean') throw new Error('Veritabanı tercihi gerekli.');
  return { prompt, useDatabase: payload.useDatabase };
}

function validValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 100_000;
}

export function validatePromptMealResult(value: unknown): PromptMealResult {
  if (!value || typeof value !== 'object') throw new Error('AI yanıtı geçersiz.');
  const result = value as Partial<PromptMealResult>;
  const calculated = result.calculated;
  if (!result.food_name || typeof result.food_name !== 'string' || !result.serving_description || typeof result.serving_description !== 'string') throw new Error('AI yemek adı veya porsiyon açıklaması eksik.');
  if (!validValue(result.quantity) || !calculated || !validValue(calculated.calories) || !validValue(calculated.protein_g) || !validValue(calculated.carbs_g) || !validValue(calculated.fat_g) || !validValue(calculated.sugar_g)) throw new Error('AI besin değerleri geçersiz.');
  return {
    food_name: result.food_name.trim().slice(0, 120),
    serving_description: result.serving_description.trim().slice(0, 160),
    quantity: Number(result.quantity),
    unit_type: 'porsiyon',
    calculated: {
      calories: Math.round(Number(calculated.calories)),
      protein_g: Math.round(Number(calculated.protein_g) * 10) / 10,
      carbs_g: Math.round(Number(calculated.carbs_g) * 10) / 10,
      fat_g: Math.round(Number(calculated.fat_g) * 10) / 10,
      sugar_g: Math.round(Number(calculated.sugar_g) * 10) / 10,
    },
  };
}

export function buildPromptMealEntry(result: PromptMealResult, date: string, type: 'breakfast' | 'lunch' | 'dinner' | 'snack') {
  return {
    date,
    type,
    food_name: result.food_name,
    serving_description: result.serving_description,
    quantity: result.quantity,
    unit_type: result.unit_type,
    calories: result.calculated.calories,
    protein_g: result.calculated.protein_g,
    carbs_g: result.calculated.carbs_g,
    fat_g: result.calculated.fat_g,
    sugar_g: result.calculated.sugar_g,
  };
}
