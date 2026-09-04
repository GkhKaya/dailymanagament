export type TransactionType = 'expense' | 'income';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type NutritionBasis = 'per_gram' | 'per_unit';

export interface FinanceDraft {
  transaction_type: TransactionType;
  amount: number;
  description: string;
  date: string;
  account_id: string | null;
  category_id: string | null;
  accounts: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}

export interface AssistantFoodItem {
  id: string;
  food_name: string;
  serving_description: string;
  quantity: number;
  unit_type: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sugar_g?: number;
  matched_in_db?: boolean;
  food_cache_id?: string;
  brand_name?: string | null;
  per_unit?: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    sugar_g?: number;
  };
  portions?: Array<{ name: string; gram_weight: number; label?: string }>;
}

export interface HealthDraft {
  meal_type: MealType;
  date: string;
  transcript: string;
  foods: AssistantFoodItem[];
}

export interface AssistantFood {
  name: string;
  quantity: number;
  unit: string;
  nutrition_basis?: NutritionBasis;
  serving_description?: string;
  total_calories?: number;
  calories?: number;
  total_protein_g?: number;
  protein_g?: number;
  total_carbs_g?: number;
  carbs_g?: number;
  total_fat_g?: number;
  fat_g?: number;
  total_sugar_g?: number;
  sugar_g?: number;
  matched_in_db?: boolean;
  food_cache_id?: string;
  brand_name?: string | null;
  per_unit?: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    sugar_g?: number;
  };
  portions?: Array<{ name: string; gram_weight: number; label?: string }>;
}

export function validNumber(value: unknown, max: number): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 && number <= max ? number : null;
}

export function inferMealTypeFromContext(foodNames?: string[]): MealType {
  const allNames = (foodNames || []).join(' ').toLowerCase();
  if (/(yumurta|omlet|menemen|peynir|reçel|recel|bal\b|zeytin|simit|poğaça|pogaca|kahvaltı|kahvalti)/.test(allNames)) {
    return 'breakfast';
  }
  if (/(çorba|corba|tavuk|et\b|köfte|kofte|pilav|makarna|kuru fasulye|kebap|döner|doner|biftek|somon|balık|balik)/.test(allNames)) {
    const hour = new Date().getHours();
    return hour >= 17 ? 'dinner' : 'lunch';
  }
  if (/(kahve|çay|cay|bisküvi|biskuvi|çikolata|cikolata|meyve|elma|muz|ceviz|fındık|findik|fıstık|fistik|atıştırmalık)/.test(allNames)) {
    return 'snack';
  }

  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 22) return 'dinner';
  return 'snack';
}

export function normalizeFoodQuery(raw: string) {
  let text = raw.toLocaleLowerCase('tr-TR').trim();
  text = text.replace(/tavukgogsu|tavukgöğsü/g, 'tavuk göğsü');
  text = text.replace(/pirincpilavi|pirinçpilavı/g, 'pirinç pilavı');
  text = text.replace(/bulgurpilavi|bulgurpilavı/g, 'bulgur pilavı');
  text = text.replace(/nohutyemegi|nohutyemeği/g, 'nohut yemeği');
  text = text.replace(/kurufasulye/g, 'kuru fasulye');
  text = text.replace(/mercimekcorbasi|mercimekçorbası/g, 'mercimek çorbası');
  text = text.replace(/ezogelincorba|ezogelinçorba/g, 'ezogelin çorba');
  text = text.replace(/tavuksote/g, 'tavuk sote');

  const coreWords = text
    .split(/[\s,.-]+/)
    .filter(
      (w) =>
        !/^\d+$/.test(w) &&
        ![
          'bir',
          'iki',
          'uc',
          'üç',
          'dort',
          'dört',
          'bes',
          'beş',
          'alti',
          'altı',
          'yedi',
          'sekiz',
          'dokuz',
          'on',
          'pismis',
          'pişmiş',
          'haslanmis',
          'haşlanmış',
          'cig',
          'çiğ',
          'taze',
          'ev',
          'yapimi',
          'yapımı',
          'tane',
          'adet',
          'gram',
          'gr',
          'kilo',
          'kilogram',
          'porsiyon',
          'yemek',
          'yemeği',
          'kase'
        ].includes(w)
    )
    .filter((w) => w.length >= 2);

  return { text, coreWords };
}

