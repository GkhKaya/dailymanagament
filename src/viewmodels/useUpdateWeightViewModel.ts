import toast from 'react-hot-toast';
import { useState } from 'react';
import { updateWeightAction } from '@/actions/profile';

export function useUpdateWeightViewModel(
  onSuccess: () => void, 
  initialWeight?: number,
  initialTargetWeight?: number,
  initialTargetDate?: string
) {
  const [weight, setWeight] = useState(initialWeight ? initialWeight.toString() : '');
  const [targetWeight, setTargetWeight] = useState(initialTargetWeight ? initialTargetWeight.toString() : '');
  const [targetDate, setTargetDate] = useState(initialTargetDate ? new Date(initialTargetDate).toISOString().split('T')[0] : '');
  const [isLoading, setIsLoading] = useState(false);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);

    try {
      if (!weight) throw new Error("Mevcut kilonuzu girmelisiniz.");
      
      const payload: any = { currentWeight: parseFloat(weight) };
      if (targetWeight) payload.targetWeight = parseFloat(targetWeight);
      if (targetDate) payload.targetDate = targetDate;
      
      const res = await updateWeightAction(payload);

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
    targetWeight, setTargetWeight,
    targetDate, setTargetDate,
    isLoading, handleSubmit
  };
}
