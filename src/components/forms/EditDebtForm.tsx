import React from 'react';
import { useEditDebtViewModel } from '@/viewmodels/useEditDebtViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useTranslation } from '@/hooks/useTranslation';
import { getCurrencySymbol, formatCurrency } from '@/lib/i18n';
import { HandCoins } from 'lucide-react';

type DebtData = {
  id: string;
  personName: string;
  amount: number;
  dueDate?: string;
  remainingAmount?: number;
  direction?: string;
  payments?: { date: string; amount: number; note?: string | null }[];
};

export function EditDebtForm({ onClose, onSuccess, initialData, accounts = [] }: { onClose: () => void, onSuccess?: () => void, initialData?: DebtData, accounts?: { id: string; name: string; type?: string }[] }) {
  const { locale, isAbroad } = useTranslation();
  const isEn = isAbroad || locale === 'en';
  const currencySymbol = getCurrencySymbol(locale, isAbroad);

  const {
    personName, setPersonName,
    amount, setAmount,
    dueDate, setDueDate,
    paymentAmount, setPaymentAmount,
    paymentAccountId, setPaymentAccountId,
    paymentDate, setPaymentDate,
    handlePayment,
    isLoading,
    handleUpdate, handleDelete
  } = useEditDebtViewModel(initialData, onSuccess);

  const isLent = initialData?.direction !== 'taken';
  const remaining = initialData?.remainingAmount ?? initialData?.amount ?? 0;
  const moneyAccounts = accounts.filter(a => ['cash', 'bank_account', 'debit_card'].includes(a.type || ''));
  const money = (n: number) => formatCurrency(n, locale, isAbroad);
  const inputClass = 'w-full min-w-0 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-body text-white focus:outline-none focus:border-emerald-400';
  
  return (
    <div className="flex flex-col gap-6">
      {initialData && remaining > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-300">
              <HandCoins size={18} />
              {isLent ? (isEn ? 'Record a repayment' : 'Ödeme al') : (isEn ? 'Record a payment' : 'Ödeme yap')}
            </h3>
            <span className="text-sm text-[var(--on-surface-variant)]">{isEn ? 'Remaining' : 'Kalan'}: <b className="text-white">{money(remaining)}</b></span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="debt-pay-amount" className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">{isEn ? 'Amount' : 'Tutar'}</label>
              <input id="debt-pay-amount" type="number" inputMode="decimal" min="0.01" step="0.01" max={remaining} value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0,00" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="debt-pay-date" className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">{isEn ? 'Date' : 'Tarih'}</label>
              <input id="debt-pay-date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className={`${inputClass} [color-scheme:dark]`} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="debt-pay-account" className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
              {isLent ? (isEn ? 'Received into' : 'Hangi hesaba geldi?') : (isEn ? 'Paid from' : 'Hangi hesaptan ödedin?')}
            </label>
            <select id="debt-pay-account" value={paymentAccountId} onChange={(e) => setPaymentAccountId(e.target.value)} className={`${inputClass} appearance-none bg-[var(--surface-container)]`}>
              <option value="">{isEn ? "Don't change any account" : 'Hesaba işleme (sadece kayıt)'}</option>
              {moneyAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPaymentAmount(String(remaining))} className="min-h-11 rounded-xl border border-[rgba(255,255,255,0.1)] px-3 text-sm font-medium text-[var(--on-surface-variant)] hover:text-white">
              {isEn ? 'Full amount' : 'Tamamı'}
            </button>
            <button type="button" onClick={handlePayment} disabled={isLoading || !paymentAmount} className="min-h-11 flex-1 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-black transition-colors hover:bg-emerald-400 disabled:opacity-50">
              {isLent ? (isEn ? 'Save repayment' : 'Ödemeyi kaydet') : (isEn ? 'Save payment' : 'Ödemeyi kaydet')}
            </button>
          </div>
          <p className="text-xs text-[var(--on-surface-variant)]">
            {paymentAccountId
              ? (isLent ? (isEn ? 'The amount is added to the chosen account.' : 'Tutar seçtiğin hesaba eklenir.') : (isEn ? 'The amount is deducted from the chosen account.' : 'Tutar seçtiğin hesaptan düşülür.'))
              : (isEn ? 'Only the debt is updated; no account changes.' : 'Sadece borç güncellenir; hiçbir hesap değişmez.')}
          </p>
        </section>
      )}

      {initialData?.payments && initialData.payments.length > 0 && (
        <section className="flex flex-col gap-1">
          <h3 className="text-sm font-bold text-white">{isEn ? 'Payments' : 'Ödemeler'}</h3>
          {initialData.payments.map((p, i) => (
            <div key={`${p.date}-${i}`} className="flex justify-between border-b border-[rgba(255,255,255,0.06)] py-2 text-sm">
              <span className="text-[var(--on-surface-variant)]">{new Date(p.date).toLocaleDateString(isEn ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span className="font-semibold text-white">{money(p.amount)}</span>
            </div>
          ))}
        </section>
      )}

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
