import test from 'node:test';
import assert from 'node:assert/strict';
import { getExerciseVideoUrl, createDefaultSets, calculateDayProgress } from '../src/lib/workout-utils.ts';

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

test('createDefaultSets generates proper sets structure with default values', () => {
  const sets = createDefaultSets(4, 70, '12');
  assert.equal(sets.length, 4);
  assert.equal(sets[0].set_number, 1);
  assert.equal(sets[0].weight_kg, 70);
  assert.equal(sets[0].reps, '12');
  assert.equal(sets[0].completed, false);
  assert.equal(sets[3].set_number, 4);
});

test('calculateDayProgress computes total and completed sets and volume accurately', () => {
  const mockExercises = [
    {
      name: 'Bench Press',
      sets: 3,
      reps: '10',
      weight_kg: 80,
      sets_detail: [
        { set_number: 1, weight_kg: 80, reps: '10', completed: true },
        { set_number: 2, weight_kg: 80, reps: '10', completed: true },
        { set_number: 3, weight_kg: 80, reps: '8', completed: false },
      ]
    },
    {
      name: 'Incline Press',
      sets: 2,
      reps: '12',
      weight_kg: 30,
      sets_detail: [
        { set_number: 1, weight_kg: 30, reps: '12', completed: true },
        { set_number: 2, weight_kg: 30, reps: '12', completed: false },
      ]
    }
  ];

  const progress = calculateDayProgress(mockExercises);
  assert.equal(progress.totalSets, 5);
  assert.equal(progress.completedSets, 3);
  assert.equal(progress.progressPercent, 60);
  // Volume: (80*10) + (80*10) + (30*12) = 800 + 800 + 360 = 1960
  assert.equal(progress.totalVolumeKg, 1960);
});
