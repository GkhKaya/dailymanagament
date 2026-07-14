import { useState } from 'react';
import { updateAgeAction } from '@/actions/profile';

export function useUpdateAgeViewModel(onSuccess: () => void, initialBirthDate?: string | null) {
  const [birthDate, setBirthDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!birthDate) throw new Error("Doğum tarihinizi girmelisiniz.");
      
      const res = await updateAgeAction(birthDate);

      if (!res.success) {
        throw new Error(res.error || "Yaş güncellenirken bir hata oluştu.");
      }

      onSuccess();
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    birthDate, setBirthDate,
    isLoading, error, handleSubmit
  };
}
