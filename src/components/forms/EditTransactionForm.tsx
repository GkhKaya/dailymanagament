"use client";

import { t, getCurrencySymbol } from '@/lib/i18n';
import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { CategoryInfo, AccountInfo, TransactionInfo } from '@/models/DashboardTypes';
import { updateTransactionAction, deleteTransactionAction } from '@/actions/finance';
import { useTranslation } from '@/hooks/useTranslation';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { CustomSelect } from '@/components/ui/CustomSelect';
import toast from 'react-hot-toast';
import { localizeCategoryName } from '@/lib/category-helpers';
import { getCategoryIcon } from '@/lib/category-icons';

interface Props {
  transaction: TransactionInfo;
  categories: CategoryInfo[];
  accounts: AccountInfo[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTransactionForm({ transaction, categories, accounts, onClose, onSuccess }: Props) {
  const { locale, isAbroad: userAbroad } = useTranslation();
  const isEn = userAbroad || locale === 'en';
  const currencySym = getCurrencySymbol();

  const [type, setType] = useState(transaction.type);
  const [amount, setAmount] = useState(transaction.amount.toString());
  // rawDate -> 'YYYY-MM-DD'
  const initialDateStr = transaction.rawDate ? transaction.rawDate.substring(0, 10) : new Date().toISOString().substring(0, 10);
  const [date, setDate] = useState(initialDateStr);
  const [categoryId, setCategoryId] = useState(transaction.categoryId || '');
  const [accountId, setAccountId] = useState(transaction.accountId || '');
  const [description, setDescription] = useState(transaction.title || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const filteredCategories = categories.filter(c => c.type === (type as any));

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !accountId || !date) {
      toast.error(isEn ? "Please fill in all fields" : "Lütfen tüm alanları doldurun");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateTransactionAction(transaction.id, {
        type,
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        description,
        category_id: categoryId,
        account_id: accountId
      });

      if (res.success) {
        toast.success(isEn ? "Transaction updated successfully" : "İşlem başarıyla güncellendi");
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || (isEn ? "An error occurred" : "Bir hata oluştu"));
      }
    } catch (err: any) {
      toast.error(err.message || (isEn ? "An unknown error occurred" : "Bilinmeyen bir hata oluştu"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmMsg = isEn 
      ? "Are you sure you want to delete this transaction? Balance will be adjusted automatically."
      : "Bu işlemi silmek istediğinize emin misiniz? Bakiye otomatik olarak düzeltilecektir.";
    if (!confirm(confirmMsg)) return;
    
    setIsSubmitting(true);
    try {
      const res = await deleteTransactionAction(transaction.id);
      if (res.success) {
        toast.success(isEn ? "Transaction deleted successfully" : "İşlem başarıyla silindi");
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || (isEn ? "Error deleting transaction" : "Silinirken hata oluştu"));
      }
    } catch (err: any) {
      toast.error(err.message || (isEn ? "An unknown error occurred" : "Bilinmeyen bir hata oluştu"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="flex flex-col gap-6 animate-fade-in">
      {/* Tabs */}
      <div className="flex p-1 bg-[rgba(255,255,255,0.05)] rounded-2xl">
        <button 
          type="button"
          onClick={() => { setType('expense' as any); setCategoryId(''); }}
          className={`flex-1 py-2.5 text-center rounded-xl text-body font-medium transition-all cursor-pointer ${type === 'expense' ? 'bg-[var(--primary)] shadow-sm text-black' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
        >
          {isEn ? "Expense" : "Gider"}
        </button>
        <button 
          type="button"
          onClick={() => { setType('income' as any); setCategoryId(''); }}
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
              {filteredCategories.map(c => {
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

      {/* Buttons */}
      <div className="mt-2 flex gap-3">
        <button 
          type="button" 
          onClick={handleDelete} 
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium transition-colors cursor-pointer disabled:opacity-50"
        >
          {isEn ? "Delete" : "Sil"}
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className={`flex-[2] py-3 rounded-xl text-black font-bold transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 ${type === 'income' ? 'bg-[#4ade80] hover:bg-[#3bca69]' : 'bg-[var(--primary)] hover:brightness-105'}`}
        >
          {isSubmitting ? <LoadingSpinner size="sm" /> : (isEn ? "Update" : "Güncelle")}
        </button>
      </div>
    </form>
  );
}
