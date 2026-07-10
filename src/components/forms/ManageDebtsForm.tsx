import React, { useState } from 'react';
import { HandCoins, ArrowUpRight, ArrowDownRight, Plus, Calendar } from 'lucide-react';
import { DebtDirection } from '@/models/Enums';
import { useManageDebtsViewModel } from '@/viewmodels/useManageDebtsViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function ManageDebtsForm({ onClose, onSuccess, debts }: { onClose: () => void, onSuccess: () => void, debts: any[] }) {
  const [isAdding, setIsAdding] = useState(false);
  
  const {
    debtDirection, setDebtDirection,
    personName, setPersonName,
    amount, setAmount,
    dueDate, setDueDate,
    isLoading, error, handleAdd
  } = useManageDebtsViewModel(() => {
    setIsAdding(false);
    onSuccess();
  });

  const fmt = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  // Compute totals
  const totalGiven = debts.filter(d => d.direction === DebtDirection.GIVEN).reduce((acc, curr) => acc + (curr.remaining_amount || curr.amount), 0);
  const totalTaken = debts.filter(d => d.direction === DebtDirection.TAKEN).reduce((acc, curr) => acc + (curr.remaining_amount || curr.amount), 0);

  return (
    <div className="flex flex-col gap-6">
      
      {!isAdding ? (
        <>
          {/* Özeti */}
          <div className="flex gap-4">
            <div className="flex-1 glass-item p-4 flex flex-col items-center justify-center border-l-4 border-l-[#4ade80]">
              <span className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">Alınacak</span>
              <span className="text-xl font-bold text-[#4ade80]">{fmt(totalGiven)}</span>
            </div>
            <div className="flex-1 glass-item p-4 flex flex-col items-center justify-center border-l-4 border-l-orange-400">
              <span className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">Verilecek</span>
              <span className="text-xl font-bold text-orange-400">{fmt(totalTaken)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {debts.map((debt) => {
              const isLent = debt.direction === DebtDirection.GIVEN;
              const dDate = debt.due_date ? new Date(debt.due_date).toLocaleDateString('tr-TR') : 'Belirtilmedi';
              return (
                <div key={debt.id} className="glass-item px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center ${isLent ? 'text-[#4ade80]' : 'text-orange-400'}`}>
                      {isLent ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-body font-medium">{debt.person_name}</span>
                      <span className="text-caption text-[var(--on-surface-variant)]">Son Ödeme: {dDate}</span>
                    </div>
                  </div>
                  <span className={`text-body font-bold ${isLent ? 'text-[#4ade80]' : 'text-orange-400'}`}>
                    {isLent ? '+' : '-'}{fmt(debt.remaining_amount || debt.amount)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
              Kapat
            </button>
            <button type="button" onClick={() => setIsAdding(true)} className="flex-[2] py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold transition-colors flex items-center justify-center gap-2">
              <Plus size={20} />
              <span>Borç / Alacak Ekle</span>
            </button>
          </div>
        </>
      ) : (
        /* Yeni Borç Ekleme Formu */
        <form onSubmit={handleAdd} className="flex flex-col gap-4 animate-fade-in">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 text-red-200 text-sm border border-red-500/30">
              {error}
            </div>
          )}
          
          <div className="flex bg-[rgba(255,255,255,0.05)] p-1 rounded-2xl">
            <button 
              type="button"
              onClick={() => setDebtDirection(DebtDirection.GIVEN)}
              className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-body font-medium transition-all ${debtDirection === DebtDirection.GIVEN ? 'bg-[#4ade80] shadow-sm text-[var(--background)]' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
            >
              <ArrowUpRight size={18} />
              Borç Verdim
            </button>
            <button 
              type="button"
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
              required
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
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
                  step="0.01" 
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" 
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
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)} 
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
