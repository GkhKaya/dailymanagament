import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { updateSubscriptionAction, deleteSubscriptionAction } from '@/actions/finance';
import { useTranslation } from '@/hooks/useTranslation';

export function useEditSubscriptionViewModel(
  initialData?: { id: string; name: string; amount: number; billingDay: number },
  onSuccess?: () => void
) {
  const { locale, isAbroad } = useTranslation();
  const isEn = isAbroad || locale === 'en';

  const [name, setName] = useState(initialData?.name || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [billingDay, setBillingDay] = useState(initialData?.billingDay?.toString() || '1');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!initialData) return;
    
    if (!name || !amount || !billingDay) {
      toast.error(isEn ? 'Please fill in all fields.' : 'Lütfen tüm alanları doldurun.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await updateSubscriptionAction(initialData.id, {
        name,
        amount: parseFloat(amount),
        billing_day: parseInt(billingDay, 10),
      });

      if (res.success) {
        toast.success(isEn ? 'Subscription updated successfully.' : 'Abonelik başarıyla güncellendi.');
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
    
    const confirmMsg = isEn ? 'Are you sure you want to delete this subscription?' : 'Bu aboneliği silmek istediğinizden emin misiniz?';
    if (confirm(confirmMsg)) {
      setIsLoading(true);
      try {
        const res = await deleteSubscriptionAction(initialData.id);
        if (res.success) {
          toast.success(isEn ? 'Subscription deleted.' : 'Abonelik silindi.');
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
    name, setName,
    amount, setAmount,
    billingDay, setBillingDay,
    isLoading,
    handleUpdate,
    handleDelete
  };
}
