import test from 'node:test';
import assert from 'node:assert/strict';
import { GEMINI_VISION_MODEL, nutritionVisionSchema } from '../src/lib/gemini-vision.ts';

test('uses the stable Gemini Flash model for food-label vision', () => {
  assert.equal(GEMINI_VISION_MODEL, 'gemini-3.1-flash-lite');
  assert.deepEqual(nutritionVisionSchema.required, [
    'food_name',
    'brand_name',
    'calories_per_100g',
    'protein_g_per_100g',
    'carbs_g_per_100g',
    'fat_g_per_100g',
    'sugar_g_per_100g'
  ]);
});
