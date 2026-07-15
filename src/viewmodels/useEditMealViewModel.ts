import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { updateMealAction, deleteMealAction } from '@/actions/health';

export function useEditMealViewModel(initialData: any, onSuccess?: () => void) {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>(initialData?.type || 'lunch');
  const [foodName, setFoodName] = useState(initialData?.name || '');
  
  // The amount is a string like "1 Porsiyon", we can parse out the number and unit if we want,
  // but for simplicity we will just have amount (number) and unit (string) in state.
  const parseAmount = (desc: string) => {
    if (!desc) return { qty: 1, unit: 'portion' };
    const match = desc.match(/^([\d.]+)\s*(.*)$/);
    if (match) {
      const u = match[2].toLowerCase();
      let unit = 'portion';
      if (u.includes('porsiyon')) unit = 'portion';
      if (u.includes('gram') || u === 'g') unit = 'gram';
      if (u.includes('adet')) unit = 'piece';
      if (u.includes('ml')) unit = 'ml';
      return { qty: parseFloat(match[1]), unit };
    }
    return { qty: 1, unit: 'portion' };
  };

  const parsed = parseAmount(initialData?.amount);
  const [quantity, setQuantity] = useState(parsed.qty);
  const [unit, setUnit] = useState(parsed.unit);
  const [calories, setCalories] = useState(initialData?.calories?.toString() || '0');
  
  const [protein, setProtein] = useState((initialData?.protein || 0).toString());
  const [carbs, setCarbs] = useState((initialData?.carbs || 0).toString());
  const [fat, setFat] = useState((initialData?.fat || 0).toString());

  const [baseMacros] = useState(() => {
    const bq = parsed.qty || 1;
    return {
      c: (initialData?.calories || 0) / bq,
      p: (initialData?.protein || 0) / bq,
      cb: (initialData?.carbs || 0) / bq,
      f: (initialData?.fat || 0) / bq
    };
  });

  useEffect(() => {
    const q = quantity || 0;
    setCalories(Math.round(baseMacros.c * q).toString());
    setProtein(Math.round(baseMacros.p * q).toString());
    setCarbs(Math.round(baseMacros.cb * q).toString());
    setFat(Math.round(baseMacros.f * q).toString());
  }, [quantity, baseMacros]);

  const [isLoading, setIsLoading] = useState(false);
  

  const getServingDesc = () => {
    switch (unit) {
      case 'portion': return `${quantity} Porsiyon`;
      case 'gram': return `${quantity} Gram`;
      case 'piece': return `${quantity} Adet`;
      case 'ml': return `${quantity} ml`;
      default: return `${quantity} Porsiyon`;
    }
  };

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!initialData?.id || !initialData?.date) return;
    
    setIsLoading(true);
    
    try {
      const payload: any = {
        date: initialData.date,
        entry_id: initialData.id,
        type: mealType,
        old_type: initialData.type,
        food_name: foodName,
        serving_description: getServingDesc(),
        calories: parseInt(calories, 10),
        protein_g: parseFloat(protein) || 0,
        carbs_g: parseFloat(carbs) || 0,
        fat_g: parseFloat(fat) || 0
      };
      
      const res = await updateMealAction(payload);
      
      if (res.success) {
        onSuccess && onSuccess();
      } else {
        toast.error(res.error || "Güncelleme başarısız.");
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || "Bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id || !initialData?.date) return;
    if (!window.confirm("Bu yemeği silmek istediğinize emin misiniz?")) return;
    
    setIsLoading(true);
    
    try {
      const res = await deleteMealAction({
        date: initialData.date,
        entry_id: initialData.id,
        type: initialData.type
      });
      if (res.success) {
        onSuccess && onSuccess();
      } else {
        toast.error(res.error || "Silme işlemi başarısız.");
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || "Bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mealType, setMealType,
    foodName, setFoodName,
    quantity, setQuantity,
    unit, setUnit,
    calories, setCalories,
    protein, carbs, fat,
    getServingDesc,
    isLoading,
    handleUpdate, handleDelete
  };
}
