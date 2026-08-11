import toast from 'react-hot-toast';
import { useState } from 'react';
import { addSubscriptionAction } from '@/actions/finance';

export function useManageSubscriptionsViewModel(onSuccess: () => void) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingDay, setBillingDay] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  
  const [isLoading, setIsLoading] = useState(false);
  

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);

    try {
      if (!name) throw new Error("Abonelik adı zorunludur.");
      if (!amount) throw new Error("Aylık ücret zorunludur.");
      if (!billingDay) throw new Error("Kesim günü zorunludur.");
      if (!accountId) throw new Error("Hesap seçimi zorunludur.");
      if (!categoryId) throw new Error("Kategori seçimi zorunludur.");

      const res = await addSubscriptionAction({
        name,
        amount: parseFloat(amount),
        frequency,
        category_id: categoryId,
        account_id: accountId,
        billing_day: parseInt(billingDay)
      });

      if (res.success) {
        onSuccess();
      } else {
        toast.error(res.error || "Abonelik eklenirken hata oluştu.");
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    name, setName,
    amount, setAmount,
    billingDay, setBillingDay,
    accountId, setAccountId,
    categoryId, setCategoryId,
    frequency, setFrequency,
    isLoading,
    handleAdd
  };
}
