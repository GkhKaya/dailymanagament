import test from 'node:test';
import assert from 'node:assert/strict';
import { buildManualFoodStoragePayload, getFoodLabelInputAttributes } from '../src/lib/manual-food-storage.ts';

test('normalizes a manually entered gram-based meal to per-100g values for storage', () => {
  const result = buildManualFoodStoragePayload({
    foodName: 'Mercimek çorbası',
    brandName: '',
    unitType: 'gram',
    quantity: '250',
    calories: '500',
    protein: '20',
    carbs: '60',
    fat: '15',
    sugar: '5',
  });

  assert.deepEqual(result, {
    food_name: 'Mercimek çorbası',
    brand_name: '',
    unit_type: 'gram',
    calories: 200,
    protein_g: 8,
    carbs_g: 24,
    fat_g: 6,
    sugar_g: 2,
  });
});

test('keeps a one-unit nutrition basis for manually entered portion foods', () => {
  const result = buildManualFoodStoragePayload({
    foodName: 'Protein bar', brandName: 'Örnek', unitType: 'porsiyon', quantity: '2',
    calories: '400', protein: '30', carbs: '40', fat: '16', sugar: '8',
  });

  assert.equal(result.calories, 200);
  assert.equal(result.protein_g, 15);
  assert.equal(result.unit_type, 'porsiyon');
});

test('keeps gallery selection available without forcing camera capture', () => {
  assert.deepEqual(getFoodLabelInputAttributes('camera'), {
    accept: 'image/jpeg,image/png,image/webp,image/avif', capture: 'environment',
  });
  assert.deepEqual(getFoodLabelInputAttributes('gallery'), {
    accept: 'image/jpeg,image/png,image/webp,image/avif',
  });
});
