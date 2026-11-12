import toast from 'react-hot-toast';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { addInstallmentAction, deleteInstallmentAction, getInstallmentsAction, type InstallmentDTO } from '@/actions/installments';
import { useTranslation } from '@/hooks/useTranslation';

type AccountOption = { id: string; name: string; type?: string };

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useInstallmentsViewModel(accounts: AccountOption[], onChanged?: () => void, accountId?: string) {
  const { locale, isAbroad } = useTranslation();
  const isEn = isAbroad || locale === 'en';

  const defaultAccount = accountId || accounts.find(a => a.type === 'credit_card')?.id || accounts[0]?.id || '';

  const [installments, setInstallments] = useState<InstallmentDTO[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [count, setCount] = useState('3');
  const [selectedAccountId, setSelectedAccountId] = useState(defaultAccount);
  const [categoryId, setCategoryId] = useState('');
  const [firstChargeDate, setFirstChargeDate] = useState(todayKey());

  const load = useCallback(async () => {
    const res = await getInstallmentsAction(accountId);
    if (res.success && res.installments) setInstallments(res.installments);
    setIsLoadingList(false);
  }, [accountId]);

  useEffect(() => {
    let cancelled = false;
    getInstallmentsAction(accountId).then(res => {
      if (cancelled) return;
      if (res.success && res.installments) setInstallments(res.installments);
      setIsLoadingList(false);
    });
    return () => { cancelled = true; };
  }, [accountId]);

  const total = parseFloat(totalAmount);
  const countNum = parseInt(count, 10);
  const monthlyPreview = useMemo(() => {
    if (!Number.isFinite(total) || total <= 0 || !Number.isInteger(countNum) || countNum < 1) return null;
    return Math.floor((total * 100) / countNum) / 100;
  }, [total, countNum]);

  const isToday = firstChargeDate <= todayKey();

  const handleAdd = async () => {
    if (!name.trim()) return toast.error(isEn ? 'Enter what you bought.' : 'Ne aldığını yaz.');
    if (!monthlyPreview) return toast.error(isEn ? 'Enter a total and number of installments.' : 'Toplam tutarı ve taksit sayısını gir.');
    if (!selectedAccountId) return toast.error(isEn ? 'Choose the card.' : 'Kartı seç.');
    setIsSaving(true);
    try {
      const res = await addInstallmentAction({
        name,
        account_id: selectedAccountId,
        category_id: categoryId || undefined,
        total_amount: total,
        installment_count: countNum,
        first_charge_date: firstChargeDate,
      });
      if (!res.success) {
        toast.error(res.error || (isEn ? 'Could not save.' : 'Kaydedilemedi.'));
        return;
      }
      const charged = 'chargedNow' in res ? Number(res.chargedNow) || 0 : 0;
      toast.success(charged > 0
        ? (isEn ? `Installment plan added; ${charged} installment charged now.` : `Taksit planı eklendi; ${charged} taksit şimdi karttan düşüldü.`)
        : (isEn ? 'Installment plan added.' : 'Taksit planı eklendi.'));
      setName('');
      setTotalAmount('');
      setCategoryId('');
      await load();
      onChanged?.();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const msg = isEn
      ? 'Stop this installment plan? Installments already charged stay as expenses.'
      : 'Bu taksit planı durdurulsun mu? Daha önce düşülen taksitler gider olarak kalır.';
    if (!window.confirm(msg)) return;
    const res = await deleteInstallmentAction(id);
    if (!res.success) {
      toast.error(res.error || (isEn ? 'Could not delete.' : 'Silinemedi.'));
      return;
    }
    toast.success(isEn ? 'Plan stopped.' : 'Plan durduruldu.');
    await load();
    onChanged?.();
  };

  return {
    isEn,
    installments, isLoadingList, isSaving,
    name, setName,
    totalAmount, setTotalAmount,
    count, setCount,
    selectedAccountId, setSelectedAccountId,
    categoryId, setCategoryId,
    firstChargeDate, setFirstChargeDate,
    monthlyPreview, isToday,
    handleAdd, handleDelete,
  };
}
