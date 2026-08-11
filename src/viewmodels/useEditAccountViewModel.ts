import toast from 'react-hot-toast';
import { useState } from 'react';
import { updateAccountAction, deleteAccountAction, payCreditCardDebtAction } from '@/actions/finance';

export function useEditAccountViewModel(initialData: { id: string, name: string, balance: number, type: string, include_in_total_balance?: boolean, credit_card_details?: any } | undefined, onSuccess?: () => void) {
  const [accountName, setAccountName] = useState(initialData?.name || '');
  const initialType = initialData?.type === 'credit_card' ? 'credit' : initialData?.type === 'bank_account' ? 'bank' : initialData?.type || 'bank';
  const [accountType, setAccountType] = useState<'bank' | 'credit' | 'cash'>(initialType as 'bank' | 'credit' | 'cash');
  
  // Note: credit limit/debt/cut-off dates could be extracted if they exist
  const [balance, setBalance] = useState(initialData?.balance?.toString() || '0');
  
  const [creditLimit, setCreditLimit] = useState(initialData?.credit_card_details?.total_limit?.toString() || '');
  const [creditDebt, setCreditDebt] = useState(initialData?.credit_card_details?.current_debt?.toString() || '');
  const [cutoffDay, setCutoffDay] = useState(initialData?.credit_card_details?.statement_day?.toString() || '');
  const [dueDay, setDueDay] = useState(initialData?.credit_card_details?.payment_due_day?.toString() || '');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [isExternalPayment, setIsExternalPayment] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!initialData?.id) return;
    
    setIsLoading(true);
    
    try {
      const payload = {
        name: accountName,
        balance: parseFloat(accountType === 'credit' ? creditDebt || '0' : balance),
        credit_card_details: accountType === 'credit' ? {
          total_limit: parseFloat(creditLimit || '0'),
          current_debt: parseFloat(creditDebt || '0'),
          statement_day: parseInt(cutoffDay || '1'),
          payment_due_day: parseInt(dueDay || '1')
        } : undefined
      };
      // For credit cards, backend might need to handle extra details later, but for now we just save balance.
      const res = await updateAccountAction(initialData.id, payload);
      
      if (res.success) {
        onSuccess && onSuccess();
      } else {
        toast.error(res.error || "Güncelleme başarısız.");
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || "Bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!initialData?.id) return;
    setIsLoading(true);
    try {
      const res = await payCreditCardDebtAction({
        creditCardId: initialData.id,
        amount: parseFloat(paymentAmount),
        paymentAccountId: isExternalPayment ? undefined : paymentAccountId,
        isExternalPayment
      });
      if (!res.success) {
        toast.error(res.error || 'Ödeme yapılamadı.');
        return;
      }
      setPaymentAmount('');
      setPaymentAccountId('');
      toast.success('Kart borcu ödendi.');
      onSuccess?.();
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || 'Ödeme yapılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!window.confirm("Bu hesabı silmek istediğinize emin misiniz? (Tüm bağlı işlemler silinebilir)")) return;
    
    setIsLoading(true);
    
    try {
      const res = await deleteAccountAction(initialData.id);
      if (res.success) {
        onSuccess && onSuccess();
      } else {
        toast.error(res.error || "Silme işlemi başarısız.");
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || "Bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    accountName, setAccountName,
    accountType, setAccountType,
    balance, setBalance,
    creditLimit, setCreditLimit,
    creditDebt, setCreditDebt,
    cutoffDay, setCutoffDay,
    dueDay, setDueDay,
    paymentAmount, setPaymentAmount,
    paymentAccountId, setPaymentAccountId,
    isExternalPayment, setIsExternalPayment,
    isLoading,
    handleUpdate, handleDelete, handlePayment
  };
}
