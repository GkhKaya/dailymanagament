"use client";

import React, { useState } from 'react';
import { t, getCurrencySymbol } from '@/lib/i18n';
import { Calendar } from 'lucide-react';
import { useAddTransactionViewModel } from '@/viewmodels/useAddTransactionViewModel';
import { useTranslation } from '@/hooks/useTranslation';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { localizeCategoryName } from '@/lib/category-helpers';
import { getCategoryIcon } from '@/lib/category-icons';
import { CategoryInfo } from '@/models/DashboardTypes';

export function AddTransactionForm({ 
  onClose,
  onSuccess,
  onOpenCategories,
  categories, 
  accounts,
  currentDate
}: { 
  onClose: () => void,
  onSuccess: () => void,
  onOpenCategories?: () => void,
  categories: CategoryInfo[],
  accounts: { id: string; name: string }[],
  currentDate?: string
}) {
  const { locale, isAbroad: userAbroad } = useTranslation();
  const isEn = userAbroad || locale === 'en';
  const currencySym = getCurrencySymbol();

  const {
    type, setType,
    amount, setAmount,
    date, setDate,
    categoryId, setCategoryId,
    accountId, setAccountId,
    description, setDescription,
    isLoading, handleSubmit
  } = useAddTransactionViewModel(onSuccess, currentDate);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex p-1 bg-[rgba(255,255,255,0.05)] rounded-2xl">
        <button 
          type="button"
          onClick={() => { setType('expense'); setCategoryId(''); }}
          className={`flex-1 py-2.5 text-center rounded-xl text-body font-medium transition-all cursor-pointer ${type === 'expense' ? 'bg-[var(--primary)] shadow-sm text-black' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
        >
          {isEn ? "Expense" : "Gider"}
        </button>
        <button 
          type="button"
          onClick={() => { setType('income'); setCategoryId(''); }}
          className={`flex-1 py-2.5 text-center rounded-xl text-body font-medium transition-all cursor-pointer ${type === 'income' ? 'bg-[var(--primary)] shadow-sm text-black' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
        >
          {isEn ? "Income" : "Gelir"}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Tutar & Tarih */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="flex flex-col gap-2 min-w-0">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">{t('forms.amount')}</label>
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
                className="w-full min-w-0 max-w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 pl-10 pr-4 text-[var(--font-headline)] font-semibold text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2 min-w-0">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">{t('forms.date')}</label>
            <div className="relative min-w-0">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)] pointer-events-none" size={18} />
              <input 
                type="date" 
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-w-0 max-w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 pl-11 pr-3 text-body text-white [color-scheme:dark] focus:outline-none focus:border-[var(--inverse-primary)] transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Hesap */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">{t('forms.account')}</label>
          <CustomSelect 
            required
            value={accountId}
            onChange={setAccountId}
            placeholder={isEn ? "Select account..." : "Hesap seçiniz..."}
            options={accounts.map(acc => ({ value: acc.id, label: acc.name }))}
          />
        </div>

        {/* Kategori Seçimi (Grid / Dropdown) */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">{t('forms.category')}</label>
          
          <button 
            type="button"
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className="w-full flex items-center justify-between bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 px-4 text-body text-white hover:bg-[rgba(255,255,255,0.05)] transition-all focus:outline-none focus:border-[var(--inverse-primary)] cursor-pointer"
          >
            {categoryId ? (() => {
              const selectedCat = categories.find(c => c.id === categoryId);
              const selectedColor = selectedCat?.color || (type === 'income' ? '#22c55e' : '#f97316');
              return (
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                    style={{ 
                      backgroundColor: `${selectedColor}22`, 
                      color: selectedColor,
                      border: `1px solid ${selectedColor}44` 
                    }}
                  >
                    {getCategoryIcon(selectedCat?.icon, 16)}
                  </div>
                  <span className="font-semibold text-white">{localizeCategoryName(selectedCat?.name || '', isEn)}</span>
                </div>
              );
            })() : (
              <span className="text-[var(--on-surface-variant)]">{isEn ? "Select category..." : "Kategori seçiniz..."}</span>
            )}
            <div className={`transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--on-surface-variant)]"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </button>

          {isCategoryOpen && (
            <div className="grid grid-cols-4 gap-2.5 max-h-[220px] overflow-y-auto hide-scrollbar mt-2 p-2.5 bg-[rgba(0,0,0,0.25)] rounded-2xl border border-[rgba(255,255,255,0.08)]">
              {categories.filter(c => c.type === type).map(c => {
                const isSelected = categoryId === c.id;
                const catColor = c.color || (type === 'income' ? '#22c55e' : '#f97316');
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setCategoryId(c.id); setIsCategoryOpen(false); }}
                    className={`aspect-square flex flex-col items-center justify-center gap-1.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'shadow-md scale-102' 
                        : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/15'
                    }`}
                    style={isSelected ? {
                      borderColor: catColor,
                      backgroundColor: `${catColor}22`,
                      boxShadow: `0 4px 12px ${catColor}33`,
                    } : {}}
                  >
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform"
                      style={{ 
                        backgroundColor: `${catColor}1c`, 
                        color: catColor,
                        border: `1px solid ${catColor}33`
                      }}
                    >
                      {getCategoryIcon(c.icon, 18)}
                    </div>
                    <span className={`text-[11px] text-center px-1 truncate w-full ${isSelected ? 'font-bold text-white' : 'font-medium text-white/80'}`}>
                      {localizeCategoryName(c.name, isEn)}
                    </span>
                  </button>
                );
              })}
              {onOpenCategories && (
                <button
                  type="button"
                  onClick={onOpenCategories}
                  className="aspect-square flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-[rgba(255,255,255,0.15)] text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white hover:border-[rgba(255,255,255,0.3)] transition-all cursor-pointer"
                >
                  <div className="text-[var(--on-surface-variant)]">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </div>
                  <span className="text-[10px] text-center px-1 font-medium text-white/70">
                    {isEn ? "Add New" : "Yeni Ekle"}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Açıklama */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">{t('forms.description')}</label>
          <input 
            type="text" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isEn ? "e.g. Grocery shopping" : "Örn: Market alışverişi"}
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
          />
        </div>
      </div>

      <div className="mt-2 flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors cursor-pointer">
          {isEn ? "Cancel" : "İptal"}
        </button>
        <button type="submit" disabled={isLoading} className={`flex-[2] py-3 rounded-xl text-black font-bold transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 ${type === 'income' ? 'bg-[#4ade80] hover:bg-[#3bca69] text-black' : 'bg-[var(--primary)] hover:brightness-105'}`}>
          {isLoading ? <LoadingSpinner size="sm" /> : (isEn ? (type === 'income' ? 'Add Income' : 'Add Expense') : (type === 'income' ? 'Gelir Ekle' : 'Gider Ekle'))}
        </button>
      </div>
    </form>
  );
}
