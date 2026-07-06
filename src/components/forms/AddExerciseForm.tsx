import React from 'react';
import { Activity } from 'lucide-react';

export function AddExerciseForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {/* Egzersiz Tipi */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Egzersiz Tipi</label>
          <select className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all appearance-none">
            <option value="running">Koşu</option>
            <option value="walking">Yürüyüş</option>
            <option value="weight">Ağırlık Antrenmanı</option>
            <option value="cycling">Bisiklet</option>
            <option value="swimming">Yüzme</option>
            <option value="yoga">Yoga</option>
          </select>
        </div>

        {/* Süre */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Süre (Dakika)</label>
          <input 
            type="number" 
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
              placeholder="350" 
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 pl-12 pr-4 text-xl font-semibold text-orange-400 focus:outline-none focus:border-[var(--primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
            />
          </div>
          <span className="text-caption text-[var(--on-surface-variant)] mt-1 ml-2">Tahmini değer hesaplanmıştır, isterseniz değiştirebilirsiniz.</span>
        </div>
      </div>

      <div className="mt-2 flex gap-3">
        <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
          İptal
        </button>
        <button onClick={onClose} className="flex-[2] py-4 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-bold transition-colors">
          Egzersizi Kaydet
        </button>
      </div>
    </div>
  );
}
