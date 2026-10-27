export const MANUAL_EXERCISE_TYPE = 'Manuel';

export type ExerciseSubmissionInput = {
  exerciseType: string;
  manualName: string;
  durationMinutes: string;
  burnedCalories: string;
};

export function buildExerciseSubmission(input: ExerciseSubmissionInput) {
  const name = input.exerciseType === MANUAL_EXERCISE_TYPE
    ? input.manualName.trim()
    : input.exerciseType.trim();
  const durationMinutes = Number(input.durationMinutes);
  const burnedCalories = Number(input.burnedCalories);

  if (!name) throw new Error('Egzersiz adı zorunludur.');
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) throw new Error('Süre 0’dan büyük olmalıdır.');
  if (!Number.isFinite(burnedCalories) || burnedCalories < 0) throw new Error('Yakılan kalori geçersiz.');

  return {
    name,
    duration_minutes: durationMinutes,
    calories_burned: burnedCalories,
  };
}
