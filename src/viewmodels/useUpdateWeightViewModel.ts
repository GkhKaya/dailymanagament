import toast from 'react-hot-toast';
import { useState } from 'react';
import { updateWeightAction } from '@/actions/profile';

export function useUpdateWeightViewModel(onSuccess: () => void, initialWeight?: number) {
  const [weight, setWeight] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);

    try {
      if (!weight) throw new Error("Kilo bilginizi girmelisiniz.");
      
      const res = await updateWeightAction(parseFloat(weight));

      if (!res.success) {
        throw new Error(res.error || "Kilo güncellenirken bir hata oluştu.");
      }

      onSuccess();
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    weight, setWeight,
    isLoading, handleSubmit
  };
}
