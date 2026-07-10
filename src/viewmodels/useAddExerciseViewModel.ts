import { useState } from 'react';
import { addExerciseAction } from '@/actions/health';

export function useAddExerciseViewModel(onSuccess: () => void) {
  const [exerciseType, setExerciseType] = useState('Yürüyüş');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [burnedCalories, setBurnedCalories] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!durationMinutes) throw new Error("Süre zorunludur.");
      if (!burnedCalories) throw new Error("Yakılan kalori zorunludur.");

      const res = await addExerciseAction({
        date: new Date().toISOString(),
        exercise_type: exerciseType,
        duration_minutes: parseInt(durationMinutes),
        burned_calories: parseFloat(burnedCalories)
      });

      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || "Egzersiz eklenirken hata oluştu.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    exerciseType, setExerciseType,
    durationMinutes, setDurationMinutes,
    burnedCalories, setBurnedCalories,
    isLoading, error,
    handleSubmit
  };
}
