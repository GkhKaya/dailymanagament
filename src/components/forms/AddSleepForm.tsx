import React, { useState } from 'react';
import { Moon } from 'lucide-react';

export function AddSleepForm({ onClose }: { onClose: () => void }) {
  const [quality, setQuality] = useState<'good' | 'average' | 'poor'>('good');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {/* Süre */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Saat</label>
            <input 
              type="number" 
              placeholder="7" 
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Dakika</label>
            <input 
              type="number" 
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
              onClick={() => setQuality('good')}
              className={`py-3 text-center rounded-2xl text-body font-medium transition-all ${quality === 'good' ? 'bg-[#4ade80] text-black shadow-sm' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
            >
              İyi
            </button>
            <button 
              onClick={() => setQuality('average')}
              className={`py-3 text-center rounded-2xl text-body font-medium transition-all ${quality === 'average' ? 'bg-orange-400 text-black shadow-sm' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
            >
              Orta
            </button>
            <button 
              onClick={() => setQuality('poor')}
              className={`py-3 text-center rounded-2xl text-body font-medium transition-all ${quality === 'poor' ? 'bg-red-400 text-black shadow-sm' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
            >
              Kötü
            </button>
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-3">
        <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
          İptal
        </button>
        <button onClick={onClose} className="flex-[2] py-4 rounded-2xl bg-blue-400 hover:bg-blue-500 text-black font-bold transition-colors">
          Uykuyu Kaydet
        </button>
      </div>
    </div>
  );
}
