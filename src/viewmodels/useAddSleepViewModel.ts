import toast from 'react-hot-toast';
import { useState } from 'react';
import { addSleepAction } from '@/actions/health';

export function useAddSleepViewModel(onSuccess: () => void) {
  const [hours, setHours] = useState('');
  const [mins, setMins] = useState('');
  const [quality, setQuality] = useState('İyi');
  
  const [isLoading, setIsLoading] = useState(false);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        toast.error(res.error || "Uyku eklenirken hata oluştu.");
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    hours, setHours,
    mins, setMins,
    quality, setQuality,
    isLoading,
    handleSubmit
  };
}
