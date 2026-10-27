import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExerciseSubmission } from '../src/lib/exercise-submission.ts';

test('builds a trimmed manual exercise payload from user-entered values', () => {
  const result = buildExerciseSubmission({
    exerciseType: 'Manuel',
    manualName: ' Kürek ergometresi ',
    durationMinutes: '35',
    burnedCalories: '280',
  });

  assert.deepEqual(result, {
    name: 'Kürek ergometresi',
    duration_minutes: 35,
    calories_burned: 280,
  });
});

test('rejects a manual exercise without a name', () => {
  assert.throws(
    () => buildExerciseSubmission({ exerciseType: 'Manuel', manualName: '   ', durationMinutes: '35', burnedCalories: '280' }),
    /Egzersiz adı zorunludur/,
  );
});
