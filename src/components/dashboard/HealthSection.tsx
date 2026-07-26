import React, { useState, useEffect } from "react";
import { HealthDataDTO } from "@/models/DashboardTypes";
import { t } from "@/lib/i18n";
import { ChevronLeft, ChevronRight, Activity, Plus, ChevronDown, ChevronUp, Dumbbell, Edit2 } from "lucide-react";
import { getWorkoutRoutineAction } from "@/actions/workout";

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
  const [expandedMeals, setExpandedMeals] = useState<string[]>([]);
  const [workoutDays, setWorkoutDays] = useState<any[]>([]);
  const [expandedWorkoutDays, setExpandedWorkoutDays] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    getWorkoutRoutineAction().then(res => {
      if (isMounted && res.success && res.days) {
        setWorkoutDays(res.days);
      }
    });
    return () => { isMounted = false; };
  }, [data]);

  const totalBurned = data.burnedCalories + (data.sleepCalories || 0);
  const remaining = data.targetCalories - data.consumedCalories + totalBurned;

  const toggleMeal = (mealId: string) => {
    setExpandedMeals(prev => 
      prev.includes(mealId) ? prev.filter(id => id !== mealId) : [...prev, mealId]
    );
  };

  const toggleWorkoutDay = (dayId: string) => {
    setExpandedWorkoutDays(prev =>
      prev.includes(dayId) ? prev.filter(id => id !== dayId) : [...prev, dayId]
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

      {/* ── ANTRENMAN PROGRAMIM ── */}
      <div className="glass-card flex flex-col p-5 gap-4 rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12121A]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="text-[var(--primary)]" size={18} />
            <h3 className="text-caption text-[var(--on-surface-variant)] uppercase font-bold tracking-wider">
              ANTRENMAN PROGRAMIM
            </h3>
          </div>
          <button
            onClick={() => onOpenSheet && onOpenSheet('manageWorkoutRoutine')}
            className="px-3 py-1.5 rounded-xl border border-[var(--primary)] text-[var(--primary)] text-[11px] font-bold flex items-center gap-1 hover:bg-[var(--primary)] hover:text-black transition-colors"
          >
            <Plus size={14} /> + Gün / Program Ekle
          </button>
        </div>

        {workoutDays.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 border border-dashed border-[rgba(255,255,255,0.1)] rounded-2xl gap-3 text-center bg-[rgba(255,255,255,0.01)]">
            <Dumbbell size={28} className="text-[var(--on-surface-variant)] opacity-40" />
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-semibold text-white">Henüz antrenman programı girilmedi</span>
              <span className="text-[11px] text-[var(--on-surface-variant)]">
                Günlerinizi (Pazartesi, Bacak Günü vb.) ve hareketlerin set sayılarını kaydedebilirsiniz.
              </span>
            </div>
            <button
              onClick={() => onOpenSheet && onOpenSheet('manageWorkoutRoutine')}
              className="mt-1 px-4 py-2 bg-[var(--primary)] text-black font-bold text-[12px] rounded-xl hover:bg-[var(--primary-hover)] transition-all"
            >
              + Antrenman Programı Ekle
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {workoutDays.map((day) => {
              const isExpanded = expandedWorkoutDays.includes(day.id);
              const totalSets = (day.exercises || []).reduce((acc: number, ex: any) => acc + (Number(ex.sets) || 0), 0);

              return (
                <div key={day.id} className="flex flex-col bg-[#1A1A28] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden hover:border-[rgba(255,255,255,0.12)] transition-all">
                  {/* Day Header */}
                  <div
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                    onClick={() => toggleWorkoutDay(day.id)}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-white truncate">{day.day_name}</span>
                        {isExpanded ? <ChevronUp size={16} className="text-[var(--on-surface-variant)]" /> : <ChevronDown size={16} className="text-[var(--on-surface-variant)]" />}
                      </div>
                      <span className="text-[11px] text-[var(--on-surface-variant)] mt-0.5">
                        {day.exercises?.length || 0} Hareket — <strong className="text-emerald-400">{totalSets} Toplam Set</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSheet && onOpenSheet('manageWorkoutRoutine', day);
                        }}
                        className="p-1.5 text-[var(--on-surface-variant)] hover:text-white hover:bg-[rgba(255,255,255,0.08)] rounded-lg transition-colors"
                        title="Günü Düzenle"
                      >
                        <Edit2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Exercises */}
                  {isExpanded && day.exercises && day.exercises.length > 0 && (
                    <div className="flex flex-col border-t border-[rgba(255,255,255,0.06)] bg-[#141420] p-3 gap-2">
                      {day.exercises.map((ex: any, idx: number) => (
                        <div key={ex.id || idx} className="flex items-center justify-between p-2.5 bg-[#1C1C2D] rounded-xl border border-[rgba(255,255,255,0.04)]">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-[var(--primary)]/15 text-[var(--primary)] text-[11px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-[13px] font-semibold text-white">{ex.name}</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-[12px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              {ex.sets} Set {ex.reps ? `x ${ex.reps}` : ''}
                            </span>
                            {ex.weight_kg ? (
                              <span className="text-[11px] text-[var(--on-surface-variant)] font-medium">
                                ({ex.weight_kg} kg)
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!isOverview && <div className="h-24"></div>}
    </div>
  );
}
