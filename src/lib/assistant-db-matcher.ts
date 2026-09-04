import { FoodCache, type IFoodCache } from '@/models/FoodCache';
import { getSmartPortionOptions } from '@/lib/food-portions';
import {
  type AssistantFood,
  normalizeFoodQuery,
  resolvePortionGramsFromOptions
} from '@/lib/assistant-helpers';

export { normalizeFoodQuery };

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pickBestCandidate(candidates: IFoodCache[], rawName: string): IFoodCache {
  if (candidates.length <= 1) return candidates[0];

  const lower = rawName.toLocaleLowerCase('tr-TR');

  // Specific cooking method preference
  if (lower.includes('ızgara') || lower.includes('izgara')) {
    const izgara = candidates.find((c) => {
      const n = c.food_name.toLocaleLowerCase('tr-TR');
      return n.includes('ızgara') || n.includes('izgara');
    });
    if (izgara) return izgara;
  }

  if (
    lower.includes('haşlanmış') ||
    lower.includes('haslanmis') ||
    lower.includes('haşlama') ||
    lower.includes('haslama')
  ) {
    const haslanmis = candidates.find((c) => {
      const n = c.food_name.toLocaleLowerCase('tr-TR');
      return n.includes('haşlanmış') || n.includes('haşlama') || n.includes('haslanmis');
    });
    if (haslanmis) return haslanmis;
  }

  if (lower.includes('fırın') || lower.includes('firin')) {
    const firin = candidates.find((c) => {
      const n = c.food_name.toLocaleLowerCase('tr-TR');
      return n.includes('fırın') || n.includes('firin');
    });
    if (firin) return firin;
  }

  // If user explicitly asked for raw / çiğ
  if (lower.includes('çiğ') || lower.includes('cig')) {
    const cig = candidates.find((c) => {
      const n = c.food_name.toLocaleLowerCase('tr-TR');
      return n.includes('çiğ') || n.includes('cig');
    });
    if (cig) return cig;
  }

  // General cooking preference: cooked food is preferred over raw
  const cooked = candidates.find((c) => {
    const n = c.food_name.toLocaleLowerCase('tr-TR');
    return !n.includes('çiğ') && !n.includes('cig');
  });
  if (cooked) return cooked;

  return candidates[0];
}

export async function findBestFoodInDB(rawName: string, userId?: string | null): Promise<IFoodCache | null> {
  const { coreWords } = normalizeFoodQuery(rawName);

  const userFilter = userId
    ? { $or: [{ user_id: null }, { user_id: { $exists: false } }, { user_id: userId }] }
    : { $or: [{ user_id: null }, { user_id: { $exists: false } }] };

  // 1. Full Core Phrase Match
  const corePhrase = coreWords.join(' ');
  if (corePhrase) {
    const candidates = (await FoodCache.find({
      $and: [
        {
          $or: [
            { food_name: { $regex: '^' + escapeRegex(corePhrase) + '$', $options: 'i' } },
            { food_name: { $regex: '^' + escapeRegex(corePhrase) + ' ', $options: 'i' } },
            { food_name: { $regex: '^' + escapeRegex(corePhrase) + ' \\(', $options: 'i' } }
          ]
        },
        userFilter
      ]
    })
      .limit(10)
      .lean()) as unknown as IFoodCache[];

    if (candidates.length > 0) {
      return pickBestCandidate(candidates, rawName);
    }
  }

  // 2. All core words match
  if (coreWords.length > 1) {
    const wordConditions = coreWords.map((w) => ({
      food_name: { $regex: escapeRegex(w), $options: 'i' }
    }));
    const candidates = (await FoodCache.find({
      $and: [...wordConditions, userFilter]
    })
      .limit(10)
      .lean()) as unknown as IFoodCache[];

    if (candidates.length > 0) {
      candidates.sort((a, b) => a.food_name.length - b.food_name.length);
      return pickBestCandidate(candidates, rawName);
    }
  }

  // 3. First core word match
  if (coreWords.length > 0) {
    const candidates = (await FoodCache.find({
      $and: [{ food_name: { $regex: '^' + escapeRegex(coreWords[0]), $options: 'i' } }, userFilter]
    })
      .limit(5)
      .lean()) as unknown as IFoodCache[];

    if (candidates.length > 0) {
      candidates.sort((a, b) => a.food_name.length - b.food_name.length);
      return pickBestCandidate(candidates, rawName);
    }
  }

  return null;
}

