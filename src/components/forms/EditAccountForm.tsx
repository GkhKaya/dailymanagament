import React, { useState } from 'react';
import { Wallet, CreditCard, Building2, Calendar, CreditCard as CardIcon } from 'lucide-react';

export function EditAccountForm({ onClose }: { onClose: () => void }) {
  // Mock initial data
  const [accountType, setAccountType] = useState<'bank' | 'credit' | 'cash'>('bank');
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {/* Hesap Adı */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Hesap Adı</label>
          <input 
            type="text" 
            defaultValue="Garanti Maaş"
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
          />
        </div>

        {/* Hesap Tipi */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Hesap Tipi</label>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => setAccountType('bank')}
              className={`flex flex-col items-center gap-2 py-3 rounded-xl transition-all ${accountType === 'bank' ? 'bg-[var(--inverse-primary)] text-white shadow-sm border border-[rgba(255,255,255,0.1)]' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] border border-transparent hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
            >
              <Building2 size={24} />
              <span className="text-caption font-medium">Banka</span>
            </button>
            <button 
              onClick={() => setAccountType('credit')}
              className={`flex flex-col items-center gap-2 py-3 rounded-xl transition-all ${accountType === 'credit' ? 'bg-[var(--inverse-primary)] text-white shadow-sm border border-[rgba(255,255,255,0.1)]' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] border border-transparent hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
            >
              <CreditCard size={24} />
              <span className="text-caption font-medium">Kredi Kartı</span>
            </button>
            <button 
              onClick={() => setAccountType('cash')}
              className={`flex flex-col items-center gap-2 py-3 rounded-xl transition-all ${accountType === 'cash' ? 'bg-[var(--inverse-primary)] text-white shadow-sm border border-[rgba(255,255,255,0.1)]' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] border border-transparent hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
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
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-[var(--on-surface-variant)]">₺</span>
                  <input 
                    type="number" 
                    defaultValue="50000"
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-3 pl-10 pr-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
                  />
                </div>
              </div>
              {/* Güncel Borç */}
              <div className="flex flex-col gap-2">
                <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider text-orange-400">Güncel Borç</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-[var(--on-surface-variant)]">₺</span>
                  <input 
                    type="number" 
                    defaultValue="12500"
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
                    defaultValue="15"
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
                    defaultValue="25"
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
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-[var(--on-surface-variant)]">₺</span>
              <input 
                type="number" 
                defaultValue="42500"
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 pl-10 pr-4 text-xl font-semibold text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-col gap-3">
        <button onClick={onClose} className="w-full py-3 rounded-xl bg-[var(--inverse-primary)] hover:bg-[var(--inverse-primary-hover)] text-white font-bold transition-colors">
          Değişiklikleri Kaydet
        </button>
        <button onClick={onClose} className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-medium transition-colors">
          Hesabı Sil
        </button>
      </div>
    </div>
  );
}
