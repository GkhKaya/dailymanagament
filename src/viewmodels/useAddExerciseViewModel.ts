import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { addExerciseAction } from '@/actions/health';

const MET_VALUES: Record<string, number> = {
  "Koşu": 8.0,
  "Yürüyüş": 3.8,
  "Ağırlık Antrenmanı": 4.0,
  "Bisiklet": 6.0,
  "Yüzme": 7.0,
  "Yoga": 3.0
};

export function useAddExerciseViewModel(onSuccess: () => void, userWeight: number = 70) {
  const [exerciseType, setExerciseType] = useState('Yürüyüş');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [burnedCalories, setBurnedCalories] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (durationMinutes && !isNaN(Number(durationMinutes))) {
      const duration = Number(durationMinutes);
      const met = MET_VALUES[exerciseType] || 4.0;
      const estimatedCalories = Math.round((met * userWeight * duration) / 60);
      setBurnedCalories(estimatedCalories.toString());
    } else {
      setBurnedCalories('');
    }
  }, [exerciseType, durationMinutes, userWeight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);

    try {
      if (!durationMinutes) throw new Error("Süre zorunludur.");
      if (!burnedCalories) throw new Error("Yakılan kalori zorunludur.");

      const res = await addExerciseAction({
        date: new Date().toISOString(),
        name: exerciseType,
        duration_minutes: parseInt(durationMinutes),
        calories_burned: parseFloat(burnedCalories)
      });

      if (res.success) {
        onSuccess();
      } else {
        toast.error(res.error || "Egzersiz eklenirken hata oluştu.");
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    exerciseType, setExerciseType,
    durationMinutes, setDurationMinutes,
    burnedCalories, setBurnedCalories,
    isLoading,
    handleSubmit
  };
}
