import toast from 'react-hot-toast';
import { useEffect, useMemo, useState } from 'react';
import { updateAccountAction, deleteAccountAction, payCreditCardDebtAction, getCategoriesAction } from '@/actions/finance';

export type DifferenceCategory = { id: string; name: string; type: 'income' | 'expense' };
import { useTranslation } from '@/hooks/useTranslation';

export function useEditAccountViewModel(initialData: { id: string, name: string, balance: number, type: string, include_in_total_balance?: boolean, credit_card_details?: any } | undefined, onSuccess?: () => void) {
  const { locale, isAbroad } = useTranslation();
  const isEn = isAbroad || locale === 'en';

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

  // Balance/debt change → optional income/expense record
  const [recordDifference, setRecordDifference] = useState(true);
  const [differenceTypeOverride, setDifferenceTypeOverride] = useState<'income' | 'expense' | null>(null);
  const [differenceCategoryId, setDifferenceCategoryId] = useState('');
  const [differenceDescription, setDifferenceDescription] = useState('');
  const [categories, setCategories] = useState<DifferenceCategory[]>([]);

  useEffect(() => {
    let cancelled = false;
    getCategoriesAction().then(res => {
      if (cancelled || !res.success || !res.categories) return;
      setCategories(res.categories.map((c: { id: string; name: string; type: string }) => ({ id: c.id, name: c.name, type: c.type as 'income' | 'expense' })));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const isCreditAccount = initialData?.type === 'credit_card';
  const initialValue = isCreditAccount
    ? Number(initialData?.credit_card_details?.current_debt ?? Math.max(0, -(initialData?.balance ?? 0)))
    : Number(initialData?.balance ?? 0);
  const currentValue = parseFloat((isCreditAccount ? creditDebt : balance) || '0');
  const rawDelta = Number.isFinite(currentValue) ? Math.round((currentValue - initialValue) * 100) / 100 : 0;
  const differenceAmount = Math.abs(rawDelta);
  // Credit card: more debt = expense. Bank/cash: less balance = expense.
  const suggestedDifferenceType: 'income' | 'expense' = isCreditAccount
    ? (rawDelta > 0 ? 'expense' : 'income')
    : (rawDelta < 0 ? 'expense' : 'income');
  const differenceType = differenceTypeOverride ?? suggestedDifferenceType;
  const hasDifference = differenceAmount > 0;
  const differenceCategories = useMemo(() => categories.filter(c => c.type === differenceType), [categories, differenceType]);

  // Drop a selected category that no longer matches the chosen income/expense type.
  const effectiveDifferenceCategoryId = differenceCategories.some(c => c.id === differenceCategoryId) ? differenceCategoryId : '';

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
        } : undefined,
        recordDifference: hasDifference && recordDifference ? {
          type: differenceType,
          category_id: effectiveDifferenceCategoryId || undefined,
          description: differenceDescription || undefined
        } : undefined
      };
      // For credit cards, backend might need to handle extra details later, but for now we just save balance.
      const res = await updateAccountAction(initialData.id, payload);
      
      if (res.success) {
        if (payload.recordDifference) {
          toast.success(differenceType === 'expense'
            ? (isEn ? 'Difference saved as expense.' : 'Fark gider olarak eklendi.')
            : (isEn ? 'Difference saved as income.' : 'Fark gelir olarak eklendi.'));
        }
        onSuccess && onSuccess();
      } else {
        toast.error(res.error || (isEn ? 'Update failed.' : 'Güncelleme başarısız.'));
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || (isEn ? 'An error occurred.' : 'Bir hata oluştu.'));
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
        toast.error(res.error || (isEn ? 'Payment failed.' : 'Ödeme yapılamadı.'));
        return;
      }
      setPaymentAmount('');
      setPaymentAccountId('');
      toast.success(isEn ? 'Card debt paid.' : 'Kart borcu ödendi.');
      onSuccess?.();
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || (isEn ? 'Payment failed.' : 'Ödeme yapılamadı.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    const confirmMessage = isEn 
      ? 'Are you sure you want to delete this account? (All associated transactions may be deleted)' 
      : 'Bu hesabı silmek istediğinize emin misiniz? (Tüm bağlı işlemler silinebilir)';
    if (!window.confirm(confirmMessage)) return;
    
    setIsLoading(true);
    
    try {
      const res = await deleteAccountAction(initialData.id);
      if (res.success) {
        onSuccess && onSuccess();
      } else {
        toast.error(res.error || (isEn ? 'Delete failed.' : 'Silme işlemi başarısız.'));
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || (isEn ? 'An error occurred.' : 'Bir hata oluştu.'));
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
    hasDifference, differenceAmount, differenceType, suggestedDifferenceType,
    setDifferenceTypeOverride,
    recordDifference, setRecordDifference,
    differenceCategoryId: effectiveDifferenceCategoryId, setDifferenceCategoryId,
    differenceDescription, setDifferenceDescription,
    differenceCategories,
    handleUpdate, handleDelete, handlePayment
  };
}
