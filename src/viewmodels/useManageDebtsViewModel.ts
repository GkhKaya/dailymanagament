import { useState } from 'react';
import { addDebtAction } from '@/actions/finance';
import { DebtDirection } from '@/models/Enums';

export function useManageDebtsViewModel(onSuccess: () => void) {
  const [debtDirection, setDebtDirection] = useState<DebtDirection>(DebtDirection.GIVEN);
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!personName) throw new Error("Kişi / Kurum zorunludur.");
      if (!amount) throw new Error("Tutar zorunludur.");

      const res = await addDebtAction({
        person_name: personName,
        direction: debtDirection,
        amount: parseFloat(amount),
        date: new Date().toISOString(), // Created date
        due_date: dueDate || undefined
      });

      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || "Borç eklenirken hata oluştu.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    debtDirection, setDebtDirection,
    personName, setPersonName,
    amount, setAmount,
    dueDate, setDueDate,
    isLoading, error,
    handleAdd
  };
}
