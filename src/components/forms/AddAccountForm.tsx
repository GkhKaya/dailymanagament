import React from 'react';
import { Wallet, CreditCard, Building2, Calendar, CreditCard as CardIcon } from 'lucide-react';
import { useAddAccountViewModel } from '@/viewmodels/useAddAccountViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function AddAccountForm({ onClose, onSuccess }: { onClose: () => void, onSuccess: (id?: string, name?: string) => void }) {
  const {
    accountType, setAccountType,
    name, setName,
    balance, setBalance,
    limit, setLimit,
    currentDebt, setCurrentDebt,
    statementDay, setStatementDay,
    dueDay, setDueDay,
    isLoading, handleSubmit
  } = useAddAccountViewModel(onSuccess);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      
      
      <div className="flex flex-col gap-4">
        {/* Hesap Adı */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Hesap Adı</label>
          <input 
            type="text" 
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={accountType === 'credit' ? "Örn: Garanti Bonus" : "Örn: Garanti Maaş, Nakit Cüzdan..."}
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
          />
        </div>

        {/* Hesap Tipi */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Hesap Tipi</label>
          <div className="grid grid-cols-3 gap-2">
            <button 
              type="button"
              onClick={() => setAccountType('bank')}
              className={`flex flex-col items-center gap-2 py-3 rounded-xl transition-all ${accountType === 'bank' ? 'bg-[var(--primary)] text-black shadow-sm border border-[rgba(255,255,255,0.1)]' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] border border-transparent hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
            >
              <Building2 size={24} />
              <span className="text-caption font-medium">Banka</span>
            </button>
            <button 
              type="button"
              onClick={() => setAccountType('credit')}
              className={`flex flex-col items-center gap-2 py-3 rounded-xl transition-all ${accountType === 'credit' ? 'bg-[var(--primary)] text-black shadow-sm border border-[rgba(255,255,255,0.1)]' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] border border-transparent hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
            >
              <CreditCard size={24} />
              <span className="text-caption font-medium">Kredi Kartı</span>
            </button>
            <button 
              type="button"
              onClick={() => setAccountType('cash')}
              className={`flex flex-col items-center gap-2 py-3 rounded-xl transition-all ${accountType === 'cash' ? 'bg-[var(--primary)] text-black shadow-sm border border-[rgba(255,255,255,0.1)]' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] border border-transparent hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
            >
              <Wallet size={24} />
              <span className="text-caption font-medium">Nakit</span>
            </button>
          </div>
        </div>

        {/* Dynamic Fields */}
        {accountType === 'credit' ? (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              {/* Kart Limiti */}
              <div className="flex flex-col gap-2">
                <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Kart Limiti</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--font-headline)] font-medium text-[var(--on-surface-variant)]">₺</span>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    placeholder="0.00" 
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
                    step="0.01"
                    required
                    value={currentDebt}
                    onChange={(e) => setCurrentDebt(e.target.value)}
                    placeholder="0.00" 
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
                    required
                    value={statementDay}
                    onChange={(e) => setStatementDay(e.target.value)}
                    placeholder="Ayın günü" 
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
                    required
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    placeholder="Ayın günü" 
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-3 pl-10 pr-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Başlangıç Bakiyesi */
          <div className="flex flex-col gap-2 animate-fade-in">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Başlangıç Bakiyesi</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--font-headline)] font-medium text-[var(--on-surface-variant)]">₺</span>
              <input 
                type="number" 
                step="0.01"
                required
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00" 
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 pl-10 pr-4 text-[var(--font-headline)] font-semibold text-white focus:outline-none focus:border-[var(--primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
          İptal
        </button>
        <button type="submit" disabled={isLoading} className="flex-[2] py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold transition-colors flex items-center justify-center">
          {isLoading ? <LoadingSpinner size="sm" /> : "Hesap Oluştur"}
        </button>
      </div>
    </form>
  );
}
