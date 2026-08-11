import test from 'node:test';
import assert from 'node:assert/strict';
import { extractMistralErrorMessage, nutritionAnnotationFormat, parseNutritionAnnotation, resolveFoodName } from '../src/lib/mistral-ocr.ts';

test('parses valid Turkish label nutrition values as per-100g fields', () => {
  const result = parseNutritionAnnotation(JSON.stringify({
    food_name: 'Yulaf Ezmesi',
    brand_name: 'Örnek',
    calories_per_100g: '389',
    protein_g_per_100g: '13.2',
    carbs_g_per_100g: '66,3',
    fat_g_per_100g: '6.5',
    sugar_g_per_100g: '1,0'
  }));

  assert.deepEqual(result, {
    food_name: 'Yulaf Ezmesi',
    brand_name: 'Örnek',
    calories: 389,
    protein_g: 13.2,
    carbs_g: 66.3,
    fat_g: 6.5,
    sugar_g: 1
  });
});

test('rejects incomplete or negative nutrition annotation', () => {
  assert.throws(
    () => parseNutritionAnnotation(JSON.stringify({
      food_name: 'Ürün',
      calories_per_100g: 100,
      protein_g_per_100g: -1,
      carbs_g_per_100g: 10,
      fat_g_per_100g: 2,
      sugar_g_per_100g: 1
    })),
    /geçerli/i
  );
});

test('rejects an OCR result when every nutrition value is zero', () => {
  assert.throws(
    () => parseNutritionAnnotation(JSON.stringify({
      food_name: 'Okunamadı',
      brand_name: '',
      calories_per_100g: 0,
      protein_g_per_100g: 0,
      carbs_g_per_100g: 0,
      fat_g_per_100g: 0,
      sugar_g_per_100g: 0
    })),
    /okunamadı/i
  );
});

test('accepts valid nutrition values when the OCR cannot identify the product name', () => {
  const result = parseNutritionAnnotation(JSON.stringify({
    food_name: null,
    brand_name: null,
    calories_per_100g: 240,
      protein_g_per_100g: 0,
      carbs_g_per_100g: 60,
      fat_g_per_100g: 0,
      sugar_g_per_100g: 0
  }));

  assert.deepEqual(result, {
    food_name: '',
    brand_name: '',
    calories: 240,
    protein_g: 0,
    carbs_g: 60,
    fat_g: 0,
    sugar_g: 0
  });
});

test('keeps the name the user has already entered', () => {
  assert.equal(resolveFoodName('Süt', 'Mill Verlu'), 'Süt');
  assert.equal(resolveFoodName('', 'Mill Verlu'), 'Mill Verlu');
});

test('extracts Mistral error messages from API error payloads', () => {
  assert.equal(
    extractMistralErrorMessage({ object: 'error', message: 'Please provide a json_schema.' }),
    'Please provide a json_schema.'
  );
});

test('defines the strict JSON schema required for nutrition label annotations', () => {
  assert.equal(nutritionAnnotationFormat.type, 'json_schema');
  assert.deepEqual(nutritionAnnotationFormat.json_schema.schema.required, [
    'food_name',
    'brand_name',
    'calories_per_100g',
    'protein_g_per_100g',
    'carbs_g_per_100g',
    'fat_g_per_100g',
    'sugar_g_per_100g'
  ]);
});
