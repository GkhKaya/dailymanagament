'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { 
  CheckCircle2, Circle, Plus, Trash2, Flame, Sparkles, 
  ChevronDown, ChevronUp, Loader2, Check, X, Pill, Droplet, Dumbbell, BookOpen, Sun, Moon
} from 'lucide-react';
import { 
  getDailyHabitsAction, 
  toggleDailyHabitAction, 
  createDailyHabitAction, 
  deleteDailyHabitAction,
  HabitItemDTO 
} from '@/actions/habits';
import toast from 'react-hot-toast';

interface DailyHabitsTrackerProps {
  currentDate?: Date;
  isEn?: boolean;
}

// Quick suggestions to help users start immediately with 1 click
const SUGGESTIONS = [
  { titleTr: "💊 Vitamin / Takviye", titleEn: "💊 Vitamins / Supplements", icon: "pill", color: "amber" },
  { titleTr: "💧 2.5L Su İçmek", titleEn: "💧 Drink 2.5L Water", icon: "droplet", color: "cyan" },
  { titleTr: "🏃‍♂️ Günlük Egzersiz / Yürüyüş", titleEn: "🏃‍♂️ Daily Exercise / Walk", icon: "dumbbell", color: "emerald" },
  { titleTr: "📖 Kitap Okumak", titleEn: "📖 Read Book", icon: "book", color: "purple" },
  { titleTr: "🧴 Cilt Bakımı", titleEn: "🧴 Skincare Routine", icon: "sparkles", color: "rose" },
  { titleTr: "🧘‍♀️ Meditasyon / Esneme", titleEn: "🧘‍♀️ Meditation / Stretch", icon: "sun", color: "orange" }
];

