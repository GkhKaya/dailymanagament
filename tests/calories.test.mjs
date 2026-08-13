import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStepsCalories } from '../src/lib/calories.ts';

test('steps add an activity estimate based on body weight', () => {
  assert.equal(calculateStepsCalories(70, 10_000), 350);
});

test('invalid step or weight values do not add calories', () => {
  assert.equal(calculateStepsCalories(70, 0), 0);
  assert.equal(calculateStepsCalories(0, 10_000), 0);
});
