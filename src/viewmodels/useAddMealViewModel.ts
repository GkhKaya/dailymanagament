import toast from 'react-hot-toast';
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
  

  const [savedFoods, setSavedFoods] = useState<any[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [selectedSavedFoods, setSelectedSavedFoods] = useState<string[]>([]);

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
        toast.error(res.error || "Öğün eklenirken hata oluştu.");
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMultiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSavedFoods.length === 0) return;
    
    
    setIsLoading(true);

    try {
      const selected = savedFoods.filter(f => selectedSavedFoods.includes(f.id));
      
      const promises = selected.map(food => {
        return addMealAction({
          date: new Date().toISOString(),
          type,
          food_name: food.food_name,
          serving_description: food.serving_description || '1 porsiyon',
          quantity: parseFloat(food.quantity) || 1,
          calories: parseFloat(food.calories) || 0,
          protein_g: parseFloat(food.protein_g) || 0,
          carbs_g: parseFloat(food.carbs_g) || 0,
          fat_g: parseFloat(food.fat_g) || 0,
          fatsecret_food_id: food.fatsecret_food_id || undefined,
          save_as_recipe: false
        });
      });

      const results = await Promise.all(promises);
      const hasError = results.some(r => !r.success);
      
      if (!hasError) {
        onSuccess();
      } else {
        toast.error("Bazı öğünler eklenirken hata oluştu.");
      }
    } catch (err: any) {
      toast.error(err.message);
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
    selectedSavedFoods, setSelectedSavedFoods,
    isLoading,
    handleSubmit, handleMultiSubmit
  };
}
