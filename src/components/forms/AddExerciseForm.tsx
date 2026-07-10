import React from 'react';
import { Activity } from 'lucide-react';
import { useAddExerciseViewModel } from '@/viewmodels/useAddExerciseViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function AddExerciseForm({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const {
    exerciseType, setExerciseType,
    durationMinutes, setDurationMinutes,
    burnedCalories, setBurnedCalories,
    isLoading, error, handleSubmit
  } = useAddExerciseViewModel(onSuccess);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-fade-in">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/20 text-red-200 text-sm border border-red-500/30">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Egzersiz Tipi */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Egzersiz Tipi</label>
          <select 
            value={exerciseType}
            onChange={(e) => setExerciseType(e.target.value)}
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all appearance-none"
          >
            <option value="Koşu">Koşu</option>
            <option value="Yürüyüş">Yürüyüş</option>
            <option value="Ağırlık Antrenmanı">Ağırlık Antrenmanı</option>
            <option value="Bisiklet">Bisiklet</option>
            <option value="Yüzme">Yüzme</option>
            <option value="Yoga">Yoga</option>
          </select>
        </div>

        {/* Süre */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Süre (Dakika)</label>
          <input 
            type="number" 
            required
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            placeholder="45" 
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
          />
        </div>

        {/* Yakılan Kalori */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Yakılan Kalori (Kcal)</label>
          <div className="relative">
            <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={20} />
            <input 
              type="number" 
              required
              value={burnedCalories}
              onChange={(e) => setBurnedCalories(e.target.value)}
              placeholder="350" 
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 pl-12 pr-4 text-xl font-semibold text-orange-400 focus:outline-none focus:border-[var(--primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
            />
          </div>
          <span className="text-caption text-[var(--on-surface-variant)] mt-1 ml-2">Tahmini değer hesaplanmıştır, isterseniz değiştirebilirsiniz.</span>
        </div>
      </div>

      <div className="mt-2 flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
          İptal
        </button>
        <button type="submit" disabled={isLoading} className="flex-[2] py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold transition-colors flex items-center justify-center">
          {isLoading ? <LoadingSpinner size="sm" /> : "Egzersizi Kaydet"}
        </button>
      </div>
    </form>
  );
}
