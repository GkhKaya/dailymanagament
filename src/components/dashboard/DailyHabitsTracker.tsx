'use client';

import React, { useState, useEffect } from 'react';
import { 
  Check, Plus, Trash2, Flame, ListChecks, Loader2, X
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

// Quick suggestions (minimal, zero emojis)
const SUGGESTIONS = [
  { tr: "Vitamin / Takviye", en: "Vitamins / Supplements" },
  { tr: "2.5L Su", en: "2.5L Water" },
  { tr: "Günlük Yürüyüş", en: "Daily Walk" },
  { tr: "Kitap Okuma", en: "Reading" },
  { tr: "Cilt Bakımı", en: "Skincare" },
  { tr: "Esneme / Mobilite", en: "Stretching" }
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

  // Toggle habit completion (Optimistic UI update)
  const handleToggle = async (habit: HabitItemDTO) => {
    const oldStatus = habit.is_completed;
    const newStatus = !oldStatus;

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
        setHabits(prev => prev.map(h => h.id === habit.id ? habit : h));
        toast.error(res.error || (isEn ? "Could not update routine." : "Rutin güncellenemedi."));
      }
    } catch {
      setHabits(prev => prev.map(h => h.id === habit.id ? habit : h));
      toast.error(isEn ? "Connection error." : "Bağlantı hatası.");
    }
  };

  // Add new habit
  const handleCreate = async (title: string) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    setIsSavingNew(true);
    try {
      const res = await createDailyHabitAction({
        title: cleanTitle,
        icon: "check",
        color: "emerald"
      });

      if (res.success && res.habit) {
        setHabits(prev => [...prev, res.habit!]);
        setNewTitle('');
        setIsAdding(false);
      } else {
        toast.error(res.error || (isEn ? "Could not add routine." : "Rutin eklenemedi."));
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
    if (!window.confirm(isEn ? "Delete this daily routine?" : "Bu günlük rutini silmek istiyor musunuz?")) {
      return;
    }

    setHabits(prev => prev.filter(h => h.id !== id));
    try {
      await deleteDailyHabitAction(id);
    } catch {
      toast.error(isEn ? "Could not delete routine." : "Rutin silinemedi.");
    }
  };

  const totalCount = habits.length;
  const completedCount = habits.filter(h => h.is_completed).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllCompleted = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="glass-card p-4 sm:p-5 rounded-2xl flex flex-col gap-3.5 border border-[rgba(255,255,255,0.06)] transition-all">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#8ec13b] shrink-0">
            <ListChecks size={15} />
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider font-semibold">
              {isEn ? "DAILY ROUTINES" : "GÜNLÜK RUTİNLER"}
            </h3>
            {totalCount > 0 && (
              <span className={`text-[11px] font-semibold transition-colors ${
                isAllCompleted ? 'text-[#8ec13b]' : 'text-white/40'
              }`}>
                {completedCount}/{totalCount}
              </span>
            )}
            {!isViewingToday && (
              <span className="text-[10px] text-white/30 font-mono">
                ({targetDateStr})
              </span>
            )}
          </div>
        </div>

        {/* Add button */}
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white text-xs font-medium transition-all flex items-center gap-1 cursor-pointer border border-white/5 hover:border-white/10"
        >
          {isAdding ? <X size={13} /> : <Plus size={13} />}
          <span>{isAdding ? (isEn ? "Cancel" : "Kapat") : (isEn ? "Add" : "Ekle")}</span>
        </button>
      </div>

      {/* Subtle Progress Bar */}
      {totalCount > 0 && (
        <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              isAllCompleted ? 'bg-[#8ec13b]' : 'bg-[#8ec13b]/80'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Inline Add Drawer */}
      {isAdding && (
        <div className="p-3 rounded-xl bg-black/30 border border-white/10 flex flex-col gap-2.5 animate-fadeIn">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleCreate(newTitle); }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              autoFocus
              placeholder={isEn ? "e.g. Vitamin D3, 2.5L water, reading..." : "Örn: Vitamin D3, 2.5L su, kitap okuma..."}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#8ec13b]/60 transition-colors"
            />
            <button
              type="submit"
              disabled={isSavingNew || !newTitle.trim()}
              className="px-3 py-1.5 rounded-lg bg-[#8ec13b] hover:bg-[#79aa32] text-white text-xs font-semibold transition-all disabled:opacity-40 flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {isSavingNew ? <Loader2 size={12} className="animate-spin" /> : <Plus size={13} />}
              <span>{isEn ? "Add" : "Ekle"}</span>
            </button>
          </form>

          {/* Clean suggestion tags without emojis */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
              {isEn ? "Suggestions:" : "Öneriler:"}
            </span>
            {SUGGESTIONS.map((s, idx) => {
              const label = isEn ? s.en : s.tr;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleCreate(label)}
                  disabled={isSavingNew}
                  className="px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-white/15 text-white/70 hover:text-white text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  + {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[1, 2].map(i => (
            <div key={i} className="h-10 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        /* Empty State */
        <div className="py-4 px-3 rounded-xl bg-white/[0.01] border border-dashed border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span className="text-xs text-[var(--on-surface-variant)]">
            {isEn ? "No daily routines added yet." : "Henüz bir günlük rutin eklenmedi."}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {SUGGESTIONS.slice(0, 3).map((s, idx) => {
              const label = isEn ? s.en : s.tr;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleCreate(label)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-white/70 hover:text-white text-[11px] font-medium transition-all border border-white/5 cursor-pointer"
                >
                  + {label}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Checklist items grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {habits.map((habit) => {
            const isDone = habit.is_completed;

            return (
              <div
                key={habit.id}
                onClick={() => handleToggle(habit)}
                className={`group/item flex items-center justify-between py-2 px-3 rounded-xl border transition-all cursor-pointer select-none ${
                  isDone
                    ? 'bg-emerald-500/[0.05] border-emerald-500/20 text-emerald-100'
                    : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-white/10 text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Minimal Checkbox */}
                  <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-all ${
                    isDone
                      ? 'bg-[#8ec13b] text-black shadow-sm'
                      : 'border border-white/20 group-hover/item:border-white/40 text-transparent'
                  }`}>
                    <Check size={11} strokeWidth={3} className={isDone ? 'opacity-100' : 'opacity-0'} />
                  </div>

                  {/* Title */}
                  <span className={`text-xs font-medium leading-snug break-words whitespace-normal transition-colors ${
                    isDone ? 'text-white/40 line-through' : 'text-white/90'
                  }`}>
                    {habit.title}
                  </span>

                  {/* Streak */}
                  {habit.streak > 1 && (
                    <span className="text-[10px] text-amber-400/90 font-semibold shrink-0 flex items-center gap-0.5 ml-auto sm:ml-0">
                      <Flame size={10} />
                      {habit.streak} {isEn ? "d" : "g"}
                    </span>
                  )}
                </div>

                {/* Subtle Delete */}
                <button
                  type="button"
                  onClick={(e) => handleDelete(habit.id, e)}
                  className="p-1 rounded text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover/item:opacity-100 shrink-0 ml-1.5 cursor-pointer"
                  title={isEn ? "Delete" : "Sil"}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
