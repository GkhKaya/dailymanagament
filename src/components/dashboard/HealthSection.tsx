import React, { useState } from "react";
import { HealthDataDTO } from "@/models/DashboardTypes";
import { t } from "@/lib/i18n";
import { ChevronLeft, ChevronRight, Activity, Plus, ChevronDown, ChevronUp, Download } from "lucide-react";
import { ExportPdfModal } from "@/components/ui/ExportPdfModal";

interface HealthSectionProps {
  data: HealthDataDTO;
  isOverview?: boolean;
  currentDate?: Date;
  onPrevDay?: () => void;
  onNextDay?: () => void;
  onShowAnalysis?: () => void;
  onOpenSheet?: (type: string, payload?: unknown) => void;
  onAddBmr?: () => void;
}

export function HealthSection({ data, isOverview = true, currentDate, onPrevDay, onNextDay, onShowAnalysis, onOpenSheet, onAddBmr }: HealthSectionProps) {
  const [expandedMeals, setExpandedMeals] = useState<string[]>([]);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const totalBurned = data.burnedCalories;
  const netCalories = data.consumedCalories - totalBurned;

  const toggleMeal = (mealId: string) => {
    setExpandedMeals(prev => 
      prev.includes(mealId) ? prev.filter(id => id !== mealId) : [...prev, mealId]
    );
  };



  const formatDate = (date?: Date) => {
    if (!date) return "";
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Bugün";
    return date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className={`flex flex-col gap-[var(--space-6)] w-full max-w-2xl mx-auto animate-slide-up`}>
      
      {/* Title & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-hero text-white tracking-tight">Bugünkü Beslenme</h2>
        
        <div className="flex items-center gap-[var(--space-2)]">
          {!isOverview && currentDate && (
            <>
              <button type="button" aria-label="Önceki gün" onClick={onPrevDay} className="min-h-11 min-w-11 flex items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors text-white">
                <ChevronLeft size={20} />
              </button>
              <span className="text-body font-medium text-white">{formatDate(currentDate)}</span>
              <button type="button" aria-label="Sonraki gün" onClick={onNextDay} className="min-h-11 min-w-11 flex items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors text-white">
                <ChevronRight size={20} />
              </button>
              <button type="button" aria-label="Detaylı sağlık analizi" onClick={onShowAnalysis} className="ml-1 min-h-11 min-w-11 flex items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors text-[var(--primary)]" title="Detaylı Analiz">
                <Activity size={18} />
              </button>
            </>
          )}
          <button 
            onClick={() => setIsPdfModalOpen(true)} 
            aria-label="Beslenme raporunu PDF olarak indir"
            className="min-h-11 min-w-11 flex items-center justify-center rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
            title="PDF Raporu İndir"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-[var(--space-2)] items-stretch">
        {/* ALINAN */}
        <div className="glass-card p-2 md:p-[var(--space-3)] flex flex-col justify-start overflow-hidden h-full">
          <span className="text-[11px] md:text-caption text-[var(--primary)] truncate">ALINAN</span>
          <div className="flex items-baseline gap-1 mt-1 truncate">
            <span className="text-xl md:text-metric text-white font-bold">{data.consumedCalories}</span>
            <span className="text-[11px] md:text-body text-[var(--on-surface-variant)]">kcal</span>
          </div>
          <div className="mt-1 truncate">
            <span className="text-[11px] md:text-[10px] text-[var(--on-surface-variant)] opacity-70" title={`Alınabilecek: ${data.targetCalories} kcal`}>Alınabilecek: {data.targetCalories}</span>
          </div>
        </div>

        {/* YAKILAN */}
        <div className="glass-card p-2 md:p-[var(--space-3)] flex flex-col justify-start relative overflow-hidden h-full">
          <span className="text-[11px] md:text-caption text-[var(--on-surface-variant)] truncate">YAKILAN</span>
          <div className="flex items-baseline gap-1 mt-1 truncate">
            <span className="text-xl md:text-metric text-white font-bold">{totalBurned}</span>
            <span className="text-[11px] md:text-body text-[var(--on-surface-variant)]">kcal</span>
          </div>
          {!data.bmrAdded && onAddBmr && (
            <div className="mt-1 md:mt-2">
              <button 
                onClick={onAddBmr}
                className="w-full text-center text-[11px] md:text-[10px] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white px-1 md:px-2 py-1 md:py-1.5 rounded-md transition-colors border border-[rgba(255,255,255,0.1)] truncate"
                title="Günlük Bazal Metabolizma (BMR) kalorinizi ekleyin"
              >
                + BMR Ekle
              </button>
            </div>
          )}
        </div>

        {/* NET (TOPLAM) */}
        <div className="glass-card p-2 md:p-[var(--space-3)] flex flex-col justify-start overflow-hidden h-full">
          <span className="text-[11px] md:text-caption text-[var(--on-surface-variant)] truncate">NET</span>
          <div className="flex items-baseline gap-1 mt-1 truncate">
            <span className="text-xl md:text-metric text-[var(--primary)] font-bold">{netCalories}</span>
            <span className="text-[11px] md:text-body text-[var(--on-surface-variant)]">kcal</span>
          </div>
        </div>
      </div>

      {/* Macros */}
      <div className="flex flex-wrap items-center gap-y-[var(--space-4)] gap-x-[var(--space-4)] mt-[var(--space-2)]">
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
        <div className="flex items-center gap-[var(--space-4)] md:ml-auto w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-[rgba(255,255,255,0.1)]">
          {/* Minimalist Sleep block */}
          <button type="button"
            aria-label="Uyku verisi ekle"
            className="flex flex-col text-left border-l border-[rgba(255,255,255,0.1)] pl-[var(--space-4)] cursor-pointer hover:opacity-80 transition-opacity"
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
          </button>

          {/* Minimalist Weight block */}
          <button type="button"
            aria-label="Kilo verisi ekle veya güncelle"
            className="flex flex-col text-left border-l border-[rgba(255,255,255,0.1)] pl-[var(--space-4)] cursor-pointer hover:opacity-80 transition-opacity"
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
          </button>
        </div>
      </div>

      {/* Meal Details */}
      <div className="mt-[var(--space-4)]">
        <div className="flex items-center justify-between mb-[var(--space-3)]">
          <h3 className="text-caption text-[var(--on-surface-variant)]">ÖĞÜN DETAYLARI</h3>
          <button 
            onClick={() => onOpenSheet && onOpenSheet('meal')}
            aria-label="Öğün ekle"
            className="min-h-11 min-w-11 rounded-full border border-[var(--primary)] text-[var(--primary)] flex items-center justify-center hover:bg-[var(--primary)] hover:text-black transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
        
        <div className="flex flex-col gap-[var(--space-2)]">
          {data.meals.map((meal) => {
            const isExpanded = expandedMeals.includes(meal.id);
            const subtitle = meal.foods?.map(f => f.name).join(', ') || meal.foodName;
            
            return (
              <div key={meal.id} className="glass-card flex flex-col overflow-hidden">
                {/* Meal Header */}
                <div 
                  className="px-[var(--space-3)] py-[var(--space-2)] flex flex-col gap-[var(--space-2)] cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  onClick={() => toggleMeal(meal.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-headline text-white capitalize">{t(`dashboard.health.${meal.type}`) || meal.type}</span>
                        {isExpanded ? <ChevronUp size={16} className="text-[var(--on-surface-variant)]" /> : <ChevronDown size={16} className="text-[var(--on-surface-variant)]" />}
                      </div>
                      <span className="text-body text-[var(--on-surface-variant)] italic text-sm line-clamp-1">{subtitle}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-headline text-[var(--primary)]">{meal.calories}</span>
                      <span className="text-caption text-[var(--on-surface-variant)] lowercase">kcal</span>
                    </div>
                  </div>
                  
                  {/* Real macro breakdown from actual data */}
                  <div className="flex items-center gap-[var(--space-3)] mt-[var(--space-1)]">
                    <span className="text-caption" style={{ color: '#60a5fa' }}>K: {meal.carbs !== undefined ? `${meal.carbs}g` : `${Math.round(meal.calories * 0.1)}g`}</span>
                    <span className="text-caption" style={{ color: '#4ade80' }}>P: {meal.protein !== undefined ? `${meal.protein}g` : `${Math.round(meal.calories * 0.05)}g`}</span>
                    <span className="text-caption" style={{ color: '#facc15' }}>Y: {meal.fat !== undefined ? `${meal.fat}g` : `${Math.round(meal.calories * 0.03)}g`}</span>
                  </div>
                </div>

                {/* Expanded Foods List */}
                {isExpanded && meal.foods && meal.foods.length > 0 && (
                  <div className="flex flex-col border-t border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.2)]">
                    {meal.foods.map((food, idx) => (
                      <div 
                        key={food.id || idx}
                        className="flex items-center justify-between px-[var(--space-3)] py-3 border-b border-[rgba(255,255,255,0.02)] last:border-0 cursor-pointer hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                        onClick={() => onOpenSheet && onOpenSheet('editMeal', { ...food, type: meal.type, date: data.date })}
                      >
                        <div className="flex flex-col">
                          <span className="text-body font-medium text-white">{food.name}</span>
                          <span className="text-caption text-[var(--on-surface-variant)] flex items-center gap-2 mt-0.5">
                            <span>{food.amount}</span>
                            <span className="text-[11px]" style={{ color: '#60a5fa' }}>K:{food.carbs_g ?? (food as any).carbs ?? 0}g</span>
                            <span className="text-[11px]" style={{ color: '#4ade80' }}>P:{food.protein_g ?? (food as any).protein ?? 0}g</span>
                            <span className="text-[11px]" style={{ color: '#facc15' }}>Y:{food.fat_g ?? (food as any).fat ?? 0}g</span>
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-body font-medium text-[var(--primary)]">{food.calories}</span>
                          <span className="text-caption text-[var(--on-surface-variant)]">kcal</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!isOverview && <div className="h-24"></div>}

      <ExportPdfModal 
        isOpen={isPdfModalOpen} 
        onClose={() => setIsPdfModalOpen(false)} 
        currentDate={currentDate} 
      />
    </div>
  );
}