export function DailyHabitsTracker({ currentDate, isEn = false }: DailyHabitsTrackerProps) {
  const targetDateStr = React.useMemo(() => {
    const d = currentDate || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [currentDate]);

  const todayStr = React.useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const isViewingToday = targetDateStr === todayStr;

  const [habits, setHabits] = useState<HabitItemDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Fetch habits whenever target date changes
  useEffect(() => {
    let isMounted = true;
    async function loadHabits() {
      setIsLoading(true);
      try {
        const res = await getDailyHabitsAction(targetDateStr);
        if (isMounted) {
          if (res.success && res.habits) {
            setHabits(res.habits);
          }
        }
      } catch (err) {
        console.error("Error loading daily habits:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadHabits();
    return () => { isMounted = false; };
  }, [targetDateStr]);

  // Toggle habit completed for current date (Optimistic UI update)
  const handleToggle = async (habit: HabitItemDTO) => {
    const oldStatus = habit.is_completed;
    const newStatus = !oldStatus;

    // Optimistic UI
    setHabits(prev => prev.map(h => {
      if (h.id === habit.id) {
        return {
          ...h,
          is_completed: newStatus,
          streak: newStatus ? h.streak + 1 : Math.max(0, h.streak - 1),
          total_completed: newStatus ? h.total_completed + 1 : Math.max(0, h.total_completed - 1)
        };
      }
      return h;
    }));

    try {
      const res = await toggleDailyHabitAction(habit.id, targetDateStr);
      if (!res.success) {
        // Revert on error
        setHabits(prev => prev.map(h => h.id === habit.id ? habit : h));
        toast.error(res.error || (isEn ? "Could not update task." : "Görev güncellenemedi."));
      }
    } catch {
      setHabits(prev => prev.map(h => h.id === habit.id ? habit : h));
      toast.error(isEn ? "Connection error." : "Bağlantı hatası.");
    }
  };

  // Add new custom or suggested habit
  const handleCreate = async (title: string, icon = "check", color = "emerald") => {
    if (!title.trim()) return;

    setIsSavingNew(true);
    try {
      const res = await createDailyHabitAction({
        title: title.trim(),
        icon,
        color
      });

      if (res.success && res.habit) {
        setHabits(prev => [...prev, res.habit!]);
        setNewTitle('');
        setIsAdding(false);
        toast.success(isEn ? "Daily task added!" : "Günlük görev eklendi!");
      } else {
        toast.error(res.error || (isEn ? "Could not add task." : "Görev eklenemedi."));
      }
    } catch {
      toast.error(isEn ? "Connection error." : "Bağlantı hatası.");
    } finally {
      setIsSavingNew(false);
    }
  };

  // Delete habit
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(isEn ? "Delete this daily habit?" : "Bu günlük görevi silmek istiyor musunuz?")) {
      return;
    }

    setHabits(prev => prev.filter(h => h.id !== id));
    try {
      await deleteDailyHabitAction(id);
      toast.success(isEn ? "Task deleted." : "Görev silindi.");
    } catch {
      toast.error(isEn ? "Could not delete task." : "Görev silinemedi.");
    }
  };

  const totalCount = habits.length;
  const completedCount = habits.filter(h => h.is_completed).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllCompleted = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="w-full bg-[var(--surface-container-low)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] rounded-2xl p-4 sm:p-5 shadow-xl transition-all relative overflow-hidden">
      {/* Subtle ambient gradient glow */}
      <div className={`absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
        isAllCompleted ? 'bg-emerald-500/15' : 'bg-[var(--primary)]/10'
      }`} />

      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
            isAllCompleted 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/20'
          }`}>
            {isAllCompleted ? <Sparkles size={18} className="animate-pulse" /> : <CheckCircle2 size={18} />}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                {isEn ? "Daily Tasks & Habits" : "Günlük Takip & Alışkanlıklar"}
              </span>

              {totalCount > 0 && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                  isAllCompleted
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-white/5 text-white/70 border-white/10'
                }`}>
                  {completedCount}/{totalCount} (%{progressPercent})
                </span>
              )}

              {!isViewingToday && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/20">
                  {targetDateStr}
                </span>
              )}
            </div>

            <span className="text-xs text-[var(--on-surface-variant)] mt-0.5">
              {isAllCompleted 
                ? (isEn ? "🎉 All habits completed for this day!" : "🎉 Harika! Bugünkü tüm görevler tamamlandı.")
                : (isEn ? "Check off your daily routines and vitamins" : "Vitamin, su ve günlük rutinlerinizi tek dokunuşla işaretleyin")}
            </span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-white/5 hover:border-white/15"
          >
            <Plus size={14} className={isAdding ? "rotate-45 transition-transform" : "transition-transform"} />
            <span className="hidden sm:inline">{isEn ? "Add Task" : "Görev Ekle"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? (isEn ? "Collapse" : "Daralt") : (isEn ? "Expand" : "Genişlet")}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && isExpanded && (
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-3 relative z-10">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isAllCompleted 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50' 
                : 'bg-gradient-to-r from-[var(--primary)] to-emerald-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="flex flex-col gap-3 mt-4 relative z-10">
          {/* Quick Add Form / Drawer */}
          {isAdding && (
            <div className="p-3.5 rounded-xl bg-[#141420] border border-[var(--primary)]/30 shadow-lg flex flex-col gap-3 animate-slide-up">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Plus size={14} className="text-[var(--primary)]" />
                  {isEn ? "Create New Daily Routine" : "Yeni Günlük Alışkanlık / Görev"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-white/40 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <form 
                onSubmit={(e) => { e.preventDefault(); handleCreate(newTitle); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  autoFocus
                  placeholder={isEn ? "e.g. Took daily vitamins, 2.5L water, 20m reading..." : "Örn: Günlük vitaminleri aldım, 2.5L su içtim, 20 dk kitap..."}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[var(--primary)] transition-colors placeholder:text-white/30"
                />
                <button
                  type="submit"
                  disabled={isSavingNew || !newTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md"
                >
                  {isSavingNew ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                  <span>{isEn ? "Add" : "Ekle"}</span>
                </button>
              </form>

              {/* Suggestions Chips (Vitamin, Water, etc.) */}
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                  {isEn ? "Quick Suggestions:" : "Hızlı Öneriler:"}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s, idx) => {
                    const label = isEn ? s.titleEn : s.titleTr;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleCreate(label, s.icon, s.color)}
                        disabled={isSavingNew}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 text-white/80 hover:text-white text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[1, 2].map(i => (
                <div key={i} className="h-12 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : habits.length === 0 ? (
            /* Empty State with Suggestions */
            <div className="p-5 rounded-xl bg-white/[0.01] border border-dashed border-white/10 flex flex-col items-center text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                <Sparkles size={20} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs sm:text-sm font-bold text-white">
                  {isEn ? "No daily habits added yet" : "Henüz günlük takip görevi eklenmedi"}
                </span>
                <span className="text-[11px] text-[var(--on-surface-variant)] max-w-sm">
                  {isEn 
                    ? "Add tasks like taking vitamins, drinking water, or reading to track your daily progress here." 
                    : "Vitamin alımı, su tüketimi, kitap okuma gibi her gün yaptığınız rutinleri ekleyip kolayca takip edebilirsiniz."}
                </span>
              </div>

              {/* 1-Click Quick Add Suggestions */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                {SUGGESTIONS.slice(0, 4).map((s, idx) => {
                  const label = isEn ? s.titleEn : s.titleTr;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleCreate(label, s.icon, s.color)}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-[var(--primary)] hover:text-white border border-white/10 text-xs font-semibold text-white/90 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>+ {label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Habits Checklist Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {habits.map((habit) => {
                const isDone = habit.is_completed;

                return (
                  <div
                    key={habit.id}
                    onClick={() => handleToggle(habit)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none group/item ${
                      isDone
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100 shadow-sm'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-white/15 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Interactive Circular Checkbox */}
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                        isDone
                          ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30 scale-105'
                          : 'border border-white/20 group-hover/item:border-white/40 text-transparent'
                      }`}>
                        <Check size={14} strokeWidth={3} className={isDone ? 'opacity-100' : 'opacity-0'} />
                      </div>

                      {/* Title & Streak */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className={`text-xs sm:text-sm font-semibold transition-colors leading-snug break-words whitespace-normal ${
                          isDone ? 'text-white line-through opacity-80' : 'text-white'
                        }`}>
                          {habit.title}
                        </span>

                        {habit.streak > 0 && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                              <Flame size={11} className="animate-pulse" />
                              {habit.streak} {isEn ? "day streak" : "gün seri"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delete action button */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(habit.id, e)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover/item:opacity-100 shrink-0 ml-2"
                      title={isEn ? "Delete habit" : "Görevi sil"}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
