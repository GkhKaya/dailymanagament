"use client";

import React, { useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { transferAccountsAction } from '@/actions/finance';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useTranslation } from '@/hooks/useTranslation';
import { formatCurrency, getCurrencySymbol } from '@/lib/i18n';

type Account = { id: string; name: string; balance: number; type: string };

export function TransferAccountsForm({ accounts, currentDate, onSuccess, onClose }: {
  accounts: Account[];
  currentDate: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const { locale, isAbroad } = useTranslation();
  const isEn = isAbroad || locale === 'en';
  const currencySymbol = getCurrencySymbol(locale, isAbroad);

  const eligibleAccounts = useMemo(() => accounts.filter((account) => account.type !== 'credit_card'), [accounts]);
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(currentDate);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const source = eligibleAccounts.find((account) => account.id === sourceAccountId);
  const targetOptions = eligibleAccounts.filter((account) => account.id !== sourceAccountId);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const result = await transferAccountsAction({
        sourceAccountId,
        targetAccountId,
        amount: Number(amount),
        date: new Date(date).toISOString(),
        description
      });
      if (!result.success) {
        toast.error(result.error || (isEn ? 'Transfer failed.' : 'Transfer yapılamadı.'));
        return;
      }
      toast.success(isEn ? 'Transfer completed.' : 'Transfer yapıldı.');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (isEn ? 'Transfer failed.' : 'Transfer yapılamadı.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
          {isEn ? 'Source account' : 'Kaynak hesap'}
        </label>
        <CustomSelect 
          value={sourceAccountId} 
          onChange={setSourceAccountId} 
          required 
          placeholder={isEn ? 'Where will the money come from?' : 'Para nereden çıkacak?'} 
          options={eligibleAccounts.map((account) => ({ 
            value: account.id, 
            label: `${account.name} (${formatCurrency(account.balance, locale, isAbroad)})` 
          }))} 
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
          {isEn ? 'Target account' : 'Hedef hesap'}
        </label>
        <CustomSelect 
          value={targetAccountId} 
          onChange={setTargetAccountId} 
          required 
          placeholder={isEn ? 'Where will the money go?' : 'Para nereye gidecek?'} 
          options={targetOptions.map((account) => ({ value: account.id, label: account.name }))} 
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input 
          type="number" 
          min="0.01" 
          step="0.01" 
          required 
          value={amount} 
          onChange={(event) => setAmount(event.target.value)} 
          placeholder={isEn ? `Amount ${currencySymbol}` : `Tutar ${currencySymbol}`} 
          className="w-full min-w-0 max-w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none" 
        />
        <div className="relative min-w-0">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)] pointer-events-none" size={17} />
          <input 
            type="date" 
            required 
            value={date} 
            onChange={(event) => setDate(event.target.value)} 
            className="w-full min-w-0 max-w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-10 pr-2 text-white [color-scheme:dark] outline-none" 
          />
        </div>
      </div>
      <input 
        type="text" 
        maxLength={120} 
        value={description} 
        onChange={(event) => setDescription(event.target.value)} 
        placeholder={isEn ? 'Description (optional)' : 'Açıklama (isteğe bağlı)'} 
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none" 
      />
      {source && (
        <p className="text-caption text-[var(--on-surface-variant)]">
          {isEn ? 'Available balance:' : 'Kullanılabilir bakiye:'} {formatCurrency(source.balance, locale, isAbroad)}
        </p>
      )}
      <button 
        type="submit" 
        disabled={isLoading} 
        className="min-h-12 rounded-full bg-[var(--primary)] px-6 py-3 font-semibold text-black disabled:opacity-50"
      >
        {isLoading ? (isEn ? 'Transferring...' : 'Aktarılıyor...') : (isEn ? 'Transfer Funds' : 'Para Aktar')}
      </button>
      <button 
        type="button" 
        onClick={onClose} 
        className="rounded-xl bg-white/5 py-3 text-white"
      >
        {isEn ? 'Close' : 'Kapat'}
      </button>
    </form>
  );
}
