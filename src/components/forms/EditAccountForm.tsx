import React from 'react';
import { Wallet, CreditCard, Building2, Calendar, CreditCard as CardIcon, Landmark, ReceiptText } from 'lucide-react';
import { useEditAccountViewModel } from '@/viewmodels/useEditAccountViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';

type AccountOption = { id: string; name: string; balance: number; type: string };
type CreditCardDetails = { total_limit: number; current_debt: number; statement_day: number; payment_due_day: number };
type EditableAccount = AccountOption & { include_in_total_balance?: boolean; credit_card_details?: CreditCardDetails };

export function EditAccountForm({ onSuccess, initialData, accounts = [] }: { onSuccess?: () => void, initialData?: EditableAccount, accounts?: AccountOption[] }) {
  const {
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
  } = useEditAccountViewModel(initialData, onSuccess);
  const isCreditCard = accountType === 'credit';
  const paymentAccounts = accounts.filter(account => account.id !== initialData?.id && ['cash', 'bank_account', 'debit_card'].includes(account.type));
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {/* Hesap Adı */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Hesap Adı</label>
          <input 
            type="text" 
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
          />
        </div>

        {/* Hesap Tipi */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Hesap Tipi</label>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => setAccountType('bank')}
              className={`flex flex-col items-center gap-2 py-3 rounded-xl transition-all ${accountType === 'bank' ? 'bg-[var(--primary)] text-black shadow-sm border border-[rgba(255,255,255,0.1)]' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] border border-transparent hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
            >
              <Building2 size={24} />
              <span className="text-caption font-medium">Banka</span>
            </button>
            <button 
              onClick={() => setAccountType('credit')}
              className={`flex flex-col items-center gap-2 py-3 rounded-xl transition-all ${accountType === 'credit' ? 'bg-[var(--primary)] text-black shadow-sm border border-[rgba(255,255,255,0.1)]' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] border border-transparent hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
            >
              <CreditCard size={24} />
              <span className="text-caption font-medium">Kredi Kartı</span>
            </button>
            <button 
              onClick={() => setAccountType('cash')}
              className={`flex flex-col items-center gap-2 py-3 rounded-xl transition-all ${accountType === 'cash' ? 'bg-[var(--primary)] text-black shadow-sm border border-[rgba(255,255,255,0.1)]' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] border border-transparent hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
            >
              <Wallet size={24} />
              <span className="text-caption font-medium">Nakit</span>
            </button>
          </div>
        </div>

        {/* Dynamic Fields */}
        {isCreditCard ? (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              {/* Kart Limiti */}
              <div className="flex flex-col gap-2">
                <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Kart Limiti</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--font-headline)] font-medium text-[var(--on-surface-variant)]">₺</span>
                  <input 
                    type="number" 
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-3 pl-10 pr-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
                  />
                </div>
              </div>
              {/* Güncel Borç */}
              <div className="flex flex-col gap-2">
                <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider text-orange-400">Güncel Borç</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--font-headline)] font-medium text-[var(--on-surface-variant)]">₺</span>
                  <input 
                    type="number" 
                    value={creditDebt}
                    onChange={(e) => setCreditDebt(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-3 pl-10 pr-4 text-body text-orange-400 focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Hesap Kesim Tarihi */}
              <div className="flex flex-col gap-2">
                <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider truncate">Hesap Kesim (Gün)</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={18} />
                  <input 
                    type="number" 
                    min="1" max="31"
                    value={cutoffDay}
                    onChange={(e) => setCutoffDay(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-3 pl-10 pr-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
                  />
                </div>
              </div>
              
              {/* Son Ödeme Tarihi */}
              <div className="flex flex-col gap-2">
                <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider truncate">Son Ödeme (Gün)</label>
                <div className="relative">
                  <CardIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={18} />
                  <input 
                    type="number" 
                    min="1" max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-3 pl-10 pr-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Güncel Bakiye */
          <div className="flex flex-col gap-2 animate-fade-in">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Güncel Bakiye</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--font-headline)] font-medium text-[var(--on-surface-variant)]">₺</span>
              <input 
                type="number" 
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 pl-10 pr-4 text-[var(--font-headline)] font-semibold text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
              />
            </div>
          </div>
        )}

        {isCreditCard && (
          <section className="flex flex-col gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-emerald-300">
              <ReceiptText size={18} />
              <h3 className="text-sm font-bold">Kart Borcu Öde</h3>
            </div>
            <p className="text-xs leading-5 text-[var(--on-surface-variant)]">Nakit/banka hesabı seçilirse bakiyesi düşer. Dış ödeme yalnızca kart borcunu azaltır.</p>
            <div className="flex flex-col gap-2">
              <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Ödeme Tutarı</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
                placeholder="0,00"
                className="min-h-11 w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-4 text-body text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setIsExternalPayment(false)} className={`min-h-11 rounded-xl border px-3 text-sm font-medium transition-colors ${!isExternalPayment ? 'border-emerald-400 bg-emerald-500 text-black' : 'border-[rgba(255,255,255,0.1)] text-[var(--on-surface-variant)] hover:text-white'}`}>
                Hesaptan Öde
              </button>
              <button type="button" onClick={() => setIsExternalPayment(true)} className={`min-h-11 rounded-xl border px-3 text-sm font-medium transition-colors ${isExternalPayment ? 'border-emerald-400 bg-emerald-500 text-black' : 'border-[rgba(255,255,255,0.1)] text-[var(--on-surface-variant)] hover:text-white'}`}>
                Dış Ödeme
              </button>
            </div>
            {!isExternalPayment && (
              <div className="flex flex-col gap-2">
                <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Ödeme Hesabı</label>
                <div className="relative">
                  <Landmark className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={17} />
                  <select value={paymentAccountId} onChange={(event) => setPaymentAccountId(event.target.value)} className="min-h-11 w-full appearance-none rounded-xl border border-[rgba(255,255,255,0.1)] bg-[var(--surface-container)] py-2 pl-10 pr-3 text-sm text-white focus:border-emerald-400 focus:outline-none">
                    <option value="">Nakit veya banka hesabı seçin</option>
                    {paymentAccounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
                  </select>
                </div>
              </div>
            )}
            <button type="button" disabled={isLoading || !paymentAmount || (!isExternalPayment && !paymentAccountId)} onClick={handlePayment} className="min-h-11 w-full rounded-xl bg-emerald-500 px-4 text-sm font-bold text-black transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">
              Borcu Öde
            </button>
          </section>
        )}
      </div>

      

      <div className="mt-2 flex flex-col gap-3">
        <button onClick={handleUpdate} disabled={isLoading} className="w-full py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold transition-colors flex items-center justify-center">
          {isLoading ? <LoadingSpinner size="sm" /> : "Değişiklikleri Kaydet"}
        </button>
        <button onClick={handleDelete} disabled={isLoading} className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-medium transition-colors">
          Hesabı Sil
        </button>
      </div>
    </div>
  );
}
