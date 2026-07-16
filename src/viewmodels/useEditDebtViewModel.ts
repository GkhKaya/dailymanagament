import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { updateDebtAction, deleteDebtAction } from '@/actions/finance';

export function useEditDebtViewModel(
  initialData?: { id: string; personName: string; amount: number; dueDate?: string },
  onSuccess?: () => void
) {
  const [personName, setPersonName] = useState(initialData?.personName || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [dueDate, setDueDate] = useState(initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!initialData) return;
    
    if (!personName || !amount) {
      toast.error("Lütfen zorunlu alanları doldurun.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await updateDebtAction(initialData.id, {
        person_name: personName,
        amount: parseFloat(amount),
        date: new Date().toISOString(), // keep current date
        due_date: dueDate || undefined
      });

      if (res.success) {
        toast.success("Borç/Alacak başarıyla güncellendi.");
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Güncelleme başarısız.");
      }
    } catch (e: unknown) {
      toast.error("Beklenmeyen bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;
    
    if (confirm("Bu kaydı silmek istediğinizden emin misiniz?")) {
      setIsLoading(true);
      try {
        const res = await deleteDebtAction(initialData.id);
        if (res.success) {
          toast.success("Kayıt silindi.");
          if (onSuccess) onSuccess();
        } else {
          toast.error(res.error || "Silme işlemi başarısız.");
        }
      } catch (e: unknown) {
        toast.error("Beklenmeyen bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return {
    personName, setPersonName,
    amount, setAmount,
    dueDate, setDueDate,
    isLoading,
    handleUpdate,
    handleDelete
  };
}
