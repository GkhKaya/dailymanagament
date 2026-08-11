import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNutritionAnnotation } from '../src/lib/mistral-ocr.ts';

test('parses valid Turkish label nutrition values as per-100g fields', () => {
  const result = parseNutritionAnnotation(JSON.stringify({
    food_name: 'Yulaf Ezmesi',
    brand_name: 'Örnek',
    calories_per_100g: '389',
    protein_g_per_100g: '13.2',
    carbs_g_per_100g: '66,3',
    fat_g_per_100g: '6.5'
  }));

  assert.deepEqual(result, {
    food_name: 'Yulaf Ezmesi',
    brand_name: 'Örnek',
    calories: 389,
    protein_g: 13.2,
    carbs_g: 66.3,
    fat_g: 6.5
  });
});

test('rejects incomplete or negative nutrition annotation', () => {
  assert.throws(
    () => parseNutritionAnnotation(JSON.stringify({
      food_name: 'Ürün',
      calories_per_100g: 100,
      protein_g_per_100g: -1,
      carbs_g_per_100g: 10,
      fat_g_per_100g: 2
    })),
    /geçerli/i
  );
});
