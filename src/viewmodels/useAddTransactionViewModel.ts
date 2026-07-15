import toast from 'react-hot-toast';
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
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);

    try {
      if (!amount) throw new Error("Tutar zorunludur.");
      if (!categoryId) throw new Error("Kategori seçimi zorunludur.");
      if (!accountId) throw new Error("Hesap seçimi zorunludur.");

      const res = await addTransactionAction({
        type,
        amount: parseFloat(amount),
        date,
        description: description || "İşlem",
        category_id: categoryId,
        account_id: accountId
      });

      if (res.success) {
        onSuccess();
      } else {
        toast.error(res.error || "İşlem eklenirken bir hata oluştu.");
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
    amount, setAmount,
    date, setDate,
    categoryId, setCategoryId,
    accountId, setAccountId,
    description, setDescription,
    isLoading,
    handleSubmit
  };
}
