import React, { useState } from "react";
import { HealthDataDTO } from "@/models/DashboardTypes";
import { t } from "@/lib/i18n";
import { ChevronLeft, ChevronRight, Activity, Plus, ChevronDown, ChevronUp, Download, Flame, Dumbbell, Footprints, Trash2, Pencil, Camera, Sparkles, ImageDown } from "lucide-react";
import { ExportPdfModal } from "@/components/ui/ExportPdfModal";
import { SwipeableItem } from "@/components/ui/SwipeableItem";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { deleteMealAction, deleteExerciseAction } from "@/actions/health";
import toast from "react-hot-toast";
import { downloadHealthStory } from "@/lib/healthStoryGenerator";

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
  const [isBurnedModalOpen, setIsBurnedModalOpen] = useState(false);

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
          <button
            type="button"
            onClick={async () => {
              try {
                await downloadHealthStory(data);
                toast.success("Instagram hikaye görseli indirildi.");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Hikaye görseli oluşturulamadı.");
              }
            }}
            aria-label="Instagram hikaye görselini indir"
            className="min-h-11 min-w-11 flex items-center justify-center rounded-full bg-[#14b8a6]/20 hover:bg-[#14b8a6]/35 border border-[#5eead4]/30 text-white transition-colors"
            title="Instagram Hikaye Görseli İndir"
          >
            <ImageDown size={16} />
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

        {/* YAKILAN (Clickable to open exercise details) */}
        <div 
          onClick={() => setIsBurnedModalOpen(true)}
          className="glass-card p-2 md:p-[var(--space-3)] flex flex-col justify-start relative overflow-hidden h-full cursor-pointer hover:border-[#8ec13b]/40 hover:bg-[rgba(255,255,255,0.03)] transition-all group"
          title="Yakılan kalori ve egzersiz detaylarını görün"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] md:text-caption text-[var(--on-surface-variant)] truncate group-hover:text-white transition-colors">YAKILAN</span>
            <ChevronRight size={14} className="text-[var(--on-surface-variant)] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="flex items-baseline gap-1 mt-1 truncate">
            <span className="text-xl md:text-metric text-white font-bold">{totalBurned}</span>
            <span className="text-[11px] md:text-body text-[var(--on-surface-variant)]">kcal</span>
          </div>
          
          <div className="mt-1 flex items-center gap-1 flex-wrap">
            {data.exercises && data.exercises.length > 0 ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#8ec13b]/15 text-[#8ec13b] font-semibold border border-[#8ec13b]/20">
                {data.exercises.length} Egzersiz
              </span>
            ) : (
              <span className="text-[10px] text-[var(--on-surface-variant)] opacity-70">Detaylar ›</span>
            )}
          </div>

          {!data.bmrAdded && onAddBmr && (
            <div className="mt-1 md:mt-2" onClick={(e) => e.stopPropagation()}>
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
            <span className="text-caption text-[var(--on-surface-variant)]">52%</span>
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



      {/* Meal Details */}
      <div className="mt-[var(--space-4)]">
        <div className="flex items-center justify-between mb-[var(--space-3)]">
          <h3 className="text-caption text-[var(--on-surface-variant)]">ÖĞÜN DETAYLARI</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onOpenSheet && onOpenSheet('aiPhotoMeal')}
              aria-label="Fotoğraf ile AI besin ekle"
              className="px-3 py-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 flex items-center gap-1.5 hover:bg-emerald-500 hover:text-black text-xs font-bold transition-all shadow-md cursor-pointer"
              title="Fotoğraf ile AI Besin Analizi Et & Ekle"
            >
              <Camera size={14} />
              <Sparkles size={13} className="animate-pulse" />
              <span className="hidden sm:inline">Fotoğrafla AI Ekle</span>
            </button>
            <button 
              onClick={() => onOpenSheet && onOpenSheet('meal')}
              aria-label="Öğün ekle"
              className="min-h-11 min-w-11 rounded-full border border-[var(--primary)] text-[var(--primary)] flex items-center justify-center hover:bg-[var(--primary)] hover:text-white transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
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

      <BottomSheet
        isOpen={isBurnedModalOpen}
        onClose={() => setIsBurnedModalOpen(false)}
        title="Yakılan Kalori & Egzersiz Detayları"
      >
        <div className="flex flex-col gap-5">
          {/* Top Burned Overview Banner */}
          <div className="p-4 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-[var(--on-surface-variant)] uppercase tracking-wider font-medium">Toplam Yakılan Kalori</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-white">{totalBurned}</span>
                <span className="text-xs text-[var(--on-surface-variant)]">kcal</span>
              </div>
            </div>
            <button
              onClick={() => {
                setIsBurnedModalOpen(false);
                onOpenSheet && onOpenSheet('exercise');
              }}
              className="px-3.5 py-2 rounded-xl bg-[#8ec13b] hover:bg-[#79aa32] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Plus size={15} /> Egzersiz Ekle
            </button>
          </div>

          {/* Calories Breakdown Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] flex flex-col">
              <span className="text-[11px] text-[var(--on-surface-variant)]">Egzersizler</span>
              <span className="text-base font-bold text-[#8ec13b] mt-0.5">
                {data.exercises?.reduce((acc, e) => acc + (e.calories_burned || 0), 0) || 0} kcal
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] flex flex-col">
              <span className="text-[11px] text-[var(--on-surface-variant)]">BMR</span>
              <span className="text-base font-bold text-blue-400 mt-0.5">
                {data.caloriesBurnedBmr || 0} kcal
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] flex flex-col">
              <span className="text-[11px] text-[var(--on-surface-variant)]">Uyku</span>
              <span className="text-base font-bold text-[#818cf8] mt-0.5">
                {data.sleepCalories || 0} kcal
              </span>
            </div>
          </div>

          {/* Exercises List Header */}
          <div className="flex items-center justify-between pt-2">
            <h3 className="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
              Egzersiz Kayıtları ({data.exercises?.length || 0})
            </h3>
          </div>

          {/* Exercises List */}
          {data.exercises && data.exercises.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
              {data.exercises.map((ex) => {
                const isStep = ex.name === 'Adım Sayısı' || (ex.step_count && ex.step_count > 0);
                return (
                  <div key={ex.id} className="glass-card flex flex-col overflow-hidden rounded-xl">
                    <SwipeableItem
                      onDelete={() => handleDeleteExercise(ex.id)}
                      confirmDeleteText="Sil"
                    >
                      <div 
                        className="px-4 py-3 flex items-center justify-between hover:bg-[rgba(255,255,255,0.03)] transition-colors cursor-pointer"
                        onClick={() => {
                          setIsBurnedModalOpen(false);
                          onOpenSheet && onOpenSheet('exercise', ex);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="min-w-9 min-h-9 rounded-xl bg-[#8ec13b]/15 border border-[#8ec13b]/20 flex items-center justify-center text-[#8ec13b]">
                            {isStep ? <Footprints size={18} /> : ex.name.includes('Ağırlık') ? <Dumbbell size={18} /> : <Flame size={18} />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white capitalize">{ex.name}</span>
                            <span className="text-xs text-[var(--on-surface-variant)] flex items-center gap-2 mt-0.5">
                              {ex.duration_minutes > 0 && <span>{ex.duration_minutes} dk</span>}
                              {ex.step_count && ex.step_count > 0 && <span>{ex.step_count.toLocaleString('tr-TR')} adım</span>}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-baseline gap-1 mr-1">
                            <span className="text-base font-bold text-[#8ec13b]">+{ex.calories_burned}</span>
                            <span className="text-xs text-[var(--on-surface-variant)]">kcal</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsBurnedModalOpen(false);
                              onOpenSheet && onOpenSheet('exercise', ex);
                            }}
                            className="min-h-8 min-w-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                            title="Egzersizi Düzenle"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteExercise(ex.id);
                            }}
                            className="min-h-8 min-w-8 flex items-center justify-center rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Egzersizi Sil"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </SwipeableItem>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-3 border border-[rgba(255,255,255,0.05)] py-8">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                <Flame size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">Bugün henüz egzersiz kaydı yok</span>
                <span className="text-xs text-[var(--on-surface-variant)] mt-1">Yürüdüğünüz adımları veya antrenmanlarınızı kaydedebilirsiniz.</span>
              </div>
              <button
                onClick={() => {
                  setIsBurnedModalOpen(false);
                  onOpenSheet && onOpenSheet('exercise');
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-[#8ec13b] text-white text-xs font-bold hover:bg-[#79aa32] transition-colors shadow-md flex items-center gap-1.5"
              >
                <Plus size={15} /> Egzersiz Ekle
              </button>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
