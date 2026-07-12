import { useState, useEffect } from 'react';
import { addMealAction, getSavedFoodsAction } from '@/actions/health';

export function useAddMealViewModel(onSuccess: () => void) {
  const [type, setType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [foodName, setFoodName] = useState('');
  const [servingDescription, setServingDescription] = useState('1 porsiyon');
  const [quantity, setQuantity] = useState('1');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('0');
  const [carbs, setCarbs] = useState('0');
  const [fat, setFat] = useState('0');
  const [fatsecretFoodId, setFatsecretFoodId] = useState<string | null>(null);
  const [saveAsRecipe, setSaveAsRecipe] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [savedFoods, setSavedFoods] = useState<any[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await getSavedFoodsAction();
        if (res.success && res.data) setSavedFoods(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingSaved(false);
      }
    };
    fetchSaved();
  }, []);

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
        calories: parseFloat(calories),
        protein_g: parseFloat(protein) || 0,
        carbs_g: parseFloat(carbs) || 0,
        fat_g: parseFloat(fat),
        fatsecret_food_id: fatsecretFoodId || undefined,
        save_as_recipe: saveAsRecipe
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
    protein, setProtein,
    carbs, setCarbs,
    fat, setFat,
    fatsecretFoodId, setFatsecretFoodId,
    saveAsRecipe, setSaveAsRecipe,
    savedFoods, isLoadingSaved,
    isLoading, error,
    handleSubmit
  };
}
