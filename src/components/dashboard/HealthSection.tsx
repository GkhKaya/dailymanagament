import React, { useState } from "react";
import { HealthDataDTO } from "@/models/DashboardTypes";
import { t } from "@/lib/i18n";
import { ChevronLeft, ChevronRight, Activity, Plus } from "lucide-react";

interface HealthSectionProps {
  data: HealthDataDTO;
  isOverview?: boolean;
  currentDate?: Date;
  onPrevDay?: () => void;
  onNextDay?: () => void;
  onShowAnalysis?: () => void;
  onOpenSheet?: (type: string, payload?: unknown) => void;
}

export function HealthSection({ data, isOverview = true, currentDate, onPrevDay, onNextDay, onShowAnalysis, onOpenSheet }: HealthSectionProps) {
  const totalBurned = data.burnedCalories + (data.sleepCalories || 0);
  const remaining = data.targetCalories - data.consumedCalories + totalBurned;

  const formatDate = (date?: Date) => {
    if (!date) return "";
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Bugün";
    return date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className={`flex flex-col gap-[var(--space-6)] w-full max-w-2xl mx-auto animate-slide-up`}>
      
      {/* Title & Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-hero text-white tracking-tight">Bugünkü Beslenme</h2>
        
        {!isOverview && currentDate && (
          <div className="flex items-center gap-[var(--space-2)]">
            <button onClick={onPrevDay} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors text-white">
              <ChevronLeft size={20} />
            </button>
            <span className="text-body font-medium text-white">{formatDate(currentDate)}</span>
            <button onClick={onNextDay} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors text-white">
              <ChevronRight size={20} />
            </button>
            <button onClick={onShowAnalysis} className="ml-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors text-[var(--primary)]">
              <Activity size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-3 gap-[var(--space-2)]">
        {/* ALINAN */}
        <div className="glass-card p-[var(--space-3)] flex flex-col justify-center">
          <span className="text-caption text-[var(--primary)]">ALINAN</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-metric text-white">{data.consumedCalories}</span>
            <span className="text-body text-[var(--on-surface-variant)]">kcal</span>
          </div>
        </div>

        {/* YAKILAN */}
        <div className="glass-card p-[var(--space-3)] flex flex-col justify-center">
          <span className="text-caption text-[var(--on-surface-variant)]">YAKILAN</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-metric text-white">{totalBurned}</span>
            <span className="text-body text-[var(--on-surface-variant)]">kcal</span>
          </div>
        </div>

        {/* KALAN */}
        <div className="glass-card p-[var(--space-3)] flex flex-col justify-center">
          <span className="text-caption text-[var(--on-surface-variant)]">KALAN</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-metric text-[var(--primary)]">{remaining}</span>
            <span className="text-body text-[var(--on-surface-variant)]">kcal</span>
          </div>
        </div>
      </div>

      {/* Macros */}
      <div className="flex items-center gap-[var(--space-4)] mt-[var(--space-2)]">
        <div className="flex flex-col">
          <span className="text-caption text-[var(--primary)]">KARB</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-headline text-white">{data.carbs || 0}g</span>
            <span className="text-caption text-[var(--on-surface-variant)]">52%</span> {/* Example percentage */}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-caption text-white">PROTEİN</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-headline text-white">{data.protein || 0}g</span>
            <span className="text-caption text-[var(--on-surface-variant)]">33%</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-caption text-white">YAĞ</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-headline text-white">{data.fat || 0}g</span>
            <span className="text-caption text-[var(--on-surface-variant)]">15%</span>
          </div>
        </div>
        
        {/* Right Aligned Health Blocks */}
        <div className="flex items-center gap-[var(--space-4)] ml-auto">
          {/* Minimalist Sleep block */}
          <div 
            className="flex flex-col border-l border-[rgba(255,255,255,0.1)] pl-[var(--space-4)] cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => onOpenSheet && onOpenSheet('addSleep')}
          >
            <span className="text-caption text-[#818cf8] tracking-wider">UYKU</span>
            <div className="flex flex-col mt-1">
              {data.sleepMinutes > 0 ? (
                <>
                  <div className="flex items-baseline gap-1 text-[#818cf8]">
                    <span className="text-headline">{Math.floor(data.sleepMinutes / 60)}s</span>
                    <span className="text-caption">{data.sleepMinutes % 60}d</span>
                  </div>
                  {(data.sleepCalories || 0) > 0 && <span className="text-[10px] text-[#818cf8]/70 uppercase mt-0.5">{data.sleepCalories} kcal</span>}
                </>
              ) : (
                <span className="text-sm font-medium text-[var(--on-surface-variant)] mt-1 whitespace-nowrap">Veri Yok</span>
              )}
            </div>
          </div>

          {/* Minimalist Weight block */}
          <div 
            className="flex flex-col border-l border-[rgba(255,255,255,0.1)] pl-[var(--space-4)] cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => onOpenSheet && onOpenSheet('addWeight', { currentWeight: data.currentWeight, weightHistory: data.weightHistory })}
          >
            <span className="text-caption text-[#34d399] tracking-wider">KİLO</span>
            <div className="flex flex-col mt-1">
              {data.currentWeight ? (
                <div className="flex items-baseline gap-1 text-[#34d399]">
                  <span className="text-headline">{data.currentWeight}</span>
                  <span className="text-caption">kg</span>
                </div>
              ) : (
                <span className="text-sm font-medium text-[var(--on-surface-variant)] mt-1 whitespace-nowrap">Veri Yok</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Meal Details */}
      <div className="mt-[var(--space-4)]">
        <div className="flex items-center justify-between mb-[var(--space-3)]">
          <h3 className="text-caption text-[var(--on-surface-variant)]">ÖĞÜN DETAYLARI</h3>
          <button 
            onClick={() => onOpenSheet && onOpenSheet('meal')}
            className="w-6 h-6 rounded-full border border-[var(--primary)] text-[var(--primary)] flex items-center justify-center hover:bg-[var(--primary)] hover:text-black transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
        
        <div className="flex flex-col gap-[var(--space-2)]">
          {data.meals.map((meal) => {
            const subtitle = meal.foods?.map(f => f.name).join(', ') || meal.foodName;
            return (
              <div key={meal.id} className="glass-card px-[var(--space-3)] py-[var(--space-2)] flex flex-col gap-[var(--space-2)] cursor-pointer" onClick={() => onOpenSheet && onOpenSheet('editMeal', { ...meal.foods?.[0], type: meal.type, date: data.date })}>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-headline text-white capitalize">{t(`dashboard.health.${meal.type}`) || meal.type}</span>
                    <span className="text-body text-[var(--on-surface-variant)] italic text-sm line-clamp-1">{subtitle}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-headline text-[var(--primary)]">{meal.calories}</span>
                    <span className="text-caption text-[var(--on-surface-variant)] lowercase">kcal</span>
                  </div>
                </div>
                
                {/* Simulated Macro breakdown per meal based on image */}
                <div className="flex items-center gap-[var(--space-3)] mt-[var(--space-1)]">
                  <span className="text-caption text-[var(--on-surface-variant)]">350GR</span>
                  <span className="text-caption text-[var(--on-surface-variant)]">K: {Math.round(meal.calories * 0.1)}G</span>
                  <span className="text-caption text-[var(--on-surface-variant)]">P: {Math.round(meal.calories * 0.05)}G</span>
                  <span className="text-caption text-[var(--on-surface-variant)]">Y: {Math.round(meal.calories * 0.03)}G</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!isOverview && <div className="h-24"></div>}
    </div>
  );
}