export function resolvePortionGrams(dbFood: IFoodCache, quantity: number, unit: string): number {
  const smartOptions = getSmartPortionOptions({
    name: dbFood.food_name,
    unit_type: dbFood.unit_type,
    portions: dbFood.portions
  });
  return resolvePortionGramsFromOptions(smartOptions, quantity, unit);
}

export async function enrichAssistantFoodsWithDB(
  foods: AssistantFood[],
  userId?: string | null
): Promise<AssistantFood[]> {
  const enriched: AssistantFood[] = [];

  for (const food of foods) {
    try {
      const dbFood = await findBestFoodInDB(food.name, userId);
      if (dbFood && dbFood.per_unit) {
        let cal: number, p: number, c: number, f: number, unitType: string, servingDesc: string, sugar: number;

        if (dbFood.unit_type === 'gram') {
          const grams = resolvePortionGrams(dbFood, food.quantity, food.unit);
          cal = Math.round(dbFood.per_unit.calories * grams);
          p = Math.round(dbFood.per_unit.protein_g * grams * 10) / 10;
          c = Math.round(dbFood.per_unit.carbs_g * grams * 10) / 10;
          f = Math.round(dbFood.per_unit.fat_g * grams * 10) / 10;
          sugar = Math.round((dbFood.per_unit.sugar_g || 0) * grams * 10) / 10;
          unitType = ['gram', 'gr', 'g'].includes(food.unit?.toLowerCase()?.trim()) ? 'gram' : food.unit;
          servingDesc =
            unitType === 'gram'
              ? `${food.quantity} gram`
              : `${food.quantity} ${unitType} (${Math.round(grams)}g)`;
        } else {
          cal = Math.round(dbFood.per_unit.calories * food.quantity);
          p = Math.round(dbFood.per_unit.protein_g * food.quantity * 10) / 10;
          c = Math.round(dbFood.per_unit.carbs_g * food.quantity * 10) / 10;
          f = Math.round(dbFood.per_unit.fat_g * food.quantity * 10) / 10;
          sugar = Math.round((dbFood.per_unit.sugar_g || 0) * food.quantity * 10) / 10;
          unitType = dbFood.unit_type || 'adet';
          servingDesc = `${food.quantity} ${unitType}`;
        }

        enriched.push({
          name: dbFood.food_name,
          quantity: food.quantity,
          unit: unitType,
          serving_description: servingDesc,
          total_calories: cal,
          total_protein_g: p,
          total_carbs_g: c,
          total_fat_g: f,
          sugar_g: sugar,
          matched_in_db: true,
          food_cache_id: dbFood._id ? dbFood._id.toString() : undefined,
          brand_name: dbFood.brand_name || null,
          portions: Array.isArray(dbFood.portions) ? dbFood.portions : [],
          per_unit: food.quantity > 0 ? {
            calories: cal / food.quantity,
            protein_g: p / food.quantity,
            carbs_g: c / food.quantity,
            fat_g: f / food.quantity,
            sugar_g: sugar / food.quantity
          } : undefined
        });
      } else {
        enriched.push({
          ...food,
          matched_in_db: false
        });
      }
    } catch (err) {
      console.warn(`[Assistant DB Matcher] "${food.name}" aranamadı:`, err);
      enriched.push({
        ...food,
        matched_in_db: false
      });
    }
  }

  return enriched;
}
