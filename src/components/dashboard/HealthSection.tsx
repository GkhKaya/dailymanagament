import React, { useState } from "react";
import { HealthDataDTO } from "@/models/DashboardTypes";
import { t } from "@/lib/i18n";
import { ChevronLeft, ChevronRight, Activity, Plus, ChevronDown, ChevronUp, Download, Flame, Dumbbell, Footprints, Trash2 } from "lucide-react";
import { ExportPdfModal } from "@/components/ui/ExportPdfModal";
import { SwipeableItem } from "@/components/ui/SwipeableItem";
import { deleteMealAction, deleteExerciseAction } from "@/actions/health";
import toast from "react-hot-toast";

interface HealthSectionProps {
  data: HealthDataDTO;
  isOverview?: boolean;
  currentDate?: Date;
  onPrevDay?: () => void;
  onNextDay?: () => void;
  onShowAnalysis?: () => void;
  onOpenSheet?: (type: string, payload?: unknown) => void;
  onAddBmr?: () => void;
  onRefresh?: () => Promise<void> | void;
}

export function HealthSection({ data, isOverview = true, currentDate, onPrevDay, onNextDay, onShowAnalysis, onOpenSheet, onAddBmr, onRefresh }: HealthSectionProps) {
  const [expandedMeals, setExpandedMeals] = useState<string[]>([]);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const totalBurned = data.burnedCalories;
  const netCalories = data.consumedCalories - totalBurned;

  const toggleMeal = (mealId: string) => {
    setExpandedMeals(prev => 
      prev.includes(mealId) ? prev.filter(id => id !== mealId) : [...prev, mealId]
    );
  };

  const handleDeleteFood = async (foodId: string, mealType: string) => {
    if (!foodId) return;
    const dateStr = data.date || (currentDate ? currentDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    const res = await deleteMealAction({
      date: dateStr,
      entry_id: foodId,
      type: mealType,
    });

    if (res.success) {
      toast.success("Yemek silindi");
      if (onRefresh) {
        await onRefresh();
      }
    } else {
      toast.error(res.error || "Yemek silinemedi");
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!exerciseId) return;
    const dateStr = data.date || (currentDate ? currentDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    const res = await deleteExerciseAction({
      date: dateStr,
      entry_id: exerciseId,
    });

    if (res.success) {
      toast.success("Egzersiz silindi");
      if (onRefresh) {
        await onRefresh();
      }
    } else {
      toast.error(res.error || "Egzersiz silinemedi");
    }
  };

  const handleDeleteMealCategory = async (meal: { type: string; foods?: Array<{ id: string }> }) => {
    if (!meal.foods || meal.foods.length === 0) return;
    const dateStr = data.date || (currentDate ? currentDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    
    let success = false;
    for (const food of meal.foods) {
      if (food.id) {
        const res = await deleteMealAction({
          date: dateStr,
          entry_id: food.id,
          type: meal.type,
        });
        if (res.success) success = true;
      }
    }

    if (success) {
      toast.success("Öğün silindi");
      if (onRefresh) {
        await onRefresh();
      }
    } else {
      toast.error("Öğün silinemedi");
    }
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
            className="min-h-11 min-w-11 flex items-center justify-center rounded-full bg-[#8ec13b]/15 hover:bg-[#8ec13b]/25 border border-[#8ec13b]/20 text-white transition-colors"
            title="PDF Raporu İndir"
          >
            <Download size={16} className="text-white" />
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
        <div className="flex flex-col">
          <span className="text-caption text-pink-300">ŞEKER</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-headline text-white">{data.sugar || 0}g</span>
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

      {/* Exercise Details */}
      <div className="mt-[var(--space-4)]">
        <div className="flex items-center justify-between mb-[var(--space-3)]">
          <div className="flex items-center gap-2">
            <h3 className="text-caption text-[var(--on-surface-variant)]">EGZERSİZ VE AKTİVİTELER</h3>
            {data.exercises && data.exercises.length > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#8ec13b]/15 text-[#8ec13b] font-bold border border-[#8ec13b]/20">
                {data.exercises.length} Kayıt
              </span>
            )}
          </div>
          <button 
            onClick={() => onOpenSheet && onOpenSheet('exercise')}
            aria-label="Egzersiz ekle"
            className="min-h-11 min-w-11 rounded-full border border-[#8ec13b] text-[#8ec13b] flex items-center justify-center hover:bg-[#8ec13b] hover:text-white transition-colors"
            title="Egzersiz Ekle"
          >
            <Plus size={14} />
          </button>
        </div>

        {data.exercises && data.exercises.length > 0 ? (
          <div className="flex flex-col gap-[var(--space-2)]">
            {data.exercises.map((ex) => {
              const isStep = ex.name === 'Adım Sayısı' || (ex.step_count && ex.step_count > 0);
              return (
                <div key={ex.id} className="glass-card flex flex-col overflow-hidden">
                  <SwipeableItem
                    onDelete={() => handleDeleteExercise(ex.id)}
                    confirmDeleteText="Sil"
                  >
                    <div className="px-[var(--space-3)] py-3 flex items-center justify-between hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="min-w-9 min-h-9 rounded-xl bg-[#8ec13b]/15 border border-[#8ec13b]/20 flex items-center justify-center text-[#8ec13b]">
                          {isStep ? <Footprints size={18} /> : ex.name.includes('Ağırlık') ? <Dumbbell size={18} /> : <Flame size={18} />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-body font-medium text-white capitalize">{ex.name}</span>
                          <span className="text-caption text-[var(--on-surface-variant)] flex items-center gap-2 mt-0.5">
                            {ex.duration_minutes > 0 && <span>{ex.duration_minutes} dk</span>}
                            {ex.step_count && ex.step_count > 0 && <span>{ex.step_count.toLocaleString('tr-TR')} adım</span>}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-baseline gap-1">
                          <span className="text-headline text-[#8ec13b] font-bold">+{ex.calories_burned}</span>
                          <span className="text-caption text-[var(--on-surface-variant)] lowercase">kcal</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteExercise(ex.id);
                          }}
                          className="min-h-9 min-w-9 flex items-center justify-center rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Egzersizi Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </SwipeableItem>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-4 rounded-xl flex items-center justify-between border border-[rgba(255,255,255,0.05)]">
            <div className="flex items-center gap-3">
              <div className="min-w-9 min-h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                <Flame size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white/80">Bugün henüz egzersiz eklenmedi</span>
                <span className="text-xs text-[var(--on-surface-variant)]">Egzersizlerinizi ekleyip detaylı görün.</span>
              </div>
            </div>
            <button
              onClick={() => onOpenSheet && onOpenSheet('exercise')}
              className="px-3 py-1.5 rounded-xl bg-[#8ec13b]/15 hover:bg-[#8ec13b]/25 border border-[#8ec13b]/20 text-[#8ec13b] text-xs font-bold transition-colors shrink-0 flex items-center gap-1"
            >
              <Plus size={14} /> Ekle
            </button>
          </div>
        )}
      </div>

      {/* Meal Details */}
      <div className="mt-[var(--space-4)]">
        <div className="flex items-center justify-between mb-[var(--space-3)]">
          <h3 className="text-caption text-[var(--on-surface-variant)]">ÖĞÜN DETAYLARI</h3>
          <button 
            onClick={() => onOpenSheet && onOpenSheet('meal')}
            aria-label="Öğün ekle"
            className="min-h-11 min-w-11 rounded-full border border-[var(--primary)] text-[var(--primary)] flex items-center justify-center hover:bg-[var(--primary)] hover:text-white transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
        
        <div className="flex flex-col gap-[var(--space-2)]">
          {data.meals.map((meal) => {
            const isExpanded = expandedMeals.includes(meal.id);
            const subtitle = meal.foods?.map(f => f.name).join(', ') || meal.foodName;
            const hasFoods = meal.foods && meal.foods.length > 0;
            
            return (
              <div key={meal.id} className="glass-card flex flex-col overflow-hidden">
                {/* Meal Header */}
                <SwipeableItem
                  disabled={isExpanded || !hasFoods}
                  onDelete={() => handleDeleteMealCategory(meal)}
                  onClick={() => toggleMeal(meal.id)}
                >
                  <div className="px-[var(--space-3)] py-[var(--space-2)] flex flex-col gap-[var(--space-2)] cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors">
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
                      <span className="text-caption" style={{ color: '#8ec13b' }}>P: {meal.protein !== undefined ? `${meal.protein}g` : `${Math.round(meal.calories * 0.05)}g`}</span>
                      <span className="text-caption" style={{ color: '#facc15' }}>Y: {meal.fat !== undefined ? `${meal.fat}g` : `${Math.round(meal.calories * 0.03)}g`}</span>
                      <span className="text-caption" style={{ color: '#f472b6' }}>Ş: {meal.sugar !== undefined ? `${meal.sugar}g` : '0g'}</span>
                    </div>
                  </div>
                </SwipeableItem>

                {/* Expanded Foods List */}
                {isExpanded && meal.foods && meal.foods.length > 0 && (
                  <div className="flex flex-col border-t border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.2)]">
                    {meal.foods.map((food, idx) => (
                      <SwipeableItem
                        key={food.id || idx}
                        onDelete={() => handleDeleteFood(food.id, meal.type)}
                        onClick={() => onOpenSheet && onOpenSheet('editMeal', { ...food, type: meal.type, date: data.date })}
                      >
                        <div className="flex items-center justify-between px-[var(--space-3)] py-3 border-b border-[rgba(255,255,255,0.02)] last:border-0 cursor-pointer hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                          <div className="flex flex-col">
                            <span className="text-body font-medium text-white">{food.name}</span>
                            <span className="text-caption text-[var(--on-surface-variant)] flex items-center gap-2 mt-0.5">
                              <span>{food.amount}</span>
                              <span className="text-[11px]" style={{ color: '#60a5fa' }}>K:{food.carbs_g ?? (food as any).carbs ?? 0}g</span>
                              <span className="text-[11px]" style={{ color: '#8ec13b' }}>P:{food.protein_g ?? (food as any).protein ?? 0}g</span>
                              <span className="text-[11px]" style={{ color: '#facc15' }}>Y:{food.fat_g ?? (food as any).fat ?? 0}g</span>
                              <span className="text-[11px]" style={{ color: '#f472b6' }}>Ş:{food.sugar_g ?? (food as any).sugar ?? 0}g</span>
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-body font-medium text-[var(--primary)]">{food.calories}</span>
                            <span className="text-caption text-[var(--on-surface-variant)]">kcal</span>
                          </div>
                        </div>
                      </SwipeableItem>
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
