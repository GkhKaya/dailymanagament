import toast from 'react-hot-toast';
import { useState } from 'react';
import { addDebtAction } from '@/actions/finance';
import { DebtDirection } from '@/models/Enums';

export function useManageDebtsViewModel(onSuccess: () => void) {
  const [debtDirection, setDebtDirection] = useState<DebtDirection>(DebtDirection.GIVEN);
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        toast.error(res.error || "Borç eklenirken hata oluştu.");
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    debtDirection, setDebtDirection,
    personName, setPersonName,
    amount, setAmount,
    dueDate, setDueDate,
    isLoading,
    handleAdd
  };
}
