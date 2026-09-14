"use client";

import React, { useMemo, useState } from 'react';
import { Calendar, ArrowRightLeft, Building2, Wallet, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { transferAccountsAction } from '@/actions/finance';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useTranslation } from '@/hooks/useTranslation';
import { formatCurrency, getCurrencySymbol } from '@/lib/i18n';

type Account = { id: string; name: string; balance: number; type: string };

const getAccountIcon = (type: string) => {
  switch (type) {
    case 'cash': return <Wallet size={16} />;
    case 'bank': return <Building2 size={16} />;
    default: return <Wallet size={16} />;
  }
};

export function TransferAccountsForm({ accounts, currentDate, onSuccess, onClose }: {
  accounts: Account[];
  currentDate?: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const { locale, isAbroad } = useTranslation();
  const isEn = isAbroad || locale === 'en';
  const currencySymbol = getCurrencySymbol(locale, isAbroad);

  // Transfer is only eligible between non-credit-card accounts (bank, cash, savings)
  const eligibleAccounts = useMemo(() => accounts.filter((account) => account.type !== 'credit_card'), [accounts]);
  
  const [sourceAccountId, setSourceAccountId] = useState(eligibleAccounts[0]?.id || '');
  const [targetAccountId, setTargetAccountId] = useState(eligibleAccounts[1]?.id || '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(currentDate || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const source = eligibleAccounts.find((account) => account.id === sourceAccountId);
  const target = eligibleAccounts.find((account) => account.id === targetAccountId);
  const targetOptions = eligibleAccounts.filter((account) => account.id !== sourceAccountId);

  // Quick swap source and target accounts
  const handleSwap = () => {
    if (sourceAccountId && targetAccountId) {
      const prevSource = sourceAccountId;
      setSourceAccountId(targetAccountId);
      setTargetAccountId(prevSource);
    }
  };

  const parsedAmount = parseFloat(amount) || 0;
  const isInsufficient = source && parsedAmount > source.balance;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sourceAccountId) {
      toast.error(isEn ? 'Please select a source account.' : 'Lütfen kaynak hesap seçin.');
      return;
    }
    if (!targetAccountId) {
      toast.error(isEn ? 'Please select a target account.' : 'Lütfen hedef hesap seçin.');
      return;
    }
    if (sourceAccountId === targetAccountId) {
      toast.error(isEn ? 'Source and target accounts cannot be the same.' : 'Kaynak ve hedef hesap aynı olamaz.');
      return;
    }
    if (parsedAmount <= 0) {
      toast.error(isEn ? 'Transfer amount must be greater than 0.' : 'Transfer tutarı 0’dan büyük olmalıdır.');
      return;
    }
    if (source && parsedAmount > source.balance) {
      toast.error(isEn ? 'Insufficient balance in source account.' : 'Kaynak hesapta yeterli bakiye yok.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await transferAccountsAction({
        sourceAccountId,
        targetAccountId,
        amount: parsedAmount,
        date: new Date(date).toISOString(),
        description: description.trim() || undefined
      });
      if (!result.success) {
        toast.error(result.error || (isEn ? 'Transfer failed.' : 'Transfer yapılamadı.'));
        return;
      }
      toast.success(isEn ? 'Transfer completed successfully!' : 'Transfer başarıyla gerçekleşti!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (isEn ? 'Transfer failed.' : 'Transfer yapılamadı.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Quick amount helper
  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleMaxAmount = () => {
    if (source && source.balance > 0) {
      setAmount(source.balance.toString());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Visual Direction / Account Cards */}
      <div className="flex flex-col gap-3 p-3.5 bg-black/25 rounded-2xl border border-white/5">
        {/* Source Account Field */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              {isEn ? 'Source Account (From)' : 'Kaynak Hesap (Para Çıkacak)'}
            </label>
            {source && (
              <span className="text-xs font-mono font-medium text-white/70">
                {isEn ? 'Balance:' : 'Bakiye:'} <strong className="text-white">{formatCurrency(source.balance, locale, isAbroad)}</strong>
              </span>
            )}
          </div>
          <CustomSelect 
            value={sourceAccountId} 
            onChange={(val) => {
              setSourceAccountId(val);
              if (val === targetAccountId) {
                const nextTarget = eligibleAccounts.find(a => a.id !== val);
                setTargetAccountId(nextTarget ? nextTarget.id : '');
              }
            }} 
            required 
            placeholder={isEn ? 'Select source account...' : 'Kaynak hesap seçin...'} 
            options={eligibleAccounts.map((account) => ({ 
              value: account.id, 
              label: `${account.name} (${formatCurrency(account.balance, locale, isAbroad)})` 
            }))} 
          />
        </div>

        {/* Swap / Direction Divider */}
        <div className="flex items-center justify-center my-0.5 relative">
          <div className="w-full h-px bg-white/10 absolute top-1/2"></div>
          <button
            type="button"
            onClick={handleSwap}
            className="relative z-10 px-3 py-1.5 rounded-full bg-[#1e1e2d] border border-white/15 text-white/80 hover:text-white hover:border-[var(--primary)] hover:bg-[var(--primary)]/10 text-xs font-medium flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            title={isEn ? "Swap accounts" : "Hesapların yönünü değiştir"}
          >
            <ArrowRightLeft size={13} className="text-[var(--primary)]" />
            <span>{isEn ? "Swap" : "Yön Değiştir"}</span>
          </button>
        </div>

        {/* Target Account Field */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {isEn ? 'Target Account (To)' : 'Hedef Hesap (Para Gidecek)'}
            </label>
            {target && (
              <span className="text-xs font-mono font-medium text-white/70">
                {isEn ? 'Balance:' : 'Bakiye:'} <strong className="text-white">{formatCurrency(target.balance, locale, isAbroad)}</strong>
              </span>
            )}
          </div>
          <CustomSelect 
            value={targetAccountId} 
            onChange={setTargetAccountId} 
            required 
            placeholder={isEn ? 'Select target account...' : 'Hedef hesap seçin...'} 
            options={targetOptions.map((account) => ({ 
              value: account.id, 
              label: `${account.name} (${formatCurrency(account.balance, locale, isAbroad)})` 
            }))} 
          />
        </div>
      </div>

      {/* Amount and Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Amount Input */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <label className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-wider">
            {isEn ? 'Transfer Amount' : 'Transfer Tutarı'}
          </label>
          <div className="relative min-w-0">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-white/50 pointer-events-none">
              {currencySymbol}
            </span>
            <input 
              type="number" 
              min="0.01" 
              step="0.01" 
              required 
              value={amount} 
              onChange={(event) => setAmount(event.target.value)} 
              placeholder="0.00"
              className={`w-full min-w-0 rounded-xl border bg-white/[0.03] py-3 pl-8 pr-3 text-sm font-bold text-white outline-none transition-colors ${
                isInsufficient 
                  ? 'border-red-500/60 focus:border-red-500' 
                  : 'border-white/10 focus:border-[var(--primary)]'
              }`}
            />
          </div>
          {isInsufficient && (
            <span className="text-[11px] font-medium text-red-400">
              {isEn ? 'Amount exceeds available balance.' : 'Tutar kullanılabilir bakiyeyi aşıyor.'}
            </span>
          )}
        </div>

        {/* Date Input */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <label className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-wider">
            {isEn ? 'Date' : 'Tarih'}
          </label>
          <div className="relative min-w-0">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)] pointer-events-none" size={16} />
            <input 
              type="date" 
              required 
              value={date} 
              onChange={(event) => setDate(event.target.value)} 
              className="w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-10 pr-2 text-sm text-white [color-scheme:dark] outline-none focus:border-[var(--primary)] transition-colors" 
            />
          </div>
        </div>
      </div>

      {/* Quick Amount Chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {[100, 250, 500, 1000].map(val => (
          <button
            key={val}
            type="button"
            onClick={() => handleQuickAmount(val)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white font-medium transition-colors cursor-pointer"
          >
            +{val} {currencySymbol}
          </button>
        ))}
        {source && source.balance > 0 && (
          <button
            type="button"
            onClick={handleMaxAmount}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs text-emerald-300 font-bold transition-colors cursor-pointer ml-auto"
          >
            {isEn ? 'All Balance' : 'Tüm Bakiye'}
          </button>
        )}
      </div>

      {/* Description Input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-wider">
          {isEn ? 'Description (Optional)' : 'Açıklama (İsteğe Bağlı)'}
        </label>
        <input 
          type="text" 
          maxLength={120} 
          value={description} 
          onChange={(event) => setDescription(event.target.value)} 
          placeholder={source && target ? `${source.name} → ${target.name} transferi` : (isEn ? 'e.g. ATM cash withdrawal, pocket money...' : 'Örn: ATM nakit çekim, harçlık...')} 
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white outline-none focus:border-[var(--primary)] transition-colors" 
        />
      </div>

      {/* Live Balance Preview */}
      {source && target && parsedAmount > 0 && !isInsufficient && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col gap-1.5 animate-fade-in">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            {isEn ? 'Estimated Post-Transfer Balances:' : 'Transfer Sonrası Tahmini Bakiyeler:'}
          </span>
          <div className="flex items-center justify-between text-xs text-white/90">
            <span>{source.name} (Kaynak):</span>
            <span className="font-mono">
              {formatCurrency(source.balance, locale, isAbroad)} → <strong className="text-amber-300">{formatCurrency(source.balance - parsedAmount, locale, isAbroad)}</strong>
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-white/90">
            <span>{target.name} (Hedef):</span>
            <span className="font-mono">
              {formatCurrency(target.balance, locale, isAbroad)} → <strong className="text-emerald-300">{formatCurrency(target.balance + parsedAmount, locale, isAbroad)}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex gap-2.5 mt-2">
        <button 
          type="button" 
          onClick={onClose} 
          className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors cursor-pointer"
        >
          {isEn ? 'Cancel' : 'İptal'}
        </button>
        <button 
          type="submit" 
          disabled={isLoading || isInsufficient || parsedAmount <= 0} 
          className="flex-[2] py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 shadow-lg"
        >
          <ArrowRightLeft size={16} />
          {isLoading ? (isEn ? 'Transferring...' : 'Aktarılıyor...') : (isEn ? 'Complete Transfer' : 'Transferi Gerçekleştir')}
        </button>
      </div>
    </form>
  );
}
