'use client';

import React from 'react';
import { ChevronDown, ChevronUp, Edit2, PlayCircle } from 'lucide-react';
import { getExerciseVideoUrl } from '@/lib/workout-utils';
import { IWorkoutDay } from '@/models/WorkoutRoutine';

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
  isEn
}: WorkoutDayCardProps) {
  const totalSets = (day.exercises || []).reduce(
    (acc: number, ex: any) => acc + (Number(ex.sets) || 0),
    0
  );

  return (
    <div className="flex flex-col bg-[var(--surface-container)] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden hover:border-[rgba(255,255,255,0.14)] transition-all">
      {/* Day Header */}
      <div
        className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-[rgba(255,255,255,0.03)] transition-colors gap-3 select-none"
        onClick={onToggleExpand}
      >
        <div className="flex flex-col min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-bold text-white leading-snug break-words">
              {day.day_name}
            </span>
            {isExpanded ? (
              <ChevronUp size={16} className="text-[var(--on-surface-variant)] shrink-0" />
            ) : (
              <ChevronDown size={16} className="text-[var(--on-surface-variant)] shrink-0" />
            )}
          </div>
          <span className="text-xs text-[var(--on-surface-variant)] mt-1">
            {day.exercises?.length || 0} {isEn ? "Exercises" : "Hareket"} —{" "}
            <strong className="text-emerald-400">
              {totalSets} {isEn ? "Total Sets" : "Toplam Set"}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditDay();
            }}
            className="p-2 text-[var(--on-surface-variant)] hover:text-white hover:bg-[rgba(255,255,255,0.08)] rounded-xl transition-colors cursor-pointer"
            title={isEn ? "Edit Day" : "Günü Düzenle"}
          >
            <Edit2 size={16} />
          </button>
        </div>
      </div>

      {/* Expanded Exercises: Clean List without set table & mobile-friendly non-truncated text */}
      {isExpanded && day.exercises && day.exercises.length > 0 && (
        <div className="flex flex-col border-t border-[rgba(255,255,255,0.06)] bg-[#12121D] p-3 gap-2">
          <div className="flex items-center gap-1.5 px-1 pb-1 text-[11px] text-[var(--on-surface-variant)] font-medium">
            <PlayCircle size={13} className="text-[var(--primary)] shrink-0" />
            <span>
              {isEn
                ? "Tap any exercise to watch video tutorial"
                : "Yapılış videosunu izlemek için harekete dokunun"}
            </span>
          </div>

          {day.exercises.map((ex: any, idx: number) => (
            <a
              key={ex.id || idx}
              href={getExerciseVideoUrl(ex.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 p-3 bg-[#181826] hover:bg-[#202032] rounded-xl border border-[rgba(255,255,255,0.04)] hover:border-[var(--primary)]/40 transition-all group/ex cursor-pointer"
              title={isEn ? `Watch video for "${ex.name}"` : `"${ex.name}" videosunu izle`}
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                <span className="w-6 h-6 rounded-lg bg-[var(--primary)]/15 text-[var(--primary)] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  {idx + 1}
                </span>

                <div className="flex flex-col min-w-0 flex-1">
                  {/* Exercise name wraps gracefully without getting truncated with '...' on mobile */}
                  <span className="text-xs sm:text-sm font-semibold text-white group-hover/ex:text-[var(--primary)] transition-colors leading-snug break-words whitespace-normal">
                    {ex.name || (isEn ? "Exercise" : "Hareket")}
                  </span>

                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      {ex.sets} {isEn ? "Sets" : "Set"}
                      {ex.reps ? ` · ${ex.reps} ${isEn ? "Reps" : "Tekrar"}` : ""}
                    </span>

                    {ex.weight_kg ? (
                      <span className="text-[11px] text-[var(--on-surface-variant)] font-medium bg-white/[0.04] px-1.5 py-0.5 rounded-md">
                        {ex.weight_kg} kg
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] group-hover/ex:bg-[var(--primary)] group-hover/ex:text-black transition-all flex items-center justify-center shrink-0 ml-1">
                <PlayCircle size={16} />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
