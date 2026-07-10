import { useState } from 'react';
import { addMealAction } from '@/actions/health';

export function useAddMealViewModel(onSuccess: () => void) {
  const [type, setType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [foodName, setFoodName] = useState('');
  const [servingDescription, setServingDescription] = useState('1 porsiyon');
  const [quantity, setQuantity] = useState('1');
  const [calories, setCalories] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!foodName) throw new Error("Yemek adı zorunludur.");
      if (!calories) throw new Error("Kalori miktarı zorunludur.");

      const res = await addMealAction({
        date: new Date().toISOString(),
        type,
        food_name: foodName,
        serving_description: servingDescription,
        quantity: parseFloat(quantity),
        calories: parseFloat(calories)
      });

      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || "Öğün eklenirken hata oluştu.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    type, setType,
    foodName, setFoodName,
    servingDescription, setServingDescription,
    quantity, setQuantity,
    calories, setCalories,
    isLoading, error,
    handleSubmit
  };
}
