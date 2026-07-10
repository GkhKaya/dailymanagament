import { useState } from 'react';
import { addTransactionAction } from '@/actions/finance';

export function useAddTransactionViewModel(onSuccess: () => void) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [description, setDescription] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!amount) throw new Error("Tutar zorunludur.");
      if (!categoryId) throw new Error("Kategori seçimi zorunludur.");
      if (!accountId) throw new Error("Hesap seçimi zorunludur.");
      if (!description) throw new Error("Açıklama zorunludur.");

      const res = await addTransactionAction({
        type,
        amount: parseFloat(amount),
        date,
        description,
        category_id: categoryId,
        account_id: accountId
      });

      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || "İşlem eklenirken bir hata oluştu.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    type, setType,
    amount, setAmount,
    date, setDate,
    categoryId, setCategoryId,
    accountId, setAccountId,
    description, setDescription,
    isLoading, error,
    handleSubmit
  };
}
