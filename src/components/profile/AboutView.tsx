'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Database, Activity, ShieldCheck, Search } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useTranslation } from '@/hooks/useTranslation';

interface FoodData {
  id: string;
  food_name: string;
  food_name_en?: string;
  unit_type: string;
  per_unit: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  nutrition_basis?: string;
}

export function AboutView({ foods }: { foods: FoodData[] }) {
  const router = useRouter();
  const { locale, isAbroad: userAbroad } = useTranslation();
  const isEn = userAbroad || locale === 'en';

  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFoods = (foods || []).filter(f => {
    const name = f?.food_name || '';
    const enName = f?.food_name_en || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           enName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-3xl animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col mb-10">
          <div className="flex items-center gap-4 mb-2">
            <button 
              onClick={() => router.push('/profile')}
              className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] flex items-center justify-center transition-colors text-white shrink-0"
              aria-label={isEn ? "Go back" : "Geri git"}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              {isEn ? "About Application" : "Uygulama Hakkında"}
            </h1>
          </div>
          <p className="text-[var(--on-surface-variant)] text-sm sm:text-base ml-[56px]">
            {isEn ? "Version and database details." : "Sürüm ve veritabanı detayları."}
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-[var(--surface-container-low)] border border-[var(--outline)] rounded-xl p-8 shadow-xl flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center justify-center mb-4">
              <Activity size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Daily Management</h2>
            <p className="text-[var(--on-surface-variant)] text-sm mb-6">{isEn ? "Version 1.0.0 (Beta)" : "Versiyon 1.0.0 (Beta)"}</p>
            <p className="text-white/80 text-sm max-w-lg mb-8 leading-relaxed">
              {isEn 
                ? "An AI-powered personal life assistant designed for finances, nutrition, and workout tracking."
                : "Bu uygulama kişisel finans, beslenme ve antrenman takibi için geliştirilmiş yapay zeka destekli bir yaşam asistanıdır."}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="bg-[var(--surface-container)] rounded-xl p-4 border border-[var(--outline)] flex items-center gap-4">
                <ShieldCheck className="text-emerald-400" size={24} />
                <div className="text-left flex flex-col">
                  <span className="text-sm font-bold text-white">{isEn ? "Secure Infrastructure" : "Güvenli Altyapı"}</span>
                  <span className="text-xs text-[var(--on-surface-variant)]">{isEn ? "Your data is encrypted & safe" : "Verileriniz güvende"}</span>
                </div>
              </div>
              <button 
                onClick={() => setIsFoodModalOpen(true)}
                className="bg-[var(--surface-container)] hover:bg-[#27272a] transition-colors rounded-xl p-4 border border-[var(--outline)] hover:border-[var(--primary)] flex items-center gap-4 group"
              >
                <Database className="text-[var(--primary)] group-hover:scale-110 transition-transform" size={24} />
                <div className="text-left flex flex-col">
                  <span className="text-sm font-bold text-white group-hover:text-[var(--primary)] transition-colors">
                    {isEn ? "Database Food Items" : "Veritabanımızdaki Besinler"}
                  </span>
                  <span className="text-xs text-[var(--on-surface-variant)]">
                    {isEn ? `${foods.length} Registered Foods` : `${foods.length} Kayıtlı Besin`}
                  </span>
                </div>
              </button>
            </div>
          </div>
          
        </div>
      </div>

      {/* Food Database Modal */}
      <BottomSheet 
        isOpen={isFoodModalOpen} 
        onClose={() => setIsFoodModalOpen(false)} 
        title={isEn ? "Registered Foods" : "Kayıtlı Besinler"}
      >
        <div className="p-4 flex flex-col h-[70vh]">
          <div className="mb-4 relative">
            <input 
              type="text" 
              placeholder={isEn ? "Search food..." : "Besin ara..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--surface-container-high)] text-white text-sm rounded-lg pl-10 pr-4 py-3 border border-[var(--outline)] focus:border-[var(--primary)] focus:outline-none transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={18} />
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2">
            {filteredFoods.length > 0 ? (
              filteredFoods.map(food => {
                let portionText = food.unit_type === 'gram' 
                  ? (isEn ? '100 grams' : '100 gram') 
                  : (isEn ? '1 piece' : '1 adet');
                if (food.nutrition_basis === 'per_unit' && food.unit_type !== 'gram') {
                  portionText = isEn ? '1 piece' : '1 adet';
                }
                
                const multiplier = food.unit_type === 'gram' ? 100 : 1;
                const cals = Math.round((food.per_unit?.calories || 0) * multiplier);
                const pro = ((food.per_unit?.protein_g || 0) * multiplier).toFixed(1);
                const carb = ((food.per_unit?.carbs_g || 0) * multiplier).toFixed(1);
                const fat = ((food.per_unit?.fat_g || 0) * multiplier).toFixed(1);

                const primaryName = isEn ? (food.food_name_en || food.food_name) : (food.food_name || 'İsimsiz');
                const secondaryName = isEn ? (food.food_name_en ? food.food_name : '') : (food.food_name_en || '');

                return (
                  <div key={food.id || Math.random().toString()} className="bg-[var(--surface-container)] rounded-lg p-3 border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-colors flex justify-between items-center gap-2">
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-bold text-white truncate">{primaryName}</span>
                      {secondaryName && (
                        <span className="text-[11px] text-[var(--on-surface-variant)] truncate">{secondaryName}</span>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0 text-right">
                      <span className="text-xs font-bold text-emerald-400">{cals} kcal</span>
                      <span className="text-[10px] text-[var(--on-surface-variant)]">
                        {portionText}
                      </span>
                    </div>
                    
                    <div className="hidden sm:flex flex-col gap-0.5 ml-4 shrink-0 text-[10px] text-[var(--on-surface-variant)]">
                      <span>P: <span className="text-white">{pro}g</span></span>
                      <span>{isEn ? 'C:' : 'K:'} <span className="text-white">{carb}g</span></span>
                      <span>{isEn ? 'F:' : 'Y:'} <span className="text-white">{fat}g</span></span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-[var(--on-surface-variant)] py-10 text-sm">
                {isEn ? "No results found." : "Sonuç bulunamadı."}
              </div>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
