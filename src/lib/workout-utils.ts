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
