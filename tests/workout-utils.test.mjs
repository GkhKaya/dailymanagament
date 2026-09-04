import test from 'node:test';
import assert from 'node:assert/strict';
import { getExerciseVideoUrl } from '../src/lib/workout-utils.ts';

test('generates valid YouTube search URL for exercise', () => {
  const url = getExerciseVideoUrl('Bench Press');
  assert.ok(url.startsWith('https://www.youtube.com/results?search_query='));
  assert.ok(url.includes('Bench%20Press'));
  assert.ok(url.includes('nas%C4%B1l%20yap%C4%B1l%C4%B1r'));
});

test('does not duplicate instruction keywords if already present', () => {
  const url = getExerciseVideoUrl('Squat nasıl yapılır');
  assert.equal(url, 'https://www.youtube.com/results?search_query=Squat%20nas%C4%B1l%20yap%C4%B1l%C4%B1r');
});

test('handles empty or whitespace-only inputs gracefully', () => {
  assert.equal(getExerciseVideoUrl(''), '#');
  assert.equal(getExerciseVideoUrl('   '), '#');
  assert.equal(getExerciseVideoUrl(undefined), '#');
});
