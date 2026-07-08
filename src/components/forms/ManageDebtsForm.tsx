import React, { useState } from 'react';
import { HandCoins, ArrowUpRight, ArrowDownRight, Plus, Calendar } from 'lucide-react';
import { DebtDirection } from '@/models/Enums';

export function ManageDebtsForm({ onClose }: { onClose: () => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [debtDirection, setDebtDirection] = useState<DebtDirection>(DebtDirection.GIVEN);

  const fmt = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  const debts = [
    { id: '1', person: 'Ahmet Yılmaz', direction: DebtDirection.GIVEN, amount: 1500, dueDate: '15.07.2026' },
    { id: '2', person: 'Kredi Kartı Taksidi', direction: DebtDirection.TAKEN, amount: 4500, dueDate: '22.07.2026' },
    { id: '3', person: 'Ayşe (Yemek)', direction: DebtDirection.GIVEN, amount: 350, dueDate: '10.07.2026' },
  ];

  return (
    <div className="flex flex-col gap-6">
      
      {!isAdding ? (
        <>
          {/* Özeti */}
          <div className="flex gap-4">
            <div className="flex-1 glass-item p-4 flex flex-col items-center justify-center border-l-4 border-l-[#4ade80]">
              <span className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">Alınacak</span>
              <span className="text-xl font-bold text-[#4ade80]">{fmt(1850)}</span>
            </div>
            <div className="flex-1 glass-item p-4 flex flex-col items-center justify-center border-l-4 border-l-orange-400">
              <span className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">Verilecek</span>
              <span className="text-xl font-bold text-orange-400">{fmt(4500)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {debts.map((debt) => {
              const isLent = debt.direction === DebtDirection.GIVEN;
              return (
                <div key={debt.id} className="glass-item px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center ${isLent ? 'text-[#4ade80]' : 'text-orange-400'}`}>
                      {isLent ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-body font-medium">{debt.person}</span>
                      <span className="text-caption text-[var(--on-surface-variant)]">Son Ödeme: {debt.dueDate}</span>
                    </div>
                  </div>
                  <span className={`text-body font-bold ${isLent ? 'text-[#4ade80]' : 'text-orange-400'}`}>
                    {isLent ? '+' : '-'}{fmt(debt.amount)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex gap-3">
            <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
              Kapat
            </button>
            <button onClick={() => setIsAdding(true)} className="flex-[2] py-4 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-bold transition-colors flex items-center justify-center gap-2">
              <Plus size={20} />
              <span>Borç / Alacak Ekle</span>
            </button>
          </div>
        </>
      ) : (
        /* Yeni Borç Ekleme Formu */
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="flex bg-[rgba(255,255,255,0.05)] p-1 rounded-2xl">
            <button 
              onClick={() => setDebtDirection(DebtDirection.GIVEN)}
              className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-body font-medium transition-all ${debtDirection === DebtDirection.GIVEN ? 'bg-[#4ade80] shadow-sm text-[var(--background)]' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
            >
              <ArrowUpRight size={18} />
              Borç Verdim
            </button>
            <button 
              onClick={() => setDebtDirection(DebtDirection.TAKEN)}
              className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-body font-medium transition-all ${debtDirection === DebtDirection.TAKEN ? 'bg-orange-400 shadow-sm text-white' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
            >
              <ArrowDownRight size={18} />
              Borç Aldım
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Kişi / Kurum</label>
            <input 
              type="text" 
              placeholder="Örn: Ahmet, Ayşe, Kredi Kartı..." 
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Tutar</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-[var(--on-surface-variant)]">₺</span>
                <input 
                  type="number" 
                  placeholder="0,00" 
                  className={`w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 pl-10 pr-4 text-body font-semibold text-white focus:outline-none transition-all ${debtDirection === DebtDirection.GIVEN ? 'focus:border-[#4ade80]' : 'focus:border-orange-400'}`}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Son Ödeme Tarihi</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={18} />
                <input 
                  type="date" 
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 pl-10 pr-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={() => setIsAdding(false)} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
              İptal
            </button>
            <button onClick={() => setIsAdding(false)} className="flex-[2] py-3 rounded-xl bg-[var(--inverse-primary)] hover:bg-[var(--inverse-primary-hover)] text-white font-bold transition-colors">
              Kaydet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
