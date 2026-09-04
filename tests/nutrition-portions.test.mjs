import test from 'node:test';
import assert from 'node:assert/strict';

// Helper function simulating the portion calculation logic
function calculatePortionMacros(perUnit, amount, portion) {
  const qty = parseFloat(amount) || 0;
  let multiplier = qty;

  if (!portion || portion.isRawGram) {
    multiplier = qty;
  } else {
    multiplier = qty * portion.gram_weight;
  }

  return {
    calories: Math.round(perUnit.calories * multiplier),
    protein: Math.round(perUnit.protein_g * multiplier * 10) / 10,
    carbs: Math.round(perUnit.carbs_g * multiplier * 10) / 10,
    fat: Math.round(perUnit.fat_g * multiplier * 10) / 10,
    effectiveWeight: multiplier
  };
}

test('calculatePortionMacros computes raw 100g correctly', () => {
  const perUnit = { calories: 0.56, protein_g: 0.032, carbs_g: 0.085, fat_g: 0.011 };
  const res = calculatePortionMacros(perUnit, 100, { name: '100 Gram', gram_weight: 100, isRawGram: true });
  assert.equal(res.calories, 56);
  assert.equal(res.protein, 3.2);
  assert.equal(res.carbs, 8.5);
  assert.equal(res.fat, 1.1);
  assert.equal(res.effectiveWeight, 100);
});

test('calculatePortionMacros computes household 1 kase (250g) correctly', () => {
  const perUnit = { calories: 0.56, protein_g: 0.032, carbs_g: 0.085, fat_g: 0.011 };
  const res = calculatePortionMacros(perUnit, 1, { name: '1 Kase (250g)', gram_weight: 250, isRawGram: false });
  assert.equal(res.calories, 140);
  assert.equal(res.protein, 8);
  assert.equal(res.effectiveWeight, 250);
});

test('calculatePortionMacros computes multiplier for 2 yemek kaşığı (15g each = 30g)', () => {
  const perUnit = { calories: 8.84, protein_g: 0, carbs_g: 0, fat_g: 1.0 }; // Olive oil
  const res = calculatePortionMacros(perUnit, 2, { name: '1 Yemek Kaşığı (15g)', gram_weight: 15, isRawGram: false });
  assert.equal(res.calories, 265);
  assert.equal(res.fat, 30);
  assert.equal(res.effectiveWeight, 30);
});
