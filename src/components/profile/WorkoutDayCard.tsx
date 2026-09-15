'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, ChevronUp, Edit2, PlayCircle, Plus, Minus, 
  Check, RotateCcw, Dumbbell
} from 'lucide-react';
import { getExerciseVideoUrl } from '@/lib/workout-utils';
import { 
  toggleSetCompletedAction, 
  updateExerciseSetsAction, 
  resetWorkoutDaySetsAction
} from '@/actions/workout';
import { IWorkoutDay, IWorkoutExercise, IExerciseSet } from '@/models/WorkoutRoutine';
import toast from 'react-hot-toast';

interface WorkoutDayCardProps {
  day: IWorkoutDay;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEditDay: () => void;
  onRefresh: () => void;
  isEn: boolean;
}

export function WorkoutDayCard({
  day,
  isExpanded,
  onToggleExpand,
  onEditDay,
  onRefresh,
  isEn
}: WorkoutDayCardProps) {
  // Local state for exercises to allow instant, optimistic updates
  const [exercises, setExercises] = useState<IWorkoutExercise[]>(day.exercises || []);
  const [isResetting, setIsResetting] = useState(false);

  // Sync when day changes from parent
  useEffect(() => {
    setExercises(day.exercises || []);
  }, [day]);

  // Compute total and completed sets
  const { totalSets, completedSets } = React.useMemo(() => {
    let total = 0;
    let completed = 0;
    for (const ex of exercises) {
      const sets = ex.sets_detail || [];
      total += sets.length;
      for (const s of sets) {
        if (s.completed) completed += 1;
      }
    }
    return { totalSets: total, completedSets: completed };
  }, [exercises]);

  const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  // Toggle single set completion
  const handleToggleSet = async (exIdx: number, sIdx: number) => {
    const originalExercises = exercises;
    // Optimistic UI update
    setExercises(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (copy[exIdx]?.sets_detail?.[sIdx]) {
        copy[exIdx].sets_detail[sIdx].completed = !copy[exIdx].sets_detail[sIdx].completed;
      }
      return copy;
    });

    try {
      const res = await toggleSetCompletedAction(day.id || (day as any)._id, exIdx, sIdx);
      if (!res.success) {
        setExercises(originalExercises);
        toast.error(res.error || (isEn ? 'Could not update set.' : 'Set güncellenemedi.'));
      }
    } catch {
      setExercises(originalExercises);
      toast.error(isEn ? 'Connection error.' : 'Bağlantı hatası.');
    }
  };

  // Update set weight or reps
  const handleSetChange = (exIdx: number, sIdx: number, field: 'weight_kg' | 'reps', val: any) => {
    setExercises(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (copy[exIdx]?.sets_detail?.[sIdx]) {
        copy[exIdx].sets_detail[sIdx][field] = field === 'weight_kg' ? (parseFloat(val) || 0) : String(val);
      }
      return copy;
    });
  };

  // Persist exercise sets on blur
  const handleSetBlur = async (exIdx: number) => {
    const ex = exercises[exIdx];
    if (!ex || !ex.sets_detail) return;

    try {
      await updateExerciseSetsAction(day.id || (day as any)._id, exIdx, ex.sets_detail);
    } catch (e) {
      console.error('Error saving set changes:', e);
    }
  };

  // Add set to an exercise
  const handleAddSet = async (exIdx: number) => {
    const ex = exercises[exIdx];
    if (!ex) return;

    const sets = ex.sets_detail || [];
    const lastSet = sets[sets.length - 1] || { weight_kg: ex.weight_kg || 0, reps: ex.reps || '10' };
    const newSet: IExerciseSet = {
      set_number: sets.length + 1,
      weight_kg: Number(lastSet.weight_kg) || 0,
      reps: String(lastSet.reps || '10'),
      completed: false
    };

    const newSetsDetail = [...sets, newSet];
    setExercises(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[exIdx].sets_detail = newSetsDetail;
      copy[exIdx].sets = newSetsDetail.length;
      return copy;
    });

    try {
      await updateExerciseSetsAction(day.id || (day as any)._id, exIdx, newSetsDetail);
      toast.success(isEn ? 'Set added' : 'Set eklendi');
    } catch {
      toast.error(isEn ? 'Could not add set.' : 'Set eklenemedi.');
      onRefresh();
    }
  };

  // Remove last set from an exercise
  const handleRemoveSet = async (exIdx: number) => {
    const ex = exercises[exIdx];
    if (!ex || !ex.sets_detail || ex.sets_detail.length <= 1) {
      toast.error(isEn ? 'At least 1 set is required.' : 'En az 1 set olmalıdır.');
      return;
    }

    const newSetsDetail = ex.sets_detail.slice(0, -1);
    setExercises(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[exIdx].sets_detail = newSetsDetail;
      copy[exIdx].sets = newSetsDetail.length;
      return copy;
    });

    try {
      await updateExerciseSetsAction(day.id || (day as any)._id, exIdx, newSetsDetail);
      toast.success(isEn ? 'Set removed' : 'Set silindi');
    } catch {
      toast.error(isEn ? 'Could not remove set.' : 'Set silinemedi.');
      onRefresh();
    }
  };

  // Reset all sets
  const handleResetSets = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(isEn ? 'Reset all completed sets for this workout day?' : 'Bu antrenman günündeki tamamlanan setleri sıfırlamak istiyor musunuz?')) {
      return;
    }

    setIsResetting(true);
    setExercises(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      for (const ex of copy) {
        if (ex.sets_detail) {
          for (const s of ex.sets_detail) {
            s.completed = false;
          }
        }
      }
      return copy;
    });

    try {
      const res = await resetWorkoutDaySetsAction(day.id || (day as any)._id);
      if (res.success) {
        toast.success(isEn ? 'Sets reset! Ready for your next session.' : 'Setler sıfırlandı! Yeni antrenmana hazırsınız.');
      } else {
        toast.error(res.error || (isEn ? 'Error resetting sets.' : 'Sıfırlanırken hata oluştu.'));
        onRefresh();
      }
    } catch {
      toast.error(isEn ? 'Connection error.' : 'Bağlantı hatası.');
      onRefresh();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col bg-[var(--surface-container)] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden hover:border-[rgba(255,255,255,0.14)] transition-all">
      {/* Day Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-[rgba(255,255,255,0.03)] transition-colors gap-3 select-none"
        onClick={onToggleExpand}
      >
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white truncate">{day.day_name}</span>
            {isExpanded ? (
              <ChevronUp size={18} className="text-[var(--on-surface-variant)] shrink-0" />
            ) : (
              <ChevronDown size={18} className="text-[var(--on-surface-variant)] shrink-0" />
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs text-[var(--on-surface-variant)]">
              {exercises.length} {isEn ? "Exercises" : "Hareket"}
            </span>
            <span className="text-white/20">•</span>
            <span className="text-xs font-semibold text-emerald-400">
              {completedSets}/{totalSets} {isEn ? "Sets Completed" : "Set Tamamlandı"}
            </span>
            {totalSets > 0 && completedSets > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold">
                %{progressPercent}
              </span>
            )}
          </div>

          {/* Mini Progress Bar */}
          {totalSets > 0 && (
            <div className="w-full max-w-[200px] h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Day Actions */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {completedSets > 0 && (
            <button
              type="button"
              onClick={handleResetSets}
              disabled={isResetting}
              className="p-2 text-[var(--on-surface-variant)] hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition-all"
              title={isEn ? "Reset all completed sets" : "Tüm setleri sıfırla / Yeni antrenman"}
            >
              <RotateCcw size={15} className={isResetting ? 'animate-spin' : ''} />
            </button>
          )}

          <button
            type="button"
            onClick={onEditDay}
            className="p-2 text-[var(--on-surface-variant)] hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title={isEn ? "Edit Day Routine" : "Program Gününü Düzenle"}
          >
            <Edit2 size={15} />
          </button>
        </div>
      </div>

      {/* Expanded Content: Exercises & Set Tracker */}
      {isExpanded && (
        <div className="flex flex-col border-t border-[rgba(255,255,255,0.06)] bg-[#10101a] p-3.5 sm:p-4 gap-4">
          {/* EXERCISES & SET TRACKER */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--on-surface-variant)] flex items-center gap-1.5">
                <Dumbbell size={14} className="text-[var(--primary)]" />
                {isEn ? "Exercises & Set Tracking" : "Hareketler & Kilo/Set Takibi"}
              </span>
              <span className="text-[11px] text-[var(--on-surface-variant)]">
                {isEn ? "Tap checkbox when completed" : "Tamamlandığında tiki işaretleyin"}
              </span>
            </div>

            {exercises.map((ex, exIdx) => {
              const setsDetail = ex.sets_detail || [];
              const exerciseSetsCompleted = setsDetail.filter(s => s.completed).length;

              return (
                <div
                  key={ex.id || exIdx}
                  className="flex flex-col bg-[#161624] rounded-2xl border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.12)] transition-all overflow-hidden"
                >
                  {/* Exercise Header Row */}
                  <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 border-b border-white/[0.04]">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-[var(--primary)]/15 text-[var(--primary)] text-xs font-bold flex items-center justify-center shrink-0">
                        {exIdx + 1}
                      </span>
                      <span className="text-sm font-bold text-white truncate">
                        {ex.name || (isEn ? "Exercise" : "Hareket")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-white/5 text-white/70">
                        {exerciseSetsCompleted}/{setsDetail.length} {isEn ? "Sets" : "Set"}
                      </span>
                      {ex.name && (
                        <a
                          href={getExerciseVideoUrl(ex.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-[var(--primary)] hover:text-black text-[var(--primary)] text-xs font-semibold flex items-center gap-1 transition-all"
                          title={isEn ? `Watch video for "${ex.name}"` : `"${ex.name}" videosunu izle`}
                        >
                          <PlayCircle size={14} />
                          <span className="hidden sm:inline">{isEn ? "Video" : "Video"}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Sets Table */}
                  <div className="p-3 flex flex-col gap-2">
                    {/* Header labels */}
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider px-2">
                      <div className="col-span-2">{isEn ? "SET" : "SET"}</div>
                      <div className="col-span-4">{isEn ? "WEIGHT (KG)" : "AĞIRLIK (KG)"}</div>
                      <div className="col-span-4">{isEn ? "REPS" : "TEKRAR"}</div>
                      <div className="col-span-2 text-center">{isEn ? "DONE" : "BİTTİ"}</div>
                    </div>

                    {/* Sets Rows */}
                    {setsDetail.map((s, sIdx) => {
                      const isCompleted = Boolean(s.completed);

                      return (
                        <div
                          key={sIdx}
                          className={`grid grid-cols-12 gap-2 items-center p-1.5 sm:p-2 rounded-xl transition-all ${
                            isCompleted 
                              ? 'bg-emerald-500/10 border border-emerald-500/25' 
                              : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]'
                          }`}
                        >
                          {/* Set Number */}
                          <div className="col-span-2 flex items-center">
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                              isCompleted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-white/70'
                            }`}>
                              #{s.set_number || sIdx + 1}
                            </span>
                          </div>

                          {/* Weight Input */}
                          <div className="col-span-4 flex items-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={s.weight_kg ?? 0}
                              onChange={(e) => handleSetChange(exIdx, sIdx, 'weight_kg', e.target.value)}
                              onBlur={() => handleSetBlur(exIdx)}
                              placeholder="0"
                              className={`w-full py-1 px-2 rounded-lg text-xs sm:text-sm font-bold text-center border focus:outline-none transition-all ${
                                isCompleted 
                                  ? 'bg-black/30 border-emerald-500/30 text-emerald-200' 
                                  : 'bg-black/30 border-white/10 text-white focus:border-[var(--primary)]'
                              }`}
                            />
                          </div>

                          {/* Reps Input */}
                          <div className="col-span-4 flex items-center">
                            <input
                              type="text"
                              value={s.reps ?? '10'}
                              onChange={(e) => handleSetChange(exIdx, sIdx, 'reps', e.target.value)}
                              onBlur={() => handleSetBlur(exIdx)}
                              placeholder="10"
                              className={`w-full py-1 px-2 rounded-lg text-xs sm:text-sm font-bold text-center border focus:outline-none transition-all ${
                                isCompleted 
                                  ? 'bg-black/30 border-emerald-500/30 text-emerald-200' 
                                  : 'bg-black/30 border-white/10 text-white focus:border-[var(--primary)]'
                              }`}
                            />
                          </div>

                          {/* Completed Checkbox */}
                          <div className="col-span-2 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSet(exIdx, sIdx)}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                isCompleted 
                                  ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/30 scale-105' 
                                  : 'bg-white/5 hover:bg-white/15 text-white/40 border border-white/10 hover:border-white/30'
                              }`}
                              title={isCompleted ? (isEn ? "Mark incomplete" : "Tamamlanmadı yap") : (isEn ? "Mark set completed" : "Seti tamamlandı işaretle")}
                            >
                              <Check size={16} strokeWidth={isCompleted ? 3 : 2} className={isCompleted ? 'text-black' : 'text-white/40'} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add / Remove Set Row */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {setsDetail.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSet(exIdx)}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-red-500/15 text-white/50 hover:text-red-300 text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          <Minus size={13} /> {isEn ? "Remove Set" : "Set Sil"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleAddSet(exIdx)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-emerald-500/15 text-emerald-400 hover:text-emerald-300 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Plus size={13} /> {isEn ? "Add Set" : "Set Ekle"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
