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
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
        setError(res.error || "Abonelik eklenirken hata oluştu.");
      }
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message);
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
    isLoading, error,
    handleAdd
  };
}
