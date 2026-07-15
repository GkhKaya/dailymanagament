import React, { useState } from 'react';
import { Moon } from 'lucide-react';
import { useAddSleepViewModel } from '@/viewmodels/useAddSleepViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function AddSleepForm({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const {
    hours, setHours,
    mins, setMins,
    quality, setQuality,
    isLoading, handleSubmit
  } = useAddSleepViewModel(onSuccess);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-fade-in">
      

      <div className="flex flex-col gap-4">
        {/* Süre */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Saat</label>
            <input 
              type="number"
              min="0"
              required
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="7" 
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Dakika</label>
            <input 
              type="number"
              min="0" max="59"
              value={mins}
              onChange={(e) => setMins(e.target.value)}
              placeholder="30" 
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
            />
          </div>
        </div>

        {/* Uyku Kalitesi */}
        <div className="flex flex-col gap-2 mt-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Uyku Kalitesi</label>
          <div className="grid grid-cols-3 gap-2">
            <button 
              type="button"
              onClick={() => setQuality('İyi')}
              className={`py-3 text-center rounded-2xl text-body font-medium transition-all ${quality === 'İyi' ? 'bg-[#4ade80] text-black shadow-sm' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
            >
              İyi
            </button>
            <button 
              type="button"
              onClick={() => setQuality('Orta')}
              className={`py-3 text-center rounded-2xl text-body font-medium transition-all ${quality === 'Orta' ? 'bg-orange-400 text-black shadow-sm' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
            >
              Orta
            </button>
            <button 
              type="button"
              onClick={() => setQuality('Kötü')}
              className={`py-3 text-center rounded-2xl text-body font-medium transition-all ${quality === 'Kötü' ? 'bg-red-400 text-black shadow-sm' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
            >
              Kötü
            </button>
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
          İptal
        </button>
        <button type="submit" disabled={isLoading} className="flex-[2] py-3 rounded-xl bg-blue-400 hover:bg-blue-500 text-black font-bold transition-colors flex items-center justify-center">
          {isLoading ? <LoadingSpinner size="sm" /> : "Uykuyu Kaydet"}
        </button>
      </div>
    </form>
  );
}
