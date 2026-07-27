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
  const [sugar, setSugar] = useState('0');
  const [unitType, setUnitType] = useState<'gram' | 'adet'>('gram');
  const [fatsecretFoodId, setFatsecretFoodId] = useState<string | null>(null);
  const [saveAsRecipe, setSaveAsRecipe] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  

  const [savedFoods, setSavedFoods] = useState<any[]>([]);
  const [recentByType, setRecentByType] = useState<any>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  });
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [selectedSavedFoods, setSelectedSavedFoods] = useState<string[]>([]);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await getSavedFoodsAction();
        if (res.success && res.data) {
          setSavedFoods(res.data.savedFoods || []);
          setRecentByType(res.data.recentByType || { breakfast: [], lunch: [], dinner: [], snack: [] });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingSaved(false);
      }
    };
    fetchSaved();
  }, []);

  const handleSubmit = async (e: React.FormEvent): Promise<{ success: boolean; item?: any }> => {
    e.preventDefault();
    
    setIsLoading(true);

    try {
      if (!foodName) throw new Error("Yemek adı zorunludur.");
      if (!calories) throw new Error("Kalori miktarı zorunludur.");

      const addedName = foodName;
      const parsedQty = parseFloat(quantity) || 1;
      const parsedCal = parseFloat(calories) || 0;
      const parsedProt = parseFloat(protein) || 0;
      const parsedCarbs = parseFloat(carbs) || 0;
      const parsedFat = parseFloat(fat) || 0;
      const parsedSugar = parseFloat(sugar) || 0;

      const res = await addMealAction({
        date: new Date().toISOString(),
        type,
        food_name: foodName,
        serving_description: servingDescription,
        quantity: parsedQty,
        unit_type: unitType,
        calories: parsedCal,
        protein_g: parsedProt,
        carbs_g: parsedCarbs,
        fat_g: parsedFat,
        sugar_g: parsedSugar,
        food_cache_id: fatsecretFoodId || undefined,
        save_as_recipe: saveAsRecipe
      });

      if (res.success) {
        toast.success(`"${addedName}" öğüne eklendi!`);
        onSuccess();
        return {
          success: true,
          item: {
            entry_id: res.entry_id,
            food_name: addedName,
            quantity: parsedQty,
            unit_type: unitType,
            serving_description: servingDescription,
            calories: parsedCal,
            protein_g: parsedProt,
            carbs_g: parsedCarbs,
            fat_g: parsedFat,
            sugar_g: parsedSugar,
            type
          }
        };
      } else {
        toast.error(res.error || "Öğün eklenirken hata oluştu.");
        return { success: false };
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const handleMultiSubmit = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    if (selectedSavedFoods.length === 0) return false;
    
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
          unit_type: food.unit_type || 'gram',
          calories: parseFloat(food.calories) || 0,
          protein_g: parseFloat(food.protein_g) || 0,
          carbs_g: parseFloat(food.carbs_g) || 0,
          fat_g: parseFloat(food.fat_g) || 0,
          sugar_g: parseFloat(food.sugar_g) || 0,
          food_cache_id: food.food_cache_id || food.fatsecret_food_id || undefined,
          save_as_recipe: false
        });
      });

      const results = await Promise.all(promises);
      const hasError = results.some(r => !r.success);
      
      if (!hasError) {
        toast.success(`${selected.length} öğün eklendi!`);
        setSelectedSavedFoods([]);
        onSuccess();
        return true;
      } else {
        toast.error("Bazı öğünler eklenirken hata oluştu.");
        return false;
      }
    } catch (err: any) {
      toast.error(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    type, setType,
    foodName, setFoodName,
    servingDescription, setServingDescription,
    quantity, setQuantity,
    unitType, setUnitType,
    calories, setCalories,
    protein, setProtein,
    carbs, setCarbs,
    fat, setFat,
    sugar, setSugar,
    fatsecretFoodId, setFatsecretFoodId,
    saveAsRecipe, setSaveAsRecipe,
    savedFoods, recentByType, isLoadingSaved,
    selectedSavedFoods, setSelectedSavedFoods,
    isLoading,
    handleSubmit, handleMultiSubmit
  };
}
