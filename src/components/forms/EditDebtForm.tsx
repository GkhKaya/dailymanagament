import React from 'react';
import { useEditDebtViewModel } from '@/viewmodels/useEditDebtViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function EditDebtForm({ onClose, onSuccess, initialData }: { onClose: () => void, onSuccess?: () => void, initialData?: { id: string, personName: string, amount: number, dueDate?: string } }) {
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
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Kişi / Kurum Adı</label>
          <input 
            type="text" 
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Tutar (₺)</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Son Ödeme (Opsiyonel)</label>
            <input 
              type="date" 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
          İptal
        </button>
        <button type="button" onClick={handleDelete} disabled={isLoading} className="flex-[1.5] py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold transition-colors">
          Sil
        </button>
        <button onClick={handleUpdate} disabled={isLoading} className="flex-[2] py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold transition-colors flex items-center justify-center">
          {isLoading ? <LoadingSpinner size="sm" /> : "Güncelle"}
        </button>
      </div>
    </div>
  );
}
