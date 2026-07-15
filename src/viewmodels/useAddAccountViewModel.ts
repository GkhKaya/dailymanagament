import toast from 'react-hot-toast';
import { useState } from 'react';
import { addAccountAction } from '@/actions/finance';

export function useAddAccountViewModel(onSuccess: (id?: string, name?: string) => void) {
  const [accountType, setAccountType] = useState<'bank' | 'credit' | 'cash'>('bank');
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  
  // Credit Card fields
  const [limit, setLimit] = useState('');
  const [currentDebt, setCurrentDebt] = useState('');
  const [statementDay, setStatementDay] = useState('');
  const [dueDay, setDueDay] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);

    try {
      if (!name) throw new Error("Hesap adı zorunludur.");
      if (accountType !== 'credit' && !balance) throw new Error("Bakiye zorunludur.");

      let mappedType = accountType;
      if (accountType === 'bank') mappedType = 'bank_account' as any;
      if (accountType === 'credit') mappedType = 'credit_card' as any;

      let payload: { name: string; type: string; balance: number; credit_card_details?: any } = {
        name,
        type: mappedType,
        balance: accountType === 'credit' ? 0 : parseFloat(balance),
      };

      if (accountType === 'credit') {
        if (!limit || !currentDebt || !statementDay || !dueDay) {
          throw new Error("Tüm kredi kartı alanlarını doldurunuz.");
        }
        if (parseFloat(currentDebt) > parseFloat(limit)) {
          throw new Error("Güncel borç, kart limitinden yüksek olamaz.");
        }
        payload.credit_card_details = {
          total_limit: parseFloat(limit),
          current_debt: parseFloat(currentDebt),
          statement_day: parseInt(statementDay),
          payment_due_day: parseInt(dueDay)
        };
        // For credit cards, balance might be negative debt
        payload.balance = -parseFloat(currentDebt);
      }

      const res = await addAccountAction(payload);
      if (res.success) {
        setName('');
        setBalance('');
        setLimit('');
        setCurrentDebt('');
        setStatementDay('');
        setDueDay('');
        onSuccess(res.id, payload.name as string);
      } else {
        toast.error(res.error || "Hesap eklenirken bir hata oluştu.");
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    accountType,
    setAccountType,
    name, setName,
    balance, setBalance,
    limit, setLimit,
    currentDebt, setCurrentDebt,
    statementDay, setStatementDay,
    dueDay, setDueDay,
    isLoading,
    handleSubmit
  };
}
