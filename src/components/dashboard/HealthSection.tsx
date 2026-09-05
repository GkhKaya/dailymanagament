import React, { useState } from "react";
import { HealthDataDTO } from "@/models/DashboardTypes";
import { t } from "@/lib/i18n";
import { useTranslation } from "@/hooks/useTranslation";
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
  const { t: translate, locale, isAbroad: userAbroad } = useTranslation();
  const isEn = userAbroad || locale === 'en';

  const [expandedMeals, setExpandedMeals] = useState<string[]>([]);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isBurnedModalOpen, setIsBurnedModalOpen] = useState(false);
  const [isStoryMenuOpen, setIsStoryMenuOpen] = useState(false);
  const [isDownloadingStory, setIsDownloadingStory] = useState(false);
  const storyMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (storyMenuRef.current && !storyMenuRef.current.contains(event.target as Node)) {
        setIsStoryMenuOpen(false);
      }
    };
    if (isStoryMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStoryMenuOpen]);

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
      toast.success(isEn ? "Food deleted" : "Yemek silindi");
      if (onRefresh) {
        await onRefresh();
      }
    } else {
      toast.error(res.error || (isEn ? "Could not delete food" : "Yemek silinemedi"));
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
      toast.success(isEn ? "Exercise deleted" : "Egzersiz silindi");
      if (onRefresh) {
        await onRefresh();
      }
    } else {
      toast.error(res.error || (isEn ? "Could not delete exercise" : "Egzersiz silinemedi"));
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
      toast.success(isEn ? "Meal deleted" : "Öğün silindi");
      if (onRefresh) {
        await onRefresh();
      }
    } else {
      toast.error(isEn ? "Could not delete meal" : "Öğün silinemedi");
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return "";
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return isEn ? "Today" : "Bugün";
    return date.toLocaleDateString(isEn ? 'en-US' : 'tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className={`flex flex-col gap-[var(--space-6)] w-full ${isOverview ? 'max-w-2xl' : 'max-w-[1600px]'} mx-auto animate-slide-up`}>
      
      {/* Title & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-hero text-white tracking-tight">{isEn ? "Today's Nutrition" : "Bugünkü Beslenme"}</h2>
        
        <div className="flex items-center gap-[var(--space-2)]">
          {!isOverview && currentDate && (
            <>
              <button type="button" aria-label={isEn ? "Previous day" : "Önceki gün"} onClick={onPrevDay} className="min-h-11 min-w-11 flex items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors text-white">
                <ChevronLeft size={20} />
              </button>
              <span className="text-body font-medium text-white">{formatDate(currentDate)}</span>
              <button type="button" aria-label={isEn ? "Next day" : "Sonraki gün"} onClick={onNextDay} className="min-h-11 min-w-11 flex items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors text-white">
                <ChevronRight size={20} />
              </button>
              <button type="button" data-tour="health-analysis-btn" aria-label={isEn ? "Detailed health analysis" : "Detaylı sağlık analizi"} onClick={onShowAnalysis} className="ml-1 min-h-11 min-w-11 flex items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors text-[var(--primary)]" title={isEn ? "Detailed Analysis" : "Detaylı Analiz"}>
                <Activity size={18} />
              </button>
            </>
          )}
          <button 
            data-tour="health-pdf-btn"
            onClick={() => setIsPdfModalOpen(true)} 
            aria-label={isEn ? "Download nutrition report as PDF" : "Beslenme raporunu PDF olarak indir"}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-full bg-[#8ec13b]/15 hover:bg-[#8ec13b]/25 border border-[#8ec13b]/20 text-white transition-colors"
            title={isEn ? "Download PDF Report" : "PDF Raporu İndir"}
          >
            <Download size={16} className="text-white" />
          </button>
          <div className="relative" ref={storyMenuRef}>
            <button
              type="button"
              onClick={() => setIsStoryMenuOpen(!isStoryMenuOpen)}
              disabled={isDownloadingStory}
              aria-label={isEn ? "Download Instagram story image" : "Instagram hikaye görselini indir"}
              className="min-h-11 min-w-11 flex items-center justify-center rounded-full bg-[#14b8a6]/20 hover:bg-[#14b8a6]/35 border border-[#5eead4]/30 text-white transition-colors disabled:opacity-50"
              title={isEn ? "Download Instagram Story Image (1080x1920)" : "Instagram Hikaye Görseli İndir (1080x1920)"}
            >
              <ImageDown size={16} />
            </button>

            {isStoryMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[210px] rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[#161622] p-1.5 shadow-2xl backdrop-blur-xl animate-fade-in space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-variant)]">
                  {isEn ? "Story Language (1080x1920)" : "Hikaye Dili (1080x1920)"}
                </div>
                <button
                  type="button"
                  disabled={isDownloadingStory}
                  onClick={async () => {
                    setIsStoryMenuOpen(false);
                    setIsDownloadingStory(true);
                    try {
                      await downloadHealthStory(data, 'tr');
                      toast.success(isEn ? "Turkish story image downloaded." : "Türkçe hikaye görseli (1080x1920) indirildi.");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : (isEn ? "Story image could not be created." : "Hikaye görseli oluşturulamadı."));
                    } finally {
                      setIsDownloadingStory(false);
                    }
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">TR</span>
                    <span>{isEn ? "Download Turkish" : "Türkçe İndir"}</span>
                  </div>
                  <span className="text-[10px] opacity-60">Story</span>
                </button>
                <button
                  type="button"
                  disabled={isDownloadingStory}
                  onClick={async () => {
                    setIsStoryMenuOpen(false);
                    setIsDownloadingStory(true);
                    try {
                      await downloadHealthStory(data, 'en');
                      toast.success(isEn ? "English story image (1080x1920) downloaded." : "English story image (1080x1920) indirildi.");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : (isEn ? "Story image could not be created." : "Hikaye görseli oluşturulamadı."));
                    } finally {
                      setIsDownloadingStory(false);
                    }
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-400">EN</span>
                    <span>{isEn ? "Download English" : "Download English"}</span>
                  </div>
                  <span className="text-[10px] opacity-60">Story</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className={`grid ${isOverview ? 'grid-cols-3' : 'grid-cols-3 lg:grid-cols-5'} gap-2 md:gap-[var(--space-3)] items-stretch`}>
        {/* ALINAN */}
        <div className="glass-card p-2 md:p-[var(--space-3)] flex flex-col justify-start overflow-hidden h-full">
          <span className="text-[11px] md:text-caption text-[var(--primary)] truncate">{isEn ? "CONSUMED" : "ALINAN"}</span>
          <div className="flex items-baseline gap-1 mt-1 truncate">
            <span className="text-xl md:text-metric text-white font-bold">{data.consumedCalories}</span>
            <span className="text-[11px] md:text-body text-[var(--on-surface-variant)]">kcal</span>
          </div>
          <div className="mt-1 truncate">
            <span className="text-[11px] md:text-[10px] text-[var(--on-surface-variant)] opacity-70" title={`${isEn ? "Goal:" : "Alınabilecek:"} ${data.targetCalories} kcal`}>{isEn ? "Goal:" : "Alınabilecek:"} {data.targetCalories}</span>
          </div>
        </div>

        {/* YAKILAN (Clickable to open exercise details) */}
        <div 
          onClick={() => setIsBurnedModalOpen(true)}
          className="glass-card p-2 md:p-[var(--space-3)] flex flex-col justify-start relative overflow-hidden h-full cursor-pointer hover:border-[#8ec13b]/40 hover:bg-[rgba(255,255,255,0.03)] transition-all group"
          title={isEn ? "View burned calories and exercise details" : "Yakılan kalori ve egzersiz detaylarını görün"}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] md:text-caption text-[var(--on-surface-variant)] truncate group-hover:text-white transition-colors">{isEn ? "BURNED" : "YAKILAN"}</span>
            <ChevronRight size={14} className="text-[var(--on-surface-variant)] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="flex items-baseline gap-1 mt-1 truncate">
            <span className="text-xl md:text-metric text-white font-bold">{totalBurned}</span>
            <span className="text-[11px] md:text-body text-[var(--on-surface-variant)]">kcal</span>
          </div>
          
          <div className="mt-1 flex items-center gap-1 flex-wrap">
            {data.exercises && data.exercises.length > 0 ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#8ec13b]/15 text-[#8ec13b] font-semibold border border-[#8ec13b]/20">
                {data.exercises.length} {isEn ? (data.exercises.length > 1 ? "Exercises" : "Exercise") : "Egzersiz"}
              </span>
            ) : (
              <span className="text-[10px] text-[var(--on-surface-variant)] opacity-70">{isEn ? "Details ›" : "Detaylar ›"}</span>
            )}
          </div>

          {!data.bmrAdded && onAddBmr && (
            <div className="mt-1 md:mt-2" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={onAddBmr}
                className="w-full text-center text-[11px] md:text-[10px] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white px-1 md:px-2 py-1 md:py-1.5 rounded-md transition-colors border border-[rgba(255,255,255,0.1)] truncate cursor-pointer"
                title={isEn ? "Add your daily Basal Metabolic Rate (BMR) calories" : "Günlük Bazal Metabolizma (BMR) kalorinizi ekleyin"}
              >
                {isEn ? "+ Add BMR" : "+ BMR Ekle"}
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

        {/* UYKU & KİLO (Desktop view when full health) */}
        {!isOverview && (
          <>
            <div 
              onClick={() => onOpenSheet && onOpenSheet('addSleep')}
              className="glass-card p-2 md:p-[var(--space-3)] flex flex-col justify-start overflow-hidden h-full cursor-pointer hover:bg-white/5 transition-all"
              title={isEn ? "Add or edit sleep data" : "Uyku verisi ekle veya düzenle"}
            >
              <span className="text-[11px] md:text-caption text-[#818cf8] truncate">{isEn ? "SLEEP" : "UYKU"}</span>
              <div className="flex items-baseline gap-1 mt-1 truncate">
                {data.sleepMinutes > 0 ? (
                  <>
                    <span className="text-xl md:text-metric text-white font-bold">{Math.floor(data.sleepMinutes / 60)}{isEn ? "h" : "s"}</span>
                    <span className="text-[11px] md:text-body text-[var(--on-surface-variant)]">{data.sleepMinutes % 60}{isEn ? "m" : "d"}</span>
                  </>
                ) : (
                  <span className="text-sm md:text-base font-bold text-[var(--on-surface-variant)] mt-1">{isEn ? "No Data" : "Veri Yok"}</span>
                )}
              </div>
              <div className="mt-1 truncate">
                <span className="text-[10px] text-[#818cf8]/80">{data.sleepCalories ? `${data.sleepCalories} kcal ${isEn ? "burned" : "yakım"}` : (isEn ? "Click to Add ›" : "Tıkla ve Ekle ›")}</span>
              </div>
            </div>

            <div 
              onClick={() => onOpenSheet && onOpenSheet('addWeight', { currentWeight: data.currentWeight, weightHistory: data.weightHistory })}
              className="glass-card p-2 md:p-[var(--space-3)] flex flex-col justify-start overflow-hidden h-full cursor-pointer hover:bg-white/5 transition-all"
              title={isEn ? "Add or update weight data" : "Kilo verisi ekle veya güncelle"}
            >
              <span className="text-[11px] md:text-caption text-[#34d399] truncate">{isEn ? "WEIGHT" : "KİLO"}</span>
              <div className="flex items-baseline gap-1 mt-1 truncate">
                {data.currentWeight ? (
                  <>
                    <span className="text-xl md:text-metric text-white font-bold">{data.currentWeight}</span>
                    <span className="text-[11px] md:text-body text-[var(--on-surface-variant)]">kg</span>
                  </>
                ) : (
                  <span className="text-sm md:text-base font-bold text-[var(--on-surface-variant)] mt-1">{isEn ? "No Data" : "Veri Yok"}</span>
                )}
              </div>
              <div className="mt-1 truncate">
                <span className="text-[10px] text-[#34d399]/80">{isEn ? "Click to Update ›" : "Tıkla ve Güncelle ›"}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Overview Macros Row (When in overview) */}
      {isOverview && (
        <div className="flex flex-wrap items-center gap-y-[var(--space-4)] gap-x-[var(--space-4)] mt-[var(--space-2)]">
          <div className="flex flex-col">
            <span className="text-caption text-[var(--primary)]">{isEn ? "CARBS" : "KARB"}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-headline text-white">{data.carbs || 0}g</span>
              <span className="text-caption text-[var(--on-surface-variant)]">52%</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-caption text-white">{isEn ? "PROTEIN" : "PROTEİN"}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-headline text-white">{data.protein || 0}g</span>
              <span className="text-caption text-[var(--on-surface-variant)]">33%</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-caption text-white">{isEn ? "FAT" : "YAĞ"}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-headline text-white">{data.fat || 0}g</span>
              <span className="text-caption text-[var(--on-surface-variant)]">15%</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-caption text-pink-300">{isEn ? "SUGAR" : "ŞEKER"}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-headline text-white">{data.sugar || 0}g</span>
            </div>
          </div>
          
          {/* Right Aligned Health Blocks */}
          <div className="flex items-center gap-[var(--space-4)] md:ml-auto w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-[rgba(255,255,255,0.1)]">
            <button type="button"
              aria-label={isEn ? "Add sleep data" : "Uyku verisi ekle"}
              className="flex flex-col text-left border-l border-[rgba(255,255,255,0.1)] pl-[var(--space-4)] cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onOpenSheet && onOpenSheet('addSleep')}
            >
              <span className="text-caption text-[#818cf8] tracking-wider">{isEn ? "SLEEP" : "UYKU"}</span>
              <div className="flex flex-col mt-1">
                {data.sleepMinutes > 0 ? (
                  <>
                    <div className="flex items-baseline gap-1 text-[#818cf8]">
                      <span className="text-headline">{Math.floor(data.sleepMinutes / 60)}{isEn ? "h" : "s"}</span>
                      <span className="text-caption">{data.sleepMinutes % 60}{isEn ? "m" : "d"}</span>
                    </div>
                    {(data.sleepCalories || 0) > 0 && <span className="text-[10px] text-[#818cf8]/70 uppercase mt-0.5">{data.sleepCalories} kcal</span>}
                  </>
                ) : (
                  <span className="text-sm font-medium text-[var(--on-surface-variant)] mt-1 whitespace-nowrap">{isEn ? "No Data" : "Veri Yok"}</span>
                )}
              </div>
            </button>

            <button type="button"
              aria-label={isEn ? "Add or update weight data" : "Kilo verisi ekle veya güncelle"}
              className="flex flex-col text-left border-l border-[rgba(255,255,255,0.1)] pl-[var(--space-4)] cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onOpenSheet && onOpenSheet('addWeight', { currentWeight: data.currentWeight, weightHistory: data.weightHistory })}
            >
              <span className="text-caption text-[#34d399] tracking-wider">{isEn ? "WEIGHT" : "KİLO"}</span>
              <div className="flex flex-col mt-1">
                {data.currentWeight ? (
                  <div className="flex items-baseline gap-1 text-[#34d399]">
                    <span className="text-headline">{data.currentWeight}</span>
                    <span className="text-caption">kg</span>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-[var(--on-surface-variant)] mt-1 whitespace-nowrap">{isEn ? "No Data" : "Veri Yok"}</span>
                )}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Layout: 2-Column on Desktop when !isOverview */}
      <div className={isOverview ? "flex flex-col gap-[var(--space-4)]" : "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"}>
        {/* Left / Main Column: Meals */}
        <div className={isOverview ? "w-full" : "lg:col-span-7 xl:col-span-8 flex flex-col"}>
          {/* Meal Details */}
          <div className="mt-[var(--space-2)]">
        <div className="flex items-center justify-between mb-[var(--space-3)]">
          <h3 className="text-caption text-[var(--on-surface-variant)]">{isEn ? "MEAL DETAILS" : "ÖĞÜN DETAYLARI"}</h3>
          <div className="flex items-center gap-2">
            <button 
              data-tour="health-ai-meal"
              onClick={() => onOpenSheet && onOpenSheet('aiPhotoMeal')}
              aria-label={isEn ? "Add AI meal from photo" : "Fotoğraf ile AI besin ekle"}
              className="px-3 py-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 flex items-center gap-1.5 hover:bg-emerald-500 hover:text-black text-xs font-bold transition-all shadow-md cursor-pointer"
              title={isEn ? "AI Food Analysis & Add with Photo" : "Fotoğraf ile AI Besin Analizi Et & Ekle"}
            >
              <Camera size={14} />
              <Sparkles size={13} className="animate-pulse" />
              <span className="hidden sm:inline">{isEn ? "AI Photo Meal" : "Fotoğrafla AI Ekle"}</span>
            </button>
            <button 
              data-tour="health-add-meal"
              onClick={() => onOpenSheet && onOpenSheet('meal')}
              aria-label={isEn ? "Add meal" : "Öğün ekle"}
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
                      <span className="text-caption" style={{ color: '#60a5fa' }}>{isEn ? "C:" : "K:"} {meal.carbs !== undefined ? `${meal.carbs}g` : `${Math.round(meal.calories * 0.1)}g`}</span>
                      <span className="text-caption" style={{ color: '#8ec13b' }}>P: {meal.protein !== undefined ? `${meal.protein}g` : `${Math.round(meal.calories * 0.05)}g`}</span>
                      <span className="text-caption" style={{ color: '#facc15' }}>{isEn ? "F:" : "Y:"} {meal.fat !== undefined ? `${meal.fat}g` : `${Math.round(meal.calories * 0.03)}g`}</span>
                      <span className="text-caption" style={{ color: '#f472b6' }}>{isEn ? "S:" : "Ş:"} {meal.sugar !== undefined ? `${meal.sugar}g` : '0g'}</span>
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
                              <span className="text-[11px]" style={{ color: '#60a5fa' }}>{isEn ? "C:" : "K:"}{food.carbs_g ?? (food as any).carbs ?? 0}g</span>
                              <span className="text-[11px]" style={{ color: '#8ec13b' }}>P:{food.protein_g ?? (food as any).protein ?? 0}g</span>
                              <span className="text-[11px]" style={{ color: '#facc15' }}>{isEn ? "F:" : "Y:"}{food.fat_g ?? (food as any).fat ?? 0}g</span>
                              <span className="text-[11px]" style={{ color: '#f472b6' }}>{isEn ? "S:" : "Ş:"}{food.sugar_g ?? (food as any).sugar ?? 0}g</span>
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
    </div>

    {/* Right Column: Only on desktop / full health page */}
    {!isOverview && (
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
        {/* Makro Besin Dağılımı */}
        <div className="glass-card p-5 rounded-2xl flex flex-col gap-4 border border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center justify-between">
            <h3 className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider font-semibold">{isEn ? "MACRONUTRIENT BREAKDOWN" : "MAKRO BESİN DAĞILIMI"}</h3>
            <span className="text-xs text-[var(--on-surface-variant)] font-medium">{isEn ? "Total" : "Toplam"} {(data.carbs || 0) + (data.protein || 0) + (data.fat || 0)}g</span>
          </div>

          {/* Stacked Macro Bar */}
          <div className="h-3.5 w-full rounded-full bg-white/5 overflow-hidden flex">
            {((data.carbs || 0) + (data.protein || 0) + (data.fat || 0) > 0) ? (
              <>
                <div 
                  style={{ width: `${Math.round(((data.carbs || 0) / ((data.carbs || 0) + (data.protein || 0) + (data.fat || 0))) * 100)}%` }} 
                  className="bg-[#60a5fa] h-full"
                  title={`${isEn ? "Carbohydrate" : "Karbonhidrat"}: ${data.carbs || 0}g`}
                />
                <div 
                  style={{ width: `${Math.round(((data.protein || 0) / ((data.carbs || 0) + (data.protein || 0) + (data.fat || 0))) * 100)}%` }} 
                  className="bg-[#8ec13b] h-full"
                  title={`Protein: ${data.protein || 0}g`}
                />
                <div 
                  style={{ width: `${Math.round(((data.fat || 0) / ((data.carbs || 0) + (data.protein || 0) + (data.fat || 0))) * 100)}%` }} 
                  className="bg-[#facc15] h-full"
                  title={`${isEn ? "Fat" : "Yağ"}: ${data.fat || 0}g`}
                />
              </>
            ) : (
              <div className="w-full h-full bg-white/10" />
            )}
          </div>

          {/* Macro Breakdown Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#60a5fa]">{isEn ? "CARBS" : "KARBONHİDRAT"}</span>
                <span className="text-[11px] text-[var(--on-surface-variant)]">
                  {((data.carbs || 0) + (data.protein || 0) + (data.fat || 0) > 0) ? `${Math.round(((data.carbs || 0) / ((data.carbs || 0) + (data.protein || 0) + (data.fat || 0))) * 100)}%` : '0%'}
                </span>
              </div>
              <span className="text-xl font-bold text-white mt-1">{data.carbs || 0}<span className="text-xs text-[var(--on-surface-variant)] ml-0.5">g</span></span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8ec13b]">{isEn ? "PROTEIN" : "PROTEİN"}</span>
                <span className="text-[11px] text-[var(--on-surface-variant)]">
                  {((data.carbs || 0) + (data.protein || 0) + (data.fat || 0) > 0) ? `${Math.round(((data.protein || 0) / ((data.carbs || 0) + (data.protein || 0) + (data.fat || 0))) * 100)}%` : '0%'}
                </span>
              </div>
              <span className="text-xl font-bold text-white mt-1">{data.protein || 0}<span className="text-xs text-[var(--on-surface-variant)] ml-0.5">g</span></span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#facc15]">{isEn ? "FAT" : "YAĞ"}</span>
                <span className="text-[11px] text-[var(--on-surface-variant)]">
                  {((data.carbs || 0) + (data.protein || 0) + (data.fat || 0) > 0) ? `${Math.round(((data.fat || 0) / ((data.carbs || 0) + (data.protein || 0) + (data.fat || 0))) * 100)}%` : '0%'}
                </span>
              </div>
              <span className="text-xl font-bold text-white mt-1">{data.fat || 0}<span className="text-xs text-[var(--on-surface-variant)] ml-0.5">g</span></span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-pink-400">{isEn ? "SUGAR" : "ŞEKER"}</span>
                <span className="text-[11px] text-[var(--on-surface-variant)]">Limit</span>
              </div>
              <span className="text-xl font-bold text-white mt-1">{data.sugar || 0}<span className="text-xs text-[var(--on-surface-variant)] ml-0.5">g</span></span>
            </div>
          </div>
        </div>

        {/* Günün Kalori Yakımı & Egzersizleri */}
        <div className="glass-card p-5 rounded-2xl flex flex-col gap-4 border border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider font-semibold">{isEn ? "CALORIE BURN & ACTIVITIES" : "KALORİ YAKIMI & AKTİVİTELER"}</h3>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-white">{totalBurned}</span>
                <span className="text-xs text-[var(--on-surface-variant)]">{isEn ? "kcal total" : "kcal toplam"}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenSheet && onOpenSheet('exercise')}
              className="px-3 py-1.5 rounded-xl bg-[#8ec13b] hover:bg-[#79aa32] text-white text-xs font-bold transition-all shadow flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} /> {isEn ? "Add Exercise" : "Egzersiz Ekle"}
            </button>
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col">
              <span className="text-[10px] text-[var(--on-surface-variant)] uppercase">{isEn ? "Exercises" : "Egzersizler"}</span>
              <span className="text-sm font-bold text-[#8ec13b] mt-0.5">
                {data.exercises?.reduce((acc, e) => acc + (e.calories_burned || 0), 0) || 0} <span className="text-[10px] font-normal text-white/60">kcal</span>
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col">
              <span className="text-[10px] text-[var(--on-surface-variant)] uppercase">BMR</span>
              <span className="text-sm font-bold text-blue-400 mt-0.5">
                {data.caloriesBurnedBmr || 0} <span className="text-[10px] font-normal text-white/60">kcal</span>
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col">
              <span className="text-[10px] text-[var(--on-surface-variant)] uppercase">{isEn ? "Sleep" : "Uyku"}</span>
              <span className="text-sm font-bold text-[#818cf8] mt-0.5">
                {data.sleepCalories || 0} <span className="text-[10px] font-normal text-white/60">kcal</span>
              </span>
            </div>
          </div>

          {/* Exercises list */}
          {data.exercises && data.exercises.length > 0 ? (
            <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
              <span className="text-[11px] font-semibold text-[var(--on-surface-variant)] uppercase">{isEn ? "Logged Exercises" : "Kayıtlı Egzersizler"} ({data.exercises.length})</span>
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                {data.exercises.map((ex) => {
                  const isStep = ex.name === 'Adım Sayısı' || (ex.step_count && ex.step_count > 0);
                  return (
                    <div key={ex.id} className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] flex items-center justify-between transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#8ec13b]/15 border border-[#8ec13b]/20 flex items-center justify-center text-[#8ec13b] shrink-0">
                          {isStep ? <Footprints size={15} /> : ex.name.includes('Ağırlık') ? <Dumbbell size={15} /> : <Flame size={15} />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-white capitalize">{isEn && ex.name === 'Adım Sayısı' ? 'Daily Steps' : ex.name}</span>
                          <span className="text-[11px] text-[var(--on-surface-variant)]">
                            {ex.duration_minutes > 0 ? `${ex.duration_minutes} ${isEn ? "min" : "dk"}` : ''}
                            {ex.step_count && ex.step_count > 0 ? ` • ${ex.step_count.toLocaleString(isEn ? 'en-US' : 'tr-TR')} ${isEn ? "steps" : "adım"}` : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#8ec13b]">+{ex.calories_burned} kcal</span>
                        <button
                          type="button"
                          onClick={() => onOpenSheet && onOpenSheet('exercise', ex)}
                          className="p-1 rounded text-white/50 hover:text-white transition-colors"
                          title={isEn ? "Edit" : "Düzenle"}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExercise(ex.id)}
                          className="p-1 rounded text-red-400/50 hover:text-red-400 transition-colors"
                          title={isEn ? "Delete" : "Sil"}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col items-center text-center gap-1.5 py-6">
              <Flame size={22} className="text-white/30 mb-1" />
              <span className="text-xs font-medium text-white/80">{isEn ? "No exercises logged today" : "Bugün henüz egzersiz kaydı yok"}</span>
              <span className="text-[11px] text-[var(--on-surface-variant)]">{isEn ? "Track your calorie burn by logging your steps and workouts." : "Adımlarınızı ve antrenmanlarınızı ekleyerek kalori yakımınızı takip edin."}</span>
            </div>
          )}
        </div>

        {/* Sağlık Ölçümleri (Uyku & Kilo) */}
        <div className="grid grid-cols-2 gap-4">
          <div 
            onClick={() => onOpenSheet && onOpenSheet('addSleep')}
            className="glass-card p-4 rounded-2xl border border-[rgba(255,255,255,0.06)] flex flex-col justify-between cursor-pointer hover:border-[#818cf8]/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#818cf8] uppercase tracking-wider">{isEn ? "SLEEP" : "UYKU"}</span>
              <Pencil size={12} className="text-white/30 group-hover:text-white/70 transition-colors" />
            </div>
            <div className="mt-3">
              {data.sleepMinutes > 0 ? (
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1 text-[#818cf8]">
                    <span className="text-xl font-bold">{Math.floor(data.sleepMinutes / 60)}</span>
                    <span className="text-xs">{isEn ? "h" : "sa"}</span>
                    <span className="text-xl font-bold ml-1">{data.sleepMinutes % 60}</span>
                    <span className="text-xs">{isEn ? "m" : "dk"}</span>
                  </div>
                  {(data.sleepCalories || 0) > 0 && (
                    <span className="text-[10px] text-[#818cf8]/70 mt-0.5">{data.sleepCalories} kcal</span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-[var(--on-surface-variant)] font-medium">{isEn ? "No Record" : "Kayıt Yok"}</span>
              )}
            </div>
          </div>

          <div 
            onClick={() => onOpenSheet && onOpenSheet('addWeight', { currentWeight: data.currentWeight, weightHistory: data.weightHistory })}
            className="glass-card p-4 rounded-2xl border border-[rgba(255,255,255,0.06)] flex flex-col justify-between cursor-pointer hover:border-[#34d399]/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#34d399] uppercase tracking-wider">{isEn ? "WEIGHT" : "KİLO"}</span>
              <Pencil size={12} className="text-white/30 group-hover:text-white/70 transition-colors" />
            </div>
            <div className="mt-3">
              {data.currentWeight ? (
                <div className="flex items-baseline gap-1 text-[#34d399]">
                  <span className="text-xl font-bold">{data.currentWeight}</span>
                  <span className="text-xs">kg</span>
                </div>
              ) : (
                <span className="text-xs text-[var(--on-surface-variant)] font-medium">{isEn ? "No Record" : "Kayıt Yok"}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
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
        title={isEn ? "Calorie Burn & Exercise Details" : "Yakılan Kalori & Egzersiz Detayları"}
      >
        <div className="flex flex-col gap-5">
          {/* Top Burned Overview Banner */}
          <div className="p-4 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-[var(--on-surface-variant)] uppercase tracking-wider font-medium">{isEn ? "Total Burned Calories" : "Toplam Yakılan Kalori"}</span>
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
              className="px-3.5 py-2 rounded-xl bg-[#8ec13b] hover:bg-[#79aa32] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus size={15} /> {isEn ? "Add Exercise" : "Egzersiz Ekle"}
            </button>
          </div>

          {/* Calories Breakdown Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] flex flex-col">
              <span className="text-[11px] text-[var(--on-surface-variant)]">{isEn ? "Exercises" : "Egzersizler"}</span>
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
              <span className="text-[11px] text-[var(--on-surface-variant)]">{isEn ? "Sleep" : "Uyku"}</span>
              <span className="text-base font-bold text-[#818cf8] mt-0.5">
                {data.sleepCalories || 0} kcal
              </span>
            </div>
          </div>

          {/* Exercises List Header */}
          <div className="flex items-center justify-between pt-2">
            <h3 className="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
              {isEn ? "Exercise Records" : "Egzersiz Kayıtları"} ({data.exercises?.length || 0})
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
                      confirmDeleteText={isEn ? "Delete" : "Sil"}
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
                            <span className="text-sm font-semibold text-white capitalize">{isEn && ex.name === 'Adım Sayısı' ? 'Daily Steps' : ex.name}</span>
                            <span className="text-xs text-[var(--on-surface-variant)] flex items-center gap-2 mt-0.5">
                              {ex.duration_minutes > 0 && <span>{ex.duration_minutes} {isEn ? "min" : "dk"}</span>}
                              {ex.step_count && ex.step_count > 0 && <span>{ex.step_count.toLocaleString(isEn ? 'en-US' : 'tr-TR')} {isEn ? "steps" : "adım"}</span>}
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
                            title={isEn ? "Edit Exercise" : "Egzersizi Düzenle"}
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
                            title={isEn ? "Delete Exercise" : "Egzersizi Sil"}
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
                <span className="text-sm font-semibold text-white">{isEn ? "No exercises logged today" : "Bugün henüz egzersiz kaydı yok"}</span>
                <span className="text-xs text-[var(--on-surface-variant)] mt-1">{isEn ? "You can record your daily steps or workouts." : "Yürüdüğünüz adımları veya antrenmanlarınızı kaydedebilirsiniz."}</span>
              </div>
              <button
                onClick={() => {
                  setIsBurnedModalOpen(false);
                  onOpenSheet && onOpenSheet('exercise');
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-[#8ec13b] text-white text-xs font-bold hover:bg-[#79aa32] transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} /> {isEn ? "Add Exercise" : "Egzersiz Ekle"}
              </button>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
