import { useState, FormEvent } from 'react';
import { addWeightLogAction } from '@/actions/health';

export function useAddWeightViewModel(
  initialWeight: number,
  currentDate: string,
  onSuccess?: () => void
) {
  const [weight, setWeight] = useState(initialWeight ? initialWeight.toString() : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const weightVal = parseFloat(weight);
    if (isNaN(weightVal) || weightVal <= 0) {
      setError("Geçerli bir kilo girin.");
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
        setError(res.error || "Hata oluştu.");
      }
    } catch (err: any) {
      setError(err.message || "Beklenmeyen hata.");
    } finally {
      setLoading(false);
    }
  };

  return {
    weight,
    setWeight,
    handleSubmit,
    loading,
    error
  };
}
