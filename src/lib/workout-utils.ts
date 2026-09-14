export interface IExerciseSet {
  set_number: number;
  weight_kg: number;
  reps: string;
  completed?: boolean;
}

export interface IWorkoutExercise {
  name: string;
  sets: number;
  reps?: string;
  weight_kg?: number;
  sets_detail?: IExerciseSet[];
}

/**
 * Egzersiz hareketleri için YouTube video rehber URL'i oluşturur.
 * Kullanıcı antrenmanındaki bir harekete tıkladığında doğrudan o hareketin yapılış videosunu açar.
 */
export function getExerciseVideoUrl(exerciseName?: string): string {
  const clean = (exerciseName || '').trim();
  if (!clean) return '#';

  const hasInstructionKeyword = /(nasıl yapılır|egzersiz|hareketi|form|tutorial|how to|yapılışı)/i.test(clean);
  const searchQuery = hasInstructionKeyword ? clean : `${clean} nasıl yapılır egzersiz`;

  return `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
}

/**
 * Bir egzersiz için varsayılan set detaylarını oluşturur.
 */
export function createDefaultSets(
  setsCount: number = 3,
  defaultWeightKg: number = 0,
  defaultReps: string = "10"
): IExerciseSet[] {
  const count = Math.max(1, Math.min(30, setsCount || 3));
  return Array.from({ length: count }, (_, i) => ({
    set_number: i + 1,
    weight_kg: Number(defaultWeightKg) || 0,
    reps: String(defaultReps || "10"),
    completed: false
  }));
}

/**
 * Bir antrenman gününün tamamlanan ve toplam set sayılarını hesaplar.
 */
export function calculateDayProgress(exercises: IWorkoutExercise[] = []): {
  totalSets: number;
  completedSets: number;
  progressPercent: number;
  totalVolumeKg: number;
} {
  let totalSets = 0;
  let completedSets = 0;
  let totalVolumeKg = 0;

  for (const ex of exercises) {
    const sets = ex.sets_detail && ex.sets_detail.length > 0
      ? ex.sets_detail
      : createDefaultSets(ex.sets, ex.weight_kg, ex.reps);

    totalSets += sets.length;
    for (const s of sets) {
      if (s.completed) {
        completedSets += 1;
        const repsNum = parseInt(String(s.reps)) || 0;
        totalVolumeKg += (Number(s.weight_kg) || 0) * repsNum;
      }
    }
  }

  const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  return { totalSets, completedSets, progressPercent, totalVolumeKg };
}
