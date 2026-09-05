import React from 'react';
import { useEditDebtViewModel } from '@/viewmodels/useEditDebtViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useTranslation } from '@/hooks/useTranslation';
import { getCurrencySymbol } from '@/lib/i18n';

export function EditDebtForm({ onClose, onSuccess, initialData }: { onClose: () => void, onSuccess?: () => void, initialData?: { id: string, personName: string, amount: number, dueDate?: string } }) {
  const { locale, isAbroad } = useTranslation();
  const isEn = isAbroad || locale === 'en';
  const currencySymbol = getCurrencySymbol(locale, isAbroad);

  const {
    personName, setPersonName,
    amount, setAmount,
    dueDate, setDueDate,
    isLoading,
    handleUpdate, handleDelete
  } = useEditDebtViewModel(initialData, onSuccess);
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
            {isEn ? 'Person / Institution' : 'Kişi / Kurum Adı'}
          </label>
          <input 
            type="text" 
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="flex flex-col gap-2 min-w-0">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
              {isEn ? `Amount (${currencySymbol})` : `Tutar (${currencySymbol})`}
            </label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full min-w-0 max-w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
            />
          </div>
          
          <div className="flex flex-col gap-2 min-w-0">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
              {isEn ? 'Due Date (Optional)' : 'Son Ödeme (Opsiyonel)'}
            </label>
            <input 
              type="date" 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full min-w-0 max-w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white [color-scheme:dark] focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
          {isEn ? 'Cancel' : 'İptal'}
        </button>
        <button type="button" onClick={handleDelete} disabled={isLoading} className="flex-[1.5] py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold transition-colors">
          {isEn ? 'Delete' : 'Sil'}
        </button>
        <button onClick={handleUpdate} disabled={isLoading} className="flex-[2] py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold transition-colors flex items-center justify-center">
          {isLoading ? <LoadingSpinner size="sm" /> : (isEn ? 'Update' : 'Güncelle')}
        </button>
      </div>
    </div>
  );
}
