import toast from 'react-hot-toast';
import { useState, FormEvent } from 'react';
import { addWeightLogAction } from '@/actions/health';

export function useAddWeightViewModel(
  initialWeight: number,
  currentDate: string,
  onSuccess?: () => void
) {
  const [weight, setWeight] = useState(initialWeight ? initialWeight.toString() : '');
  const [loading, setLoading] = useState(false);
  

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    

    const weightVal = parseFloat(weight);
    if (isNaN(weightVal) || weightVal <= 0) {
      toast.error("Geçerli bir kilo girin.");
      setLoading(false);
      return;
    }

    try {
      const res = await addWeightLogAction({
        date: currentDate,
        weight: weightVal
      });

      if (res.success) {
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Hata oluştu.");
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || "Beklenmeyen hata.");
    } finally {
      setLoading(false);
    }
  };

  return {
    weight,
    setWeight,
    handleSubmit,
    loading
  };
}
