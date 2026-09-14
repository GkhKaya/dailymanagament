"use client";

import React, { useState, useMemo } from 'react';
import { 
  Plus, X, ArrowUpRight, ArrowDownRight, Search, Check
} from 'lucide-react';
import { useManageCategoriesViewModel } from '@/viewmodels/useManageCategoriesViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useTranslation } from '@/hooks/useTranslation';
import { localizeCategoryName } from '@/lib/category-helpers';
import { 
  CATEGORY_ICON_LIST, 
  CATEGORY_PALETTE, 
  getCategoryIcon 
} from '@/lib/category-icons';

interface ManageCategoriesFormProps {
  onClose: () => void;
  onSuccess: () => void;
  categories: { id: string; name: string; type: string; icon?: string; color?: string }[];
  isLoadingCategories?: boolean;
}

export function ManageCategoriesForm({ 
  onClose, 
  onSuccess, 
  categories, 
  isLoadingCategories = false 
}: ManageCategoriesFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
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

  // Filtered icons for creation form
  const filteredIcons = useMemo(() => {
    return CATEGORY_ICON_LIST.filter(item => {
      const matchesGroup = selectedGroup === 'all' || item.group === selectedGroup;
      const matchesQuery = !iconSearch.trim() || 
        item.name.toLowerCase().includes(iconSearch.toLowerCase()) || 
        item.id.toLowerCase().includes(iconSearch.toLowerCase());
      return matchesGroup && matchesQuery;
    });
  }, [selectedGroup, iconSearch]);

  const GROUPS = [
    { id: 'all', label: isEn ? 'All' : 'Tümü' },
    { id: 'daily', label: isEn ? 'Food' : 'Gıda' },
    { id: 'transport', label: isEn ? 'Transport' : 'Ulaşım' },
    { id: 'home', label: isEn ? 'Home' : 'Ev' },
    { id: 'health', label: isEn ? 'Health' : 'Sağlık' },
    { id: 'entertainment', label: isEn ? 'Fun' : 'Eğlence' },
    { id: 'work', label: isEn ? 'Work' : 'İş' },
    { id: 'finance', label: isEn ? 'Finance' : 'Finans' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Tabs: Expense vs Income */}
      <div className="flex p-1 bg-[rgba(255,255,255,0.05)] rounded-2xl border border-white/5">
        <button 
          type="button"
          onClick={() => { setType('expense'); setIsAdding(false); }}
          className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            type === 'expense' 
              ? 'bg-[var(--surface-container)] shadow-sm text-white border border-white/10' 
              : 'text-[var(--on-surface-variant)] hover:text-white'
          }`}
        >
          <ArrowDownRight size={16} className={type === 'expense' ? 'text-orange-400' : ''} />
          {isEn ? "Expense" : "Gider"}
        </button>
        <button 
          type="button"
          onClick={() => { setType('income'); setIsAdding(false); }}
          className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            type === 'income' 
              ? 'bg-[var(--surface-container)] shadow-sm text-white border border-white/10' 
              : 'text-[var(--on-surface-variant)] hover:text-white'
          }`}
        >
          <ArrowUpRight size={16} className={type === 'income' ? 'text-[#4ade80]' : ''} />
          {isEn ? "Income" : "Gelir"}
        </button>
      </div>

      {!isAdding ? (
        <>
          {/* Category Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[340px] overflow-y-auto hide-scrollbar pb-2 animate-fade-in">
            {isLoadingCategories ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 gap-4">
                <LoadingSpinner size="md" />
                <span className="text-[var(--font-body)] text-[var(--on-surface-variant)] animate-pulse">
                  {isEn ? "Loading categories..." : "Kategoriler yükleniyor..."}
                </span>
              </div>
            ) : (
              <>
                {displayedCats.map(cat => {
                  const catColor = cat.color || (type === 'income' ? '#22c55e' : '#f97316');
                  return (
                    <div 
                      key={cat.id} 
                      className="relative group glass-item aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl hover:bg-[rgba(255,255,255,0.08)] transition-all border border-white/5 hover:border-white/15"
                    >
                      <button 
                        type="button"
                        onClick={() => handleDelete(cat.id)}
                        disabled={isLoading}
                        aria-label={isEn ? "Delete category" : "Kategoriyi sil"}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white cursor-pointer z-10"
                      >
                        <X size={12} />
                      </button>
                      <div 
                        className="w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105" 
                        style={{ 
                          backgroundColor: `${catColor}1a`, 
                          color: catColor,
                          border: `1.5px solid ${catColor}33`,
                          boxShadow: `0 4px 14px ${catColor}15`
                        }}
                      >
                        {getCategoryIcon(cat.icon, 22)}
                      </div>
                      <span className="text-xs text-center px-1.5 truncate w-full text-white/90 group-hover:text-white font-medium transition-colors">
                        {localizeCategoryName(cat.name, isEn)}
                      </span>
                    </div>
                  );
                })}
                
                {/* Add Category Button */}
                <button 
                  type="button"
                  onClick={() => {
                    setIsAdding(true);
                    // Default to sensible color if current is unset
                    if (!color) {
                      setColor(type === 'income' ? '#22c55e' : '#f97316');
                    }
                  }}
                  className="aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[rgba(255,255,255,0.15)] hover:border-[var(--inverse-primary)] hover:bg-[rgba(73,75,214,0.1)] text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-all cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-2xl border border-dashed border-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Plus size={22} />
                  </div>
                  <span className="text-xs font-semibold">{isEn ? "Add" : "Ekle"}</span>
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        /* Add Category Form */
        <form onSubmit={handleAdd} className="flex flex-col gap-4 animate-fade-in glass-item p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-white">
              {isEn 
                ? `New ${type === 'income' ? 'Income' : 'Expense'} Category`
                : `Yeni ${type === 'income' ? 'Gelir' : 'Gider'} Kategorisi`}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${color}20`, color: color }}>
              {type === 'income' ? (isEn ? 'Income' : 'Gelir') : (isEn ? 'Expense' : 'Gider')}
            </span>
          </div>

          {/* Live Preview Card */}
          <div 
            className="flex items-center gap-3.5 p-3 rounded-2xl transition-all"
            style={{ 
              backgroundColor: `${color}12`,
              border: `1.5px solid ${color}33`,
              boxShadow: `0 6px 20px ${color}15`
            }}
          >
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform"
              style={{
                backgroundColor: `${color}26`,
                color: color,
                border: `1.5px solid ${color}55`,
                boxShadow: `0 4px 16px ${color}30`
              }}
            >
              {getCategoryIcon(icon, 24)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-white/50">
                {isEn ? "Live Preview" : "Canlı Önizleme"}
              </span>
              <span className="text-sm font-bold text-white truncate">
                {name.trim() || (isEn ? "Category Name" : "Kategori Adı")}
              </span>
            </div>
          </div>
          
          {/* Category Name Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--on-surface-variant)] uppercase tracking-wider">
              {isEn ? "Category Name" : "Kategori Adı"}
            </label>
            <input 
              type="text" 
              required
              placeholder={isEn ? "e.g. Groceries, Coffee, Salary..." : "Örn: Market, Kahve, Maaş..."} 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
            />
          </div>

          {/* Color Selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--on-surface-variant)] uppercase tracking-wider">
                {isEn ? "Select Color" : "Renk Seçin"}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                <span className="text-[11px] font-mono text-white/70 uppercase">{color}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 p-2 bg-black/20 rounded-xl border border-white/5 max-h-24 overflow-y-auto">
              {CATEGORY_PALETTE.map(c => (
                <button 
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                    color.toLowerCase() === c.toLowerCase() 
                      ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#121212]' 
                      : 'hover:scale-105 opacity-85 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                >
                  {color.toLowerCase() === c.toLowerCase() && (
                    <Check size={12} className="text-white drop-shadow" strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--on-surface-variant)] uppercase tracking-wider">
                {isEn ? "Select Icon" : "İkon Seçin"} ({filteredIcons.length})
              </span>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input 
                  type="text"
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  placeholder={isEn ? "Search icon..." : "İkon ara..."}
                  className="w-full pl-8 pr-3 py-1.5 bg-white/[0.04] border border-white/10 rounded-lg text-xs text-white placeholder-white/40 focus:outline-none focus:border-[var(--inverse-primary)]"
                />
              </div>
            </div>

            {/* Group Pills */}
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
              {GROUPS.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGroup(g.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedGroup === g.id
                      ? 'bg-white/20 text-white font-semibold'
                      : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Icon Grid (Scrollable, 60+ Icons) */}
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2 bg-black/20 rounded-2xl border border-white/5 max-h-44 overflow-y-auto">
              {filteredIcons.map(item => {
                const isSelected = icon === item.id;
                const IconComponent = item.icon;
                return (
                  <button 
                    key={item.id}
                    type="button"
                    title={item.name}
                    onClick={() => setIcon(item.id)}
                    className={`aspect-square rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                      isSelected 
                        ? 'scale-105 shadow-md' 
                        : 'border-transparent bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.08]'
                    }`}
                    style={isSelected ? { 
                      backgroundColor: `${color}26`, 
                      borderColor: color, 
                      color: color,
                      boxShadow: `0 0 12px ${color}33`
                    } : {}}
                  >
                    <IconComponent size={20} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 mt-2">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)} 
              className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-white font-medium text-sm transition-colors cursor-pointer"
            >
              {isEn ? "Cancel" : "İptal"}
            </button>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="flex-[2] py-2.5 rounded-xl text-black font-bold text-sm transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 hover:brightness-110 shadow-lg"
              style={{ backgroundColor: color || 'var(--primary)' }}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : (isEn ? "Save Category" : "Kategoriyi Kaydet")}
            </button>
          </div>
        </form>
      )}

      {!isAdding && (
        <div className="mt-1">
          <button 
            type="button" 
            onClick={onClose} 
            className="w-full py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-white font-medium text-sm transition-colors cursor-pointer"
          >
            {isEn ? "Close" : "Kapat"}
          </button>
        </div>
      )}
    </div>
  );
}
