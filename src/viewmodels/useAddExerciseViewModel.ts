import toast from 'react-hot-toast';
import { useState } from 'react';
import { addExerciseAction } from '@/actions/health';

export function useAddExerciseViewModel(onSuccess: () => void) {
  const [exerciseType, setExerciseType] = useState('Yürüyüş');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [burnedCalories, setBurnedCalories] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  

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
