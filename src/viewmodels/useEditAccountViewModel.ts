import toast from 'react-hot-toast';
import { useState } from 'react';
import { updateAccountAction, deleteAccountAction } from '@/actions/finance';

export function useEditAccountViewModel(initialData: { id: string, name: string, balance: number, type: string, include_in_total_balance?: boolean, credit_card_details?: any } | undefined, onSuccess?: () => void) {
  const [accountName, setAccountName] = useState(initialData?.name || '');
  const [accountType, setAccountType] = useState<'bank' | 'credit' | 'cash'>((initialData?.type as 'bank' | 'credit' | 'cash') || 'bank');
  
  // Note: credit limit/debt/cut-off dates could be extracted if they exist
  const [balance, setBalance] = useState(initialData?.balance?.toString() || '0');
  
  const [creditLimit, setCreditLimit] = useState(initialData?.credit_card_details?.limit?.toString() || '');
  const [creditDebt, setCreditDebt] = useState(initialData?.credit_card_details?.current_debt?.toString() || '');
  const [cutoffDay, setCutoffDay] = useState(initialData?.credit_card_details?.cut_off_day?.toString() || '');
  const [dueDay, setDueDay] = useState(initialData?.credit_card_details?.due_day?.toString() || '');

  const [isLoading, setIsLoading] = useState(false);
  

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!initialData?.id) return;
    
    setIsLoading(true);
    
    try {
      const payload = {
        name: accountName,
        balance: parseFloat(accountType === 'credit' ? creditDebt || '0' : balance),
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
    isLoading,
    handleUpdate, handleDelete
  };
}
