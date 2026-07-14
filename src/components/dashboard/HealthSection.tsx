import React, { useState } from "react";
import { HealthDataDTO } from "@/models/DashboardTypes";
import { t } from "@/lib/i18n";
import { Flame, Utensils, Apple, Coffee, ChevronLeft, ChevronRight, Moon, Activity, ChevronDown, Edit2, Plus, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface HealthSectionProps {
  data: HealthDataDTO;
  isOverview?: boolean;
  currentDate?: Date;
  onPrevDay?: () => void;
  onNextDay?: () => void;
  onShowAnalysis?: () => void;
  onOpenSheet?: (type: string, payload?: unknown) => void;
}

const MealIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "breakfast": return <Coffee size={18} />;
    case "lunch": return <Utensils size={18} />;
    case "dinner": return <Utensils size={18} />;
    case "snack": return <Apple size={18} />;
    default: return <Utensils size={18} />;
  }
};

export function HealthSection({ data, isOverview = true, currentDate, onPrevDay, onNextDay, onShowAnalysis, onOpenSheet }: HealthSectionProps) {
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);

  const remaining = data.sleepMinutes === 0 
    ? data.targetCalories - data.consumedCalories 
    : data.targetCalories - data.consumedCalories + data.burnedCalories;
  
  // Format date helper
  const formatDate = (date?: Date) => {
    if (!date) return "";
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Bugün";
    return date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const toggleMeal = (id: string) => {
    setExpandedMealId(prev => prev === id ? null : id);
  };

  return (
    <div className={`flex flex-col gap-6 w-full max-w-2xl mx-auto ${isOverview ? '' : 'mt-8'} animate-slide-up anim-delay-100`}>
      
      {/* Date Navigation (Only in detailed mode) */}
      {!isOverview && currentDate && (
        <div className="flex flex-col gap-4 px-4">
          <div className="flex items-center justify-between">
            <button onClick={onPrevDay} className="w-10 h-10 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="text-subtitle font-medium tracking-tight">
              {formatDate(currentDate)}
            </span>
            <button onClick={onNextDay} className="w-10 h-10 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="flex justify-center mt-2">
            <button 
              onClick={onShowAnalysis}
              className="px-6 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] text-white font-medium transition-all flex items-center gap-2 text-sm"
            >
              <Activity size={16} className="text-[#4ade80]" />
              Detaylı Analiz
            </button>
          </div>
        </div>
      )}

      {/* Organic Inline Summary */}
      <div className="flex flex-col items-center justify-center relative mt-2 py-4 gap-4">
        {/* Soft glowing orb */}
        <div className="absolute w-full h-20 rounded-full bg-[rgba(33,196,93,0.08)] blur-xl -z-10"></div>
        
        {/* Row 1: Calories */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 w-full justify-center items-center text-body">
          {/* Alınan Kalori */}
          <div className="flex items-center gap-2">
            <span className="text-[var(--on-surface-variant)] uppercase tracking-wider text-xs">{t("dashboard.health.caloriesConsumed")}:</span>
            <span className="font-bold text-white flex items-center gap-1">
              <Utensils size={14} /> {data.consumedCalories}
            </span>
          </div>
          
          <div className="w-1 h-1 rounded-full bg-[rgba(255,255,255,0.2)]"></div>
          
          {/* Yakılan Kalori */}
          {data.sleepMinutes === 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-[var(--on-surface-variant)] uppercase tracking-wider text-xs">{t("dashboard.health.caloriesBurned")}:</span>
              <span className="font-medium text-[rgba(255,255,255,0.4)] text-sm flex items-center gap-1">
                <Flame size={14} /> {data.burnedCalories}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[var(--on-surface-variant)] uppercase tracking-wider text-xs">{t("dashboard.health.caloriesBurned")}:</span>
              <div className="flex items-center gap-1">
                <span className="font-bold text-orange-400 flex items-center gap-1">
                  <Flame size={14} /> {data.burnedCalories}
                </span>
                <span className="text-[var(--on-surface-variant)] text-sm">+</span>
                <span className="font-bold text-blue-400 flex items-center gap-1" title="Uykuda Yakılan">
                  <Moon size={14} /> {data.sleepCalories}
                </span>
              </div>
            </div>
          )}

          <div className="w-1 h-1 rounded-full bg-[rgba(255,255,255,0.2)]"></div>

          {/* Kalan Kalori */}
          <div className="flex items-center gap-2">
            <span className="text-[var(--on-surface-variant)] uppercase tracking-wider text-xs">{t("dashboard.health.caloriesRemaining")}:</span>
            <span className="font-bold text-lg text-[#4ade80]">{remaining}</span>
          </div>
        </div>

        {/* Row 2: Macros */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 w-full justify-center items-center text-body">
          {/* Karbonhidrat */}
          <div className="flex items-center gap-2">
            <span className="text-[var(--on-surface-variant)] uppercase tracking-wider text-xs">Karb:</span>
            <span className="font-bold text-[#60a5fa]">{data.carbs || 0}g</span>
          </div>
          
          <div className="w-1 h-1 rounded-full bg-[rgba(255,255,255,0.2)]"></div>
          
          {/* Yağ */}
          <div className="flex items-center gap-2">
            <span className="text-[var(--on-surface-variant)] uppercase tracking-wider text-xs">Yağ:</span>
            <span className="font-bold text-[#facc15]">{data.fat || 0}g</span>
          </div>

          <div className="w-1 h-1 rounded-full bg-[rgba(255,255,255,0.2)]"></div>

          {/* Protein */}
          <div className="flex items-center gap-2">
            <span className="text-[var(--on-surface-variant)] uppercase tracking-wider text-xs">Protein:</span>
            <span className="font-bold text-[#4ade80]">{data.protein || 0}g</span>
          </div>
        </div>
      </div>

      {/* Sleep, Weight and Exercise Inline Stats (Only in detailed mode) */}
      {!isOverview && (
        <div className="flex justify-between items-center px-2 -mt-4 mb-2">
          {/* Sleep */}
          <div className="flex items-center gap-2 text-[var(--on-surface-variant)] flex-1">
            <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-blue-400 shrink-0">
              <Moon size={16} />
            </div>
            <div>
              <span className="text-body font-medium text-white">{Math.floor(data.sleepMinutes / 60)}s {data.sleepMinutes % 60}d</span>
              <span className="text-caption block mt-0.5">Uyku</span>
            </div>
          </div>
          
          {/* Weight */}
          <div className="flex items-center justify-center gap-2 text-[var(--on-surface-variant)] flex-1 border-x border-[rgba(255,255,255,0.05)] mx-2 px-2">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <span className="text-body font-medium text-white">{data.currentWeight}</span>
                <span className="text-caption">kg</span>
                <button 
                  onClick={() => onOpenSheet && onOpenSheet('addWeight', { currentWeight: data.currentWeight, weightHistory: data.weightHistory })}
                  className="ml-1 text-[var(--primary)] hover:text-white transition-colors"
                >
                  <Edit2 size={12} />
                </button>
              </div>
              <span className="text-caption block mt-0.5 text-center">Kilo</span>
            </div>
          </div>

          {/* Exercise */}
          <div className="flex items-center justify-end gap-2 text-[var(--on-surface-variant)] flex-1">
            <div className="flex flex-col items-end">
              <span className="text-body font-medium text-white">{data.exerciseMinutes} dk</span>
              <span className="text-caption block mt-0.5">Egzersiz</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-orange-400 shrink-0">
              <Activity size={16} />
            </div>
          </div>
        </div>
      )}



      {/* Meals List - Expandable */}
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-subtitle">{t("dashboard.health.meals")}</h3>
          <div className="flex items-center gap-2">
            {data.sleepMinutes === 0 && isOverview && (
              <button 
                onClick={() => onOpenSheet && onOpenSheet('addSleep')}
                className="text-caption text-blue-400 bg-[rgba(96,165,250,0.1)] px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-[rgba(96,165,250,0.2)] transition-colors"
              >
                <Moon size={12} />
                Uyku Verisi Ekle
              </button>
            )}
            <button 
              onClick={() => onOpenSheet && onOpenSheet('meal')}
              className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition-colors text-[var(--on-surface-variant)] hover:text-white"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {data.meals.map((meal) => {
            const isExpanded = expandedMealId === meal.id;
            return (
              <div key={meal.id} className={`glass-item overflow-hidden transition-all duration-300 ${isExpanded ? 'bg-[rgba(255,255,255,0.05)]' : ''}`}>
                <div 
                  className="px-5 py-4 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleMeal(meal.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[var(--primary)]">
                      <MealIcon type={meal.type} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-body font-medium">{meal.foodName}</span>
                      <span className="text-caption text-[var(--on-surface-variant)] capitalize">
                        {t(`dashboard.health.${meal.type}`)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-body font-bold text-white">{meal.calories} kcal</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMeal(meal.id);
                      }}
                      className="p-2 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors text-[var(--on-surface-variant)] hover:text-white"
                    >
                      <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
                
                {/* Expanded Details */}
                <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 pt-1 flex flex-col gap-2">
                      <div className="w-full h-px bg-[rgba(255,255,255,0.05)] mb-2"></div>
                      {meal.foods && meal.foods.length > 0 ? (
                        meal.foods.map((food, idx) => (
                          <div key={idx} className="flex justify-between items-center text-caption group">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.2)]"></span>
                              <span className="text-[var(--on-surface-variant)]">{food.name}</span>
                              <span className="text-[rgba(255,255,255,0.3)]">({food.amount})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-white">{food.calories} kcal</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onOpenSheet) onOpenSheet('editMeal', { ...food, type: meal.type, date: data.date });
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] transition-all text-white"
                              >
                                <Edit2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-caption text-[var(--on-surface-variant)] text-center py-2">Detay bulunamadı.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Spacer for FAB */}
      {!isOverview && <div className="h-24"></div>}
    </div>
  );
}
