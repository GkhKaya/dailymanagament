import React, { useState } from 'react';
import { CalendarClock, PlaySquare, Music, Dumbbell, Plus } from 'lucide-react';
import { useManageSubscriptionsViewModel } from '@/viewmodels/useManageSubscriptionsViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function ManageSubscriptionsForm({ 
  onClose, onSuccess, subscriptions, categories, accounts 
}: { 
  onClose: () => void, onSuccess: () => void, subscriptions: any[], categories: any[], accounts: any[] 
}) {
  const [isAdding, setIsAdding] = useState(false);
  
  const {
    name, setName,
    amount, setAmount,
    billingDay, setBillingDay,
    accountId, setAccountId,
    categoryId, setCategoryId,
    isLoading, error, handleAdd
  } = useManageSubscriptionsViewModel(() => {
    setIsAdding(false);
    onSuccess();
  });

  const fmt = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  const totalMonthly = subscriptions.reduce((acc, sub) => acc + parseFloat(sub.amount?.toString() || sub.amount), 0);

  return (
    <div className="flex flex-col gap-6">
      {!isAdding ? (
        <>
          <div className="glass-item p-4 flex flex-col items-center justify-center border-l-4 border-l-[#c0c1ff]">
            <span className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">Aylık Toplam Gider</span>
            <span className="text-2xl font-bold text-white">{fmt(totalMonthly)}</span>
          </div>

          <div className="flex flex-col gap-3">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="glass-item px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[var(--on-surface-variant)]">
                    <PlaySquare size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-body font-medium">{sub.name}</span>
                    <span className="text-caption text-[var(--on-surface-variant)] flex items-center gap-1">
                      <CalendarClock size={12} /> Her ayın {sub.billing_day}. günü
                    </span>
                  </div>
                </div>
                <span className="text-body font-bold text-white">
                  {fmt(parseFloat(sub.amount?.toString() || sub.amount))}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
              Kapat
            </button>
            <button type="button" onClick={() => setIsAdding(true)} className="flex-[2] py-3 rounded-xl bg-[var(--inverse-primary)] hover:bg-[var(--inverse-primary-hover)] text-white font-bold transition-colors flex items-center justify-center gap-2">
              <Plus size={20} />
              <span>Abonelik Ekle</span>
            </button>
          </div>
        </>
      ) : (
        /* Yeni Abonelik Ekleme Formu */
        <form onSubmit={handleAdd} className="flex flex-col gap-4 animate-fade-in">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 text-red-200 text-sm border border-red-500/30">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Abonelik Adı</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Netflix, Spotify..." 
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Kategori</label>
            <select 
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all appearance-none"
            >
              <option value="" disabled>Kategori seçiniz...</option>
              {categories.filter(c => c.type === 'expense').map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Ödenecek Hesap</label>
            <select 
              required
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all appearance-none"
            >
              <option value="" disabled>Hesap seçiniz...</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Aylık Ücret</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-[var(--on-surface-variant)]">₺</span>
                <input 
                  type="number"
                  step="0.01" 
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" 
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 pl-10 pr-4 text-body font-semibold text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Kesim Günü</label>
              <div className="relative">
                <CalendarClock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={18} />
                <input 
                  type="number" 
                  min="1" max="31"
                  required
                  value={billingDay}
                  onChange={(e) => setBillingDay(e.target.value)}
                  placeholder="1-31" 
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 pl-10 pr-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
              İptal
            </button>
            <button type="submit" disabled={isLoading} className="flex-[2] py-3 rounded-xl bg-[var(--inverse-primary)] hover:bg-[var(--inverse-primary-hover)] text-white font-bold transition-colors flex items-center justify-center">
              {isLoading ? <LoadingSpinner size="sm" /> : "Kaydet"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
