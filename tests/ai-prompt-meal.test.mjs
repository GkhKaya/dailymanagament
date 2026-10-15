import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPromptMealEntry,
  buildPromptMealEntries,
  validatePromptMealBatchResult,
  validatePromptMealRequest,
} from '../src/lib/ai-prompt-meal.ts';
import { DAILY_LOG_UNITS } from '../src/lib/meal-units.ts';

test('keeps free-text recipe portions and honors the database choice', () => {
  const request = validatePromptMealRequest({
    prompt: '1 paket puding, yarım paket petibör ile yaptığım tatlının dörtte birini yedim',
    useDatabase: false,
  });

  assert.equal(request.useDatabase, false);
  assert.match(request.prompt, /dörtte birini/);
});

test('rejects empty and overlong free-text meal prompts', () => {
  assert.throws(() => validatePromptMealRequest({ prompt: '', useDatabase: false }), /1-1500/i);
  assert.throws(() => validatePromptMealRequest({ prompt: 'x'.repeat(1501), useDatabase: true }), /1-1500/i);
});

test('creates a daily meal payload without a food cache id', () => {
  const entry = buildPromptMealEntry({
    food_name: 'Pudingli petibör tatlısı',
    serving_description: 'Tarifin 1/4’ü',
    quantity: 0.25,
    unit_type: 'porsiyon',
    calculated: { calories: 260, protein_g: 6.4, carbs_g: 41.8, fat_g: 8.2, sugar_g: 24.1 },
  }, '2026-10-06', 'dinner');

  assert.equal(entry.type, 'dinner');
  assert.equal(entry.food_cache_id, undefined);
  assert.equal(entry.calories, 260);
});

test('allows the portion unit emitted by AI meal entries', () => {
  assert.equal(DAILY_LOG_UNITS.includes('porsiyon'), true);
});

test('splits a full-day prompt into separate meal entries and defaults unlabelled items to snack', () => {
  const result = validatePromptMealBatchResult({
    items: [
      { meal_type: 'breakfast', food_name: 'Yumurta', serving_description: '2 adet', quantity: 2, calculated: { calories: 140, protein_g: 12, carbs_g: 1, fat_g: 10, sugar_g: 0 } },
      { food_name: 'Elma', serving_description: '1 adet', quantity: 1, calculated: { calories: 95, protein_g: 0.5, carbs_g: 25, fat_g: 0.3, sugar_g: 19 } },
    ],
  });
  const entries = buildPromptMealEntries(result, '2026-10-11');

  assert.deepEqual(entries.map((item) => item.type), ['breakfast', 'snack']);
  assert.deepEqual(entries.map((item) => item.food_name), ['Yumurta', 'Elma']);
  assert.equal(entries.every((item) => item.food_cache_id === undefined), true);
});