export function resolvePortionGramsFromOptions(
  smartOptions: Array<{ name: string; gram_weight: number }>,
  quantity: number,
  unit: string
): number {
  const u = (unit || '').toLowerCase().trim();
  if (['gram', 'gr', 'g'].includes(u)) return quantity;
  if (['kilogram', 'kilo', 'kg'].includes(u)) return quantity * 1000;

  const matchedPortion = smartOptions.find((opt) => {
    const optName = opt.name.toLowerCase();
    if (u === 'kase' && optName.includes('kase')) return true;
    if (u === 'tabak' && optName.includes('tabak')) return true;
    if (u === 'dilim' && optName.includes('dilim')) return true;
    if (u === 'porsiyon' && optName.includes('porsiyon')) return true;
    if (u === 'bardak' && (optName.includes('bardak') || optName.includes('kupa'))) return true;
    if ((u === 'yemek kaşığı' || u === 'kasik') && optName.includes('yemek kaşığı')) return true;
    if (u === 'tatlı kaşığı' && optName.includes('tatlı kaşığı')) return true;
    if (u === 'çay kaşığı' && optName.includes('çay kaşığı')) return true;
    if ((u === 'adet' || u === 'tane') && (optName.includes('adet') || optName.includes('orta') || optName.includes('büyük') || optName.includes('küçük'))) return true;
    return false;
  });

  if (matchedPortion) {
    return quantity * matchedPortion.gram_weight;
  }

  if (u === 'tabak') return quantity * 250;
  if (u === 'kase') return quantity * 250;
  if (u === 'dilim') return quantity * 30;
  if (u === 'bardak') return quantity * 200;
  if (u === 'yemek kaşığı') return quantity * 15;
  if (u === 'tatlı kaşığı') return quantity * 8;
  if (u === 'çay kaşığı') return quantity * 4;
  return quantity * 150;
}

