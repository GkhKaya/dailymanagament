'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Dumbbell, Sparkles, PlayCircle } from 'lucide-react';
import { saveWorkoutDayAction, deleteWorkoutDayAction } from '@/actions/workout';
import { getExerciseVideoUrl } from '@/lib/workout-utils';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { useTranslation } from '@/hooks/useTranslation';

interface ExerciseRow {
  name: string;
  sets: number;
  reps: string;
  weight_kg: number;
}

export function ManageWorkoutRoutineForm({
  onClose,
  onSuccess,
  initialData
}: {
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: any;
}) {
  const { locale, isAbroad } = useTranslation();
  const isEn = isAbroad || locale === 'en';

  const [dayName, setDayName] = useState(initialData?.day_name || '');
  const [exercises, setExercises] = useState<ExerciseRow[]>(() => {
    if (initialData?.exercises && initialData.exercises.length > 0) {
      return initialData.exercises.map((e: any) => ({
        name: e.name || '',
        sets: Number(e.sets) || 3,
        reps: String(e.reps || '10'),
        weight_kg: Number(e.weight_kg) || 0
      }));
    }
    return [
      { name: '', sets: 4, reps: '10', weight_kg: 0 },
      { name: '', sets: 3, reps: '12', weight_kg: 0 }
    ];
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleAddRow = () => {
    setExercises(prev => [...prev, { name: '', sets: 3, reps: '10', weight_kg: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    if (exercises.length === 1) {
      toast.error(isEn ? 'You must enter at least 1 exercise.' : 'En az 1 hareket girmelisiniz.');
      return;
    }
    setExercises(prev => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof ExerciseRow, value: any) => {
    setExercises(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dayName.trim()) {
      toast.error(isEn ? 'Please enter a day name (e.g. Monday or Push Day).' : 'Lütfen gün adını girin (Örn: Pazartesi veya Push Day).');
      return;
    }

    const validExercises = exercises.filter(ex => ex.name.trim() !== '');
    if (validExercises.length === 0) {
      toast.error(isEn ? 'Please enter at least 1 exercise name.' : 'Lütfen en az 1 hareket ismi girin.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await saveWorkoutDayAction({
        day_id: initialData?.id,
        day_name: dayName,
        exercises: validExercises
      });

      if (res.success) {
        toast.success(initialData?.id 
          ? (isEn ? 'Workout day updated!' : 'Antrenman günü güncellendi!') 
          : (isEn ? 'New workout day added!' : 'Yeni antrenman günü eklendi!'));
        onSuccess && onSuccess();
        onClose();
      } else {
        toast.error(res.error || (isEn ? 'An error occurred while saving.' : 'Kaydedilirken hata oluştu.'));
      }
    } catch (e: any) {
      toast.error(e.message || (isEn ? 'An error occurred.' : 'Bir hata oluştu.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDay = async () => {
    if (!initialData?.id) return;
    const confirmMsg = isEn 
      ? `Are you sure you want to delete "${dayName}" and its exercises?` 
      : `"${dayName}" gününü ve hareketlerini silmek istediğinize emin misiniz?`;
    if (!window.confirm(confirmMsg)) return;

    setIsLoading(true);
    try {
      const res = await deleteWorkoutDayAction(initialData.id);
      if (res.success) {
        toast.success(isEn ? 'Workout day deleted.' : 'Antrenman günü silindi.');
        onSuccess && onSuccess();
        onClose();
      } else {
        toast.error(res.error || (isEn ? 'An error occurred while deleting.' : 'Silinirken hata oluştu.'));
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Gün Adı */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
          {isEn ? 'DAY NAME OR SPLIT' : 'GÜN ADI VEYA PROGRAM BÖLGESİ'}
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder={isEn ? 'e.g. Monday (Chest & Triceps) or Push Day' : 'Örn: Pazartesi (Göğüs & Triceps) veya Push Day'}
            value={dayName}
            onChange={(e) => setDayName(e.target.value)}
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-3.5 px-4 text-[14px] text-white font-semibold focus:outline-none focus:border-[var(--primary)] transition-all"
            required
          />
        </div>
      </div>

      {/* Hareketler Listesi */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
            <Dumbbell size={14} className="text-[var(--primary)]" /> {isEn ? 'Exercises and Sets' : 'Hareketler ve Set Sayıları'}
          </label>
          <span className="text-[11px] text-[var(--on-surface-variant)] font-medium">
            {isEn ? `${exercises.length} Exercise${exercises.length === 1 ? '' : 's'}` : `${exercises.length} Hareket`}
          </span>
        </div>

        <div className="flex flex-col gap-3.5 max-h-[340px] overflow-y-auto pr-1">
          {exercises.map((row, idx) => (
            <div
              key={idx}
              className="p-3 bg-[#161622] rounded-2xl border border-[rgba(255,255,255,0.06)] flex flex-col gap-2.5 relative group hover:border-[rgba(255,255,255,0.14)] transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-lg shrink-0">
                  #{idx + 1}
                </span>
                <input
                  type="text"
                  placeholder={isEn ? 'Exercise name (e.g. Bench Press)' : 'Hareket adı (Örn: Bench Press)'}
                  value={row.name}
                  onChange={(e) => handleRowChange(idx, 'name', e.target.value)}
                  className="flex-1 bg-transparent text-[13px] font-semibold text-white focus:outline-none border-b border-transparent focus:border-[var(--primary)] transition-colors py-0.5"
                  required
                />
                {row.name.trim() && (
                  <a
                    href={getExerciseVideoUrl(row.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-[var(--primary)] hover:text-white hover:bg-[var(--primary)]/20 rounded-lg transition-colors shrink-0"
                    title={isEn ? `Watch video for "${row.name}"` : `"${row.name}" hareketinin videosunu izle`}
                  >
                    <PlayCircle size={15} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveRow(idx)}
                  className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/15 rounded-lg transition-colors shrink-0"
                  title={isEn ? 'Delete Exercise' : 'Hareketi Sil'}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Set, Tekrar, Ağırlık Grid */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[rgba(255,255,255,0.04)]">
                {/* Set Sayısı */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-[var(--on-surface-variant)] uppercase font-semibold">{isEn ? 'Sets' : 'Set'}</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={row.sets}
                    onChange={(e) => handleRowChange(idx, 'sets', Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl py-1.5 px-2.5 text-[12px] font-bold text-white text-center focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                {/* Tekrar */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-[var(--on-surface-variant)] uppercase font-semibold">{isEn ? 'Reps' : 'Tekrar'}</span>
                  <input
                    type="text"
                    placeholder={isEn ? 'e.g. 8-12' : 'Örn: 8-12'}
                    value={row.reps}
                    onChange={(e) => handleRowChange(idx, 'reps', e.target.value)}
                    className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl py-1.5 px-2.5 text-[12px] font-bold text-white text-center focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                {/* Ağırlık (kg) */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-[var(--on-surface-variant)] uppercase font-semibold">{isEn ? 'Weight (kg)' : 'Ağırlık (kg)'}</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder={isEn ? 'Optional' : 'Opsiyonel'}
                    value={row.weight_kg || ''}
                    onChange={(e) => handleRowChange(idx, 'weight_kg', parseFloat(e.target.value) || 0)}
                    className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl py-1.5 px-2.5 text-[12px] font-bold text-white text-center focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddRow}
          className="py-2.5 rounded-2xl bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.07)] border border-dashed border-[rgba(255,255,255,0.15)] text-[12px] font-semibold text-emerald-400 hover:text-emerald-300 transition-all flex items-center justify-center gap-1.5 mt-1"
        >
          <Plus size={16} /> {isEn ? '+ Add Exercise' : '+ Hareket Ekle'}
        </button>
      </div>

      {/* Aksiyon Butonları */}
      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3.5 rounded-2xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.09)] text-white text-[13px] font-semibold transition-colors"
        >
          {isEn ? 'Cancel' : 'İptal'}
        </button>
        {initialData?.id && (
          <button
            type="button"
            onClick={handleDeleteDay}
            disabled={isLoading}
            className="py-3.5 px-4 rounded-2xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[13px] font-semibold transition-colors"
          >
            {isEn ? 'Delete' : 'Sil'}
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="flex-[2] py-3.5 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black text-[13px] font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : initialData?.id ? (isEn ? 'Save Changes' : 'Değişiklikleri Kaydet') : (isEn ? 'Save Routine' : 'Programı Kaydet')}
        </button>
      </div>
    </form>
  );
}
