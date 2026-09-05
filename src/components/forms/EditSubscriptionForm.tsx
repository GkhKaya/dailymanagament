import React from 'react';
import { PlaySquare, CalendarClock } from 'lucide-react';
import { useEditSubscriptionViewModel } from '@/viewmodels/useEditSubscriptionViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useTranslation } from '@/hooks/useTranslation';
import { getCurrencySymbol } from '@/lib/i18n';

export function EditSubscriptionForm({ onClose, onSuccess, initialData }: { onClose: () => void, onSuccess?: () => void, initialData?: { id: string, name: string, amount: number, billingDay: number } }) {
  const { locale, isAbroad } = useTranslation();
  const isEn = isAbroad || locale === 'en';
  const currencySymbol = getCurrencySymbol(locale, isAbroad);

  const {
    name, setName,
    amount, setAmount,
    billingDay, setBillingDay,
    isLoading,
    handleUpdate, handleDelete
  } = useEditSubscriptionViewModel(initialData, onSuccess);
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
            {isEn ? 'Subscription Name' : 'Abonelik Adı'}
          </label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
              {isEn ? `Monthly Fee (${currencySymbol})` : `Aylık Tutar (${currencySymbol})`}
            </label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
              {isEn ? 'Billing Day (1-31)' : 'Fatura Günü (1-31)'}
            </label>
            <input 
              type="number" 
              min="1"
              max="31"
              value={billingDay}
              onChange={(e) => setBillingDay(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
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