export function buildHealthDraftFromFoods(
  health: { meal_type?: MealType | null; foods?: AssistantFood[] },
  transcript: string,
  currentDateStr?: string
): HealthDraft {
  if (!health || !Array.isArray(health.foods) || health.foods.length === 0) {
    throw new Error('Öğün içindeki besin bilgisi anlaşılamadı.');
  }

  const foodNames = health.foods.map(f => f.name).filter(Boolean);
  const inferredMealType = inferMealTypeFromContext(foodNames);
  const mealType: MealType = health.meal_type && ['breakfast', 'lunch', 'dinner', 'snack'].includes(health.meal_type)
    ? health.meal_type
    : inferredMealType;

  const items: AssistantFoodItem[] = [];

  for (let i = 0; i < health.foods.length; i++) {
    const food = health.foods[i];
    const cleanName = (food.name || '').trim().slice(0, 120);
    if (!cleanName) continue;

    const quantity = validNumber(food.quantity, 10_000);
    const rawCalories = food.total_calories !== undefined ? Number(food.total_calories) : Number(food.calories);
    if (!quantity || isNaN(rawCalories) || rawCalories < 0) {
      throw new Error(`${cleanName} için geçerli miktar veya kalori değeri oluşturulamadı.`);
    }

    if (food.nutrition_basis && !['per_gram', 'per_unit'].includes(food.nutrition_basis)) {
      throw new Error(`${cleanName} için besin hesaplama türü geçersiz.`);
    }

    const rawUnit = (food.unit || (food.nutrition_basis === 'per_gram' ? 'gram' : 'adet')).toLowerCase().trim();
    const unitType = food.nutrition_basis === 'per_gram' ? 'gram' : rawUnit;

    const isAlreadyTotal = food.total_calories !== undefined || !food.nutrition_basis;
    const finalCalories = isAlreadyTotal ? rawCalories : rawCalories * quantity;
    const finalProtein = isAlreadyTotal
      ? (Number(food.total_protein_g ?? food.protein_g) || 0)
      : (Number(food.protein_g) || 0) * quantity;
    const finalCarbs = isAlreadyTotal
      ? (Number(food.total_carbs_g ?? food.carbs_g) || 0)
      : (Number(food.carbs_g) || 0) * quantity;
    const finalFat = isAlreadyTotal
      ? (Number(food.total_fat_g ?? food.fat_g) || 0)
      : (Number(food.fat_g) || 0) * quantity;
    const finalSugar = isAlreadyTotal
      ? (Number(food.total_sugar_g ?? food.sugar_g) || 0)
      : (Number(food.sugar_g) || 0) * quantity;

    const perUnit = food.per_unit || (quantity > 0 ? {
      calories: finalCalories / quantity,
      protein_g: finalProtein / quantity,
      carbs_g: finalCarbs / quantity,
      fat_g: finalFat / quantity,
      sugar_g: finalSugar / quantity
    } : undefined);

    items.push({
      id: `voice-food-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      food_name: cleanName,
      serving_description: food.serving_description || `${quantity} ${unitType}`,
      quantity,
      unit_type: unitType,
      calories: Math.round(finalCalories),
      protein_g: Math.round(Math.max(0, finalProtein) * 10) / 10,
      carbs_g: Math.round(Math.max(0, finalCarbs) * 10) / 10,
      fat_g: Math.round(Math.max(0, finalFat) * 10) / 10,
      sugar_g: Math.round(Math.max(0, finalSugar) * 10) / 10,
      matched_in_db: food.matched_in_db ?? false,
      food_cache_id: food.food_cache_id,
      brand_name: food.brand_name,
      per_unit: perUnit,
      portions: food.portions
    });
  }

  if (items.length === 0) {
    throw new Error('Besin verileri eksik veya geçersiz döndürüldü. Lütfen tekrar deneyin.');
  }

  return {
    meal_type: mealType,
    date: currentDateStr || new Date().toISOString(),
    transcript: transcript.trim(),
    foods: items
  };
}

export function validateHealthDraft(draft: HealthDraft) {
  if (!draft || !draft.foods || !Array.isArray(draft.foods) || draft.foods.length === 0) {
    return { valid: false, error: 'Kaydedilecek besin bulunamadı.' };
  }

  if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(draft.meal_type)) {
    return { valid: false, error: 'Geçersiz öğün türü seçildi.' };
  }

  try {
    const validatedFoods = draft.foods.map(f => {
      const name = (f.food_name || '').trim();
      const qty = Number(f.quantity);
      const cal = Number(f.calories);
      if (!name) throw new Error('Besin adı boş bırakılamaz.');
      if (isNaN(qty) || qty <= 0) throw new Error(`${name} için geçerli bir miktar girilmelidir.`);
      if (isNaN(cal) || cal < 0) throw new Error(`${name} için kalori değeri geçersiz.`);

      return {
        date: draft.date || new Date().toISOString(),
        type: draft.meal_type,
        food_name: name.slice(0, 120),
        serving_description: f.serving_description || `${qty} ${f.unit_type || 'adet'}`,
        quantity: qty,
        unit_type: f.unit_type || 'adet',
        calories: Math.round(cal),
        protein_g: Math.round(Math.max(0, Number(f.protein_g) || 0) * 10) / 10,
        carbs_g: Math.round(Math.max(0, Number(f.carbs_g) || 0) * 10) / 10,
        fat_g: Math.round(Math.max(0, Number(f.fat_g) || 0) * 10) / 10,
        sugar_g: Math.round(Math.max(0, Number(f.sugar_g) || 0) * 10) / 10,
        food_cache_id: f.food_cache_id || undefined
      };
    });

    return { valid: true, foods: validatedFoods };
  } catch (err: unknown) {
    return { valid: false, error: err instanceof Error ? err.message : 'Geçersiz besin verisi.' };
  }
}

export function validateFinanceDraft(draft: Pick<FinanceDraft, 'transaction_type' | 'amount' | 'account_id' | 'category_id'>) {
  const amount = validNumber(draft?.amount, 1_000_000);
  if (!amount || !draft?.account_id || !draft?.category_id || (draft.transaction_type !== 'income' && draft.transaction_type !== 'expense')) {
    return { valid: false, error: 'Tutar, hesap ve kategori seçilmelidir.' };
  }
  return { valid: true, amount };
}
