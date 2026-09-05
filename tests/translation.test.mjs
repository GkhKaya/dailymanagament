import test from 'node:test';
import assert from 'node:assert/strict';
import { formatEnglishDate, translateBatch, translateDayDataToEnglish } from '../src/lib/translation-service.ts';

test('formatEnglishDate converts DD.MM.YYYY to English month day, year format', () => {
  const formatted = formatEnglishDate('04.09.2026');
  assert.match(formatted, /Sep.*4.*2026/);
});

test('formatEnglishDate handles empty or non-standard dates gracefully', () => {
  assert.equal(formatEnglishDate(''), '');
  assert.equal(formatEnglishDate('invalid-date'), 'invalid-date');
});

test('translateBatch translates common Turkish nutrition and fitness dictionary terms', async () => {
  const map = await translateBatch(['Kahvaltı', 'porsiyon', 'Yürüyüş', 'Ağırlık Antrenmanı', 'dilim']);
  assert.equal(map.get('Kahvaltı'), 'Breakfast');
  assert.equal(map.get('porsiyon'), 'serving');
  assert.equal(map.get('Yürüyüş'), 'Walking');
  assert.equal(map.get('Ağırlık Antrenmanı'), 'Weight Training');
  assert.equal(map.get('dilim'), 'slice');
});

test('translateDayDataToEnglish translates meals and exercises correctly', async () => {
  const mockDay = {
    date: '2026-09-04',
    dateFormatted: '04.09.2026',
    meals: {
      breakfast: [
        { name: 'Yumurta', amount: '2 adet', calories: 140, protein: 12, carbs: 1, fat: 10 }
      ],
      lunch: [],
      dinner: [],
      snack: []
    },
    exercises: [
      { name: 'Yürüyüş', duration_minutes: 30, calories_burned: 120 }
    ],
    sleep: { duration_minutes: 480, calories_burned: 500 },
    bmr: 1700,
    totals: {
      calories_consumed: 140,
      calories_burned_exercise: 120,
      calories_burned_sleep: 500,
      calories_burned_bmr: 1700,
      total_burned: 1820,
      protein_g: 12,
      carbs_g: 1,
      fat_g: 10
    }
  };

  const translated = await translateDayDataToEnglish(mockDay);
  assert.match(translated.dateFormatted, /Sep.*4.*2026/);
  assert.equal(translated.exercises[0].name, 'Walking');
  // 'Yumurta' will be translated to 'Egg' or preserved if offline
  assert.ok(translated.meals.breakfast[0].name.length > 0);
});

test('formatEnglishFoodName formats food names in title case for English story', async () => {
  const { formatEnglishFoodName } = await import('../src/lib/translation-service.ts');
  assert.equal(formatEnglishFoodName('boiled egg'), 'Boiled Egg');
  assert.equal(formatEnglishFoodName('chicken breast'), 'Chicken Breast');
  assert.equal(formatEnglishFoodName('oatmeal with berries'), 'Oatmeal With Berries');
  assert.equal(formatEnglishFoodName(''), '');
});

test('formatEnglishAmount converts Turkish portion amounts to standard English', async () => {
  const { formatEnglishAmount } = await import('../src/lib/translation-service.ts');
  assert.equal(formatEnglishAmount('2 adet'), '2 pcs');
  assert.equal(formatEnglishAmount('1 dilim'), '1 slice');
  assert.equal(formatEnglishAmount('2 dilim'), '2 slices');
  assert.equal(formatEnglishAmount('1 kase'), '1 bowl');
  assert.equal(formatEnglishAmount('100 gram'), '100g');
  assert.equal(formatEnglishAmount('1 porsiyon'), '1 serving');
  assert.equal(formatEnglishAmount('2 porsiyon'), '2 servings');
});

test('translateBatch translates Turkish foods to English via translation API', async () => {
  const foods = ['Yumurta', 'Yulaf Ezmesi', 'Tavuk Göğsü', 'Pirinç Pilavı'];
  const res = await translateBatch(foods);
  assert.ok(res.has('Yumurta'));
  assert.equal(res.get('Yumurta')?.toLowerCase(), 'egg');
  assert.ok(res.has('Yulaf Ezmesi'));
  assert.equal(res.get('Yulaf Ezmesi')?.toLowerCase(), 'oatmeal');
});

