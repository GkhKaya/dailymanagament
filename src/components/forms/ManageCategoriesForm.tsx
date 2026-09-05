"use client";

import React, { useState } from 'react';
import { ShoppingCart, Car, Film, Coffee, Home, Zap, Heart, Gift, Briefcase, Plus, X, ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Cpu, Utensils, Music, Book } from 'lucide-react';
import { useManageCategoriesViewModel } from '@/viewmodels/useManageCategoriesViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useTranslation } from '@/hooks/useTranslation';
import { localizeCategoryName } from '@/lib/category-helpers';

const ICONS = [
  { id: 'cart', component: <ShoppingCart size={20} /> },
  { id: 'car', component: <Car size={20} /> },
  { id: 'film', component: <Film size={20} /> },
  { id: 'coffee', component: <Coffee size={20} /> },
  { id: 'home', component: <Home size={20} /> },
  { id: 'zap', component: <Zap size={20} /> },
  { id: 'heart', component: <Heart size={20} /> },
  { id: 'gift', component: <Gift size={20} /> },
  { id: 'briefcase', component: <Briefcase size={20} /> },
  { id: 'wallet', component: <Wallet size={20} /> },
  { id: 'trending', component: <TrendingUp size={20} /> },
  { id: 'tech', component: <Cpu size={20} /> },
  { id: 'food', component: <Utensils size={20} /> },
  { id: 'music', component: <Music size={20} /> },
  { id: 'book', component: <Book size={20} /> },
];

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', 
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#9ca3af'
];

export function ManageCategoriesForm({ 
  onClose, onSuccess, categories, isLoadingCategories = false 
}: { 
  onClose: () => void, onSuccess: () => void, categories: { id: string, name: string, type: string, icon?: string, color?: string }[], isLoadingCategories?: boolean 
}) {
  const [isAdding, setIsAdding] = useState(false);
  const { locale, isAbroad: userAbroad } = useTranslation();
  const isEn = userAbroad || locale === 'en';
  
  const {
    type, setType,
    name, setName,
    icon, setIcon,
    color, setColor,
    isLoading,
    handleAdd, handleDelete
  } = useManageCategoriesViewModel(() => {
    setIsAdding(false);
    onSuccess();
  });

  const displayedCats = categories.filter(c => c.type === type);
  const getIcon = (id: string) => ICONS.find(i => i.id === id)?.component || <ShoppingCart size={20} />;

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex p-1 bg-[rgba(255,255,255,0.05)] rounded-2xl">
        <button 
          type="button"
          onClick={() => { setType('expense'); setIsAdding(false); }}
          className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-xl text-body font-medium transition-all cursor-pointer ${type === 'expense' ? 'bg-[var(--surface-container)] shadow-sm text-white' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
        >
          <ArrowDownRight size={16} className={type === 'expense' ? 'text-orange-400' : ''} />
          {isEn ? "Expense" : "Gider"}
        </button>
        <button 
          type="button"
          onClick={() => { setType('income'); setIsAdding(false); }}
          className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-xl text-body font-medium transition-all cursor-pointer ${type === 'income' ? 'bg-[var(--surface-container)] shadow-sm text-white' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
        >
          <ArrowUpRight size={16} className={type === 'income' ? 'text-[#4ade80]' : ''} />
          {isEn ? "Income" : "Gelir"}
        </button>
      </div>

      {!isAdding ? (
        <>
          {/* Category Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto hide-scrollbar pb-4 animate-fade-in">
            {isLoadingCategories ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 gap-4">
                <LoadingSpinner size="md" />
                <span className="text-[var(--font-body)] text-[var(--on-surface-variant)] animate-pulse">
                  {isEn ? "Loading categories..." : "Kategoriler yükleniyor..."}
                </span>
              </div>
            ) : (
              <>
                {displayedCats.map(cat => (
                  <div key={cat.id} className="relative group glass-item aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl hover:bg-[rgba(255,255,255,0.08)] transition-colors">
                    <button 
                      type="button"
                      onClick={() => handleDelete(cat.id)}
                      disabled={isLoading}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[rgba(255,255,255,0.05)]" style={{ color: cat.color || (type === 'income' ? '#4ade80' : '#f97316') }}>
                      {getIcon(cat.icon || 'cart')}
                    </div>
                    <span className="text-caption text-center px-1 truncate w-full text-[var(--on-surface-variant)] group-hover:text-white transition-colors">
                      {localizeCategoryName(cat.name, isEn)}
                    </span>
                  </div>
                ))}
                
                {/* Add Button Box */}
                <button 
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[rgba(255,255,255,0.1)] hover:border-[var(--inverse-primary)] hover:bg-[rgba(73,75,214,0.1)] text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-all cursor-pointer"
                >
                  <Plus size={24} />
                  <span className="text-caption font-medium">{isEn ? "Add" : "Ekle"}</span>
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        /* Add Category Form */
        <form onSubmit={handleAdd} className="flex flex-col gap-4 animate-fade-in glass-item p-4">
          <h3 className="text-body font-bold text-white mb-2">
            {isEn 
              ? `New ${type === 'income' ? 'Income' : 'Expense'} Category`
              : `Yeni ${type === 'income' ? 'Gelir' : 'Gider'} Kategorisi`}
          </h3>
          
          <input 
            type="text" 
            required
            placeholder={isEn ? "Category Name" : "Kategori Adı"} 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
          />

          <div className="flex flex-col gap-2 mt-2">
            <span className="text-caption text-[var(--on-surface-variant)]">
              {isEn ? "Select Icon" : "İkon Seçin"}
            </span>
            <div className="grid grid-cols-5 gap-2">
              {ICONS.map(i => (
                <button 
                  key={i.id}
                  type="button"
                  onClick={() => setIcon(i.id)}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all cursor-pointer ${icon === i.id ? 'bg-[rgba(255,255,255,0.15)] shadow-md border border-[var(--inverse-primary)]' : 'bg-[rgba(255,255,255,0.03)] border border-transparent text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.08)]'}`}
                  style={icon === i.id ? { color: color } : {}}
                >
                  {i.component}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <span className="text-caption text-[var(--on-surface-variant)]">
              {isEn ? "Select Color" : "Renk Seçin"}
            </span>
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map(c => (
                <button 
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 rounded-full transition-all flex items-center justify-center cursor-pointer ${color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a]' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)} 
              className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors cursor-pointer"
            >
              {isEn ? "Cancel" : "İptal"}
            </button>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="flex-[2] py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : (isEn ? "Save" : "Kaydet")}
            </button>
          </div>
        </form>
      )}

      {!isAdding && (
        <div className="mt-2">
          <button 
            type="button" 
            onClick={onClose} 
            className="w-full py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors cursor-pointer"
          >
            {isEn ? "Close" : "Kapat"}
          </button>
        </div>
      )}
    </div>
  );
}
