import toast from 'react-hot-toast';
import { useState } from 'react';
import { addExerciseAction } from '@/actions/health';
import { calculateStepsCalories } from '@/lib/calories';

const MET_VALUES: Record<string, number> = {
  "Koşu": 8.0,
  "Yürüyüş": 3.8,
  "Ağırlık Antrenmanı": 4.0,
  "Bisiklet": 6.0,
  "Yüzme": 7.0,
  "Yoga": 3.0
};

export function useAddExerciseViewModel(onSuccess: () => void, userWeight: number = 70, currentDateStr?: string) {
  const [exerciseType, setExerciseType] = useState('Yürüyüş');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [stepCount, setStepCount] = useState('');
  const [burnedCalories, setBurnedCalories] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  const calculateExerciseCalories = (type: string, durationValue: string) => {
    const duration = Number(durationValue);
    if (!Number.isFinite(duration) || duration <= 0) return '';
    const met = MET_VALUES[type] || 4.0;
    return Math.round((met * userWeight * duration) / 60).toString();
  };

  const handleExerciseTypeChange = (value: string) => {
    setExerciseType(value);
    if (value === 'Adım Sayısı') {
      setDurationMinutes('');
      setStepCount('');
      setBurnedCalories('');
    } else {
      setBurnedCalories(calculateExerciseCalories(value, durationMinutes));
    }
  };

  const handleDurationChange = (value: string) => {
    setDurationMinutes(value);
    setBurnedCalories(calculateExerciseCalories(exerciseType, value));
  };

  const handleStepCountChange = (value: string) => {
    setStepCount(value);
    setBurnedCalories(calculateStepsCalories(userWeight, Number(value)).toString());
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);

    try {
      if (exerciseType === 'Adım Sayısı' && (!stepCount || Number(stepCount) <= 0)) throw new Error("Adım sayısı zorunludur.");
      if (exerciseType !== 'Adım Sayısı' && !durationMinutes) throw new Error("Süre zorunludur.");
      if (!burnedCalories) throw new Error("Yakılan kalori zorunludur.");

      const res = await addExerciseAction({
        date: currentDateStr || new Date().toISOString(),
        name: exerciseType,
        duration_minutes: exerciseType === 'Adım Sayısı' ? 0 : parseInt(durationMinutes),
        calories_burned: parseFloat(burnedCalories),
        ...(exerciseType === 'Adım Sayısı' ? { step_count: parseInt(stepCount) } : {})
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
    exerciseType, handleExerciseTypeChange,
    durationMinutes, handleDurationChange,
    stepCount, handleStepCountChange,
    burnedCalories, setBurnedCalories,
    isLoading,
    handleSubmit
  };
}
