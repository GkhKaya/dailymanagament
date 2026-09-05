import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { updateDebtAction, deleteDebtAction } from '@/actions/finance';
import { useTranslation } from '@/hooks/useTranslation';

export function useEditDebtViewModel(
  initialData?: { id: string; personName: string; amount: number; dueDate?: string },
  onSuccess?: () => void
) {
  const { locale, isAbroad } = useTranslation();
  const isEn = isAbroad || locale === 'en';

  const [personName, setPersonName] = useState(initialData?.personName || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [dueDate, setDueDate] = useState(initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!initialData) return;
    
    if (!personName || !amount) {
      toast.error(isEn ? 'Please fill in required fields.' : 'Lütfen zorunlu alanları doldurun.');
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
        toast.success(isEn ? 'Debt/Receivable updated successfully.' : 'Borç/Alacak başarıyla güncellendi.');
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || (isEn ? 'Update failed.' : 'Güncelleme başarısız.'));
      }
    } catch (e: unknown) {
      toast.error(isEn ? 'An unexpected error occurred.' : 'Beklenmeyen bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;
    
    const confirmMsg = isEn ? 'Are you sure you want to delete this record?' : 'Bu kaydı silmek istediğinizden emin misiniz?';
    if (confirm(confirmMsg)) {
      setIsLoading(true);
      try {
        const res = await deleteDebtAction(initialData.id);
        if (res.success) {
          toast.success(isEn ? 'Record deleted.' : 'Kayıt silindi.');
          if (onSuccess) onSuccess();
        } else {
          toast.error(res.error || (isEn ? 'Delete failed.' : 'Silme işlemi başarısız.'));
        }
      } catch (e: unknown) {
        toast.error(isEn ? 'An unexpected error occurred.' : 'Beklenmeyen bir hata oluştu.');
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
