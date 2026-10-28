export type ManualFoodStorageInput = {
  foodName: string;
  brandName: string;
  unitType: string;
  quantity: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  sugar: string;
};

export type FoodLabelImageSource = 'camera' | 'gallery';

const FOOD_LABEL_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';

function asNonNegativeNumber(value: string, fieldName: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${fieldName} geçersiz.`);
  return parsed;
}

export function buildManualFoodStoragePayload(input: ManualFoodStorageInput) {
  const foodName = input.foodName.trim();
  const quantity = Number(input.quantity);
  if (!foodName) throw new Error('Yemek adı zorunludur.');
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Miktar 0’dan büyük olmalıdır.');

  const scale = input.unitType === 'gram' ? 100 / quantity : 1 / quantity;
  const normalized = (value: string, fieldName: string) => Math.round(asNonNegativeNumber(value, fieldName) * scale * 1000) / 1000;

  return {
    food_name: foodName,
    brand_name: input.brandName.trim(),
    unit_type: input.unitType,
    calories: normalized(input.calories, 'Kalori'),
    protein_g: normalized(input.protein, 'Protein'),
    carbs_g: normalized(input.carbs, 'Karbonhidrat'),
    fat_g: normalized(input.fat, 'Yağ'),
    sugar_g: normalized(input.sugar, 'Şeker'),
  };
}

export function getFoodLabelInputAttributes(source: FoodLabelImageSource) {
  return source === 'camera'
    ? { accept: FOOD_LABEL_IMAGE_ACCEPT, capture: 'environment' as const }
    : { accept: FOOD_LABEL_IMAGE_ACCEPT };
}
