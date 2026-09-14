import toast from 'react-hot-toast';
import { useState } from 'react';
import { addCategoryAction, deleteCategoryAction } from '@/actions/finance';

export function useManageCategoriesViewModel(onSuccess: () => void) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('cart');
  const [color, setColor] = useState('#f97316');
  
  const [isLoading, setIsLoading] = useState(false);
  

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);

    try {
      if (!name) throw new Error("Kategori adı zorunludur.");

      const res = await addCategoryAction({
        name,
        type,
        icon,
        color
      });

      if (res.success) {
        setName('');
        onSuccess(); // Triggers refreshData
      } else {
        toast.error(res.error || "Kategori eklenirken hata oluştu.");
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kategoriyi silmek istediğinize emin misiniz? (Bağlı işlemler etkilenebilir)")) return;
    
    
    setIsLoading(true);

    try {
      const res = await deleteCategoryAction(id);
      if (res.success) {
        onSuccess();
      } else {
        toast.error(res.error || "Kategori silinirken hata oluştu.");
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    type, setType,
    name, setName,
    icon, setIcon,
    color, setColor,
    isLoading,
    handleAdd, handleDelete
  };
}
