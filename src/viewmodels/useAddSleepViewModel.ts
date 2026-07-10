import { useState } from 'react';
import { addSleepAction } from '@/actions/health';

export function useAddSleepViewModel(onSuccess: () => void) {
  const [durationMinutes, setDurationMinutes] = useState('');
  const [quality, setQuality] = useState('İyi');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!durationMinutes) throw new Error("Süre zorunludur.");

      const res = await addSleepAction({
        date: new Date().toISOString(),
        duration_minutes: parseInt(durationMinutes),
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
    durationMinutes, setDurationMinutes,
    quality, setQuality,
    isLoading, error,
    handleSubmit
  };
}
