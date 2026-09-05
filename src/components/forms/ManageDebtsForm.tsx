"use client";

import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Plus, Calendar } from 'lucide-react';
import { DebtDirection } from '@/models/Enums';
import { useManageDebtsViewModel } from '@/viewmodels/useManageDebtsViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useTranslation } from '@/hooks/useTranslation';
import { getCurrencySymbol, formatCurrency } from '@/lib/i18n';

export function ManageDebtsForm({ 
  onClose, onSuccess, onOpenEdit, debts 
}: { 
  onClose: () => void, onSuccess: () => void, onOpenEdit?: (id: string) => void, debts: { id: string, personName: string, amount: number, remainingAmount: number, direction: string, dueDate: string }[] 
}) {
  const [isAdding, setIsAdding] = useState(false);
  const { locale, isAbroad: userAbroad } = useTranslation();
  const isEn = userAbroad || locale === 'en';
  const currencySym = getCurrencySymbol(locale, userAbroad);
  
  const {
    debtDirection, setDebtDirection,
    personName, setPersonName,
    amount, setAmount,
    dueDate, setDueDate,
    isLoading, handleAdd
  } = useManageDebtsViewModel(() => {
    setIsAdding(false);
    onSuccess();
  });

  // Compute totals
  const totalGiven = debts.filter(d => d.direction === DebtDirection.GIVEN).reduce((acc, curr) => acc + (curr.remainingAmount || curr.amount), 0);
  const totalTaken = debts.filter(d => d.direction === DebtDirection.TAKEN).reduce((acc, curr) => acc + (curr.remainingAmount || curr.amount), 0);

  return (
    <div className="flex flex-col gap-6">
      {!isAdding ? (
        <>
          {/* Summary */}
          <div className="flex gap-4">
            <div className="flex-1 glass-item p-4 flex flex-col items-center justify-center border-l-4 border-l-[#4ade80]">
              <span className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">
                {isEn ? "Receivable" : "Alınacak"}
              </span>
              <span className="text-[var(--font-headline)] font-bold text-[#4ade80]">{formatCurrency(totalGiven, locale, userAbroad)}</span>
            </div>
            <div className="flex-1 glass-item p-4 flex flex-col items-center justify-center border-l-4 border-l-orange-400">
              <span className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">
                {isEn ? "Payable" : "Verilecek"}
              </span>
              <span className="text-[var(--font-headline)] font-bold text-orange-400">{formatCurrency(totalTaken, locale, userAbroad)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {debts.map((debt) => {
              const isLent = debt.direction === DebtDirection.GIVEN;
              const dDate = debt.dueDate 
                ? new Date(debt.dueDate).toLocaleDateString(isEn ? 'en-US' : 'tr-TR') 
                : (isEn ? 'Not specified' : 'Belirtilmedi');
              return (
                <div key={debt.id} className="group relative glass-item px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors" onClick={() => onOpenEdit && onOpenEdit(debt.id)}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center ${isLent ? 'text-[#4ade80]' : 'text-orange-400'}`}>
                      {isLent ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-body font-medium">{debt.personName}</span>
                      <span className="text-caption text-[var(--on-surface-variant)]">
                        {isEn ? "Due Date: " : "Son Ödeme: "}{dDate}
                      </span>
                    </div>
                  </div>
                  <span className={`text-body font-bold ${isLent ? 'text-[#4ade80]' : 'text-orange-400'}`}>
                    {isLent ? '+' : '-'}{formatCurrency(debt.remainingAmount || debt.amount, locale, userAbroad)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors cursor-pointer">
              {isEn ? "Close" : "Kapat"}
            </button>
            <button type="button" onClick={() => setIsAdding(true)} className="flex-[2] py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <Plus size={20} />
              <span>{isEn ? "Add Debt / Receivable" : "Borç / Alacak Ekle"}</span>
            </button>
          </div>
        </>
      ) : (
        /* New Debt Form */
        <form onSubmit={handleAdd} className="flex flex-col gap-4 animate-fade-in">
          <div className="flex bg-[rgba(255,255,255,0.05)] p-1 rounded-2xl">
            <button 
              type="button"
              onClick={() => setDebtDirection(DebtDirection.GIVEN)}
              className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-body font-medium transition-all ${debtDirection === DebtDirection.GIVEN ? 'bg-[#4ade80] shadow-sm text-[var(--background)]' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
            >
              <ArrowUpRight size={18} />
              {isEn ? "I Lent Money" : "Borç Verdim"}
            </button>
            <button 
              type="button"
              onClick={() => setDebtDirection(DebtDirection.TAKEN)}
              className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-body font-medium transition-all ${debtDirection === DebtDirection.TAKEN ? 'bg-orange-400 shadow-sm text-white' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
            >
              <ArrowDownRight size={18} />
              {isEn ? "I Borrowed Money" : "Borç Aldım"}
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
              {isEn ? "Person / Institution" : "Kişi / Kurum"}
            </label>
            <input 
              type="text" 
              required
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder={isEn ? "e.g. John Doe, Bank..." : "Örn: Ahmet, Ayşe, Kredi Kartı..."} 
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex flex-col gap-2 min-w-0">
              <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
                {isEn ? "Amount" : "Tutar"}
              </label>
              <div className="relative min-w-0">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--font-headline)] font-medium text-[var(--on-surface-variant)] pointer-events-none">
                  {currencySym}
                </span>
                <input 
                  type="number" 
                  step="0.01" 
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" 
                  className={`w-full min-w-0 max-w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 pl-10 pr-4 text-body font-semibold text-white focus:outline-none transition-all ${debtDirection === DebtDirection.GIVEN ? 'focus:border-[#4ade80]' : 'focus:border-orange-400'}`}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2 min-w-0">
              <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
                {isEn ? "Due Date" : "Son Ödeme Tarihi"}
              </label>
              <div className="relative min-w-0">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)] pointer-events-none" size={18} />
                <input 
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)} 
                  className="w-full min-w-0 max-w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 pl-11 pr-3 text-body text-white [color-scheme:dark] focus:outline-none focus:border-[var(--inverse-primary)] transition-all cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors cursor-pointer">
              {isEn ? "Cancel" : "İptal"}
            </button>
            <button type="submit" disabled={isLoading} className="flex-[2] py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50">
              {isLoading ? <LoadingSpinner size="sm" /> : (isEn ? "Save" : "Kaydet")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
