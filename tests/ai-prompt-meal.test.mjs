import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPromptMealEntry,
  validatePromptMealRequest,
} from '../src/lib/ai-prompt-meal.ts';

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
