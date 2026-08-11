import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { updateSubscriptionAction, deleteSubscriptionAction } from '@/actions/finance';

export function useEditSubscriptionViewModel(
  initialData?: { id: string; name: string; amount: number; billingDay: number },
  onSuccess?: () => void
) {
  const [name, setName] = useState(initialData?.name || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [billingDay, setBillingDay] = useState(initialData?.billingDay?.toString() || '1');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!initialData) return;
    
    if (!name || !amount || !billingDay) {
      toast.error("Lütfen tüm alanları doldurun.");
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
        toast.success("Abonelik başarıyla güncellendi.");
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
    
    if (confirm("Bu aboneliği silmek istediğinizden emin misiniz?")) {
      setIsLoading(true);
      try {
        const res = await deleteSubscriptionAction(initialData.id);
        if (res.success) {
          toast.success("Abonelik silindi.");
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
    name, setName,
    amount, setAmount,
    billingDay, setBillingDay,
    isLoading,
    handleUpdate,
    handleDelete
  };
}
