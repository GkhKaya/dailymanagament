import { useState } from 'react';
import { addSleepAction } from '@/actions/health';

export function useAddSleepViewModel(onSuccess: () => void) {
  const [hours, setHours] = useState('');
  const [mins, setMins] = useState('');
  const [quality, setQuality] = useState('İyi');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const h = parseInt(hours || '0');
      const m = parseInt(mins || '0');
      const totalMinutes = h * 60 + m;

      if (totalMinutes <= 0) throw new Error("Süre zorunludur.");

      const res = await addSleepAction({
        date: new Date().toISOString(),
        duration_minutes: totalMinutes,
        quality
      });

      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || "Uyku eklenirken hata oluştu.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    hours, setHours,
    mins, setMins,
    quality, setQuality,
    isLoading, error,
    handleSubmit
  };
}
