import React, { useState } from 'react';
import { Search } from 'lucide-react';

export function EditMealForm({ onClose }: { onClose: () => void }) {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');

  return (
    <div className="flex flex-col gap-6">
      {/* Öğün Seçimi */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: 'breakfast', label: 'Kahvaltı' },
          { id: 'lunch', label: 'Öğle' },
          { id: 'dinner', label: 'Akşam' },
          { id: 'snack', label: 'Atıştırmalık' }
        ].map(m => (
          <button 
            key={m.id}
            onClick={() => setMealType(m.id as any)}
            className={`py-3 text-center rounded-2xl text-body font-medium transition-all ${mealType === m.id ? 'bg-[var(--inverse-primary)] text-white shadow-sm' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {/* Yemek Adı */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Yemek Adı</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={20} />
            <input 
              type="text" 
              placeholder="Besin, marka veya yemek..." 
              defaultValue="Tavuk Salata"
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 pl-12 pr-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
            />
          </div>
        </div>

        {/* Miktar */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Miktar</label>
            <input 
              type="number" 
              defaultValue={1}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Birim</label>
            <select className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all appearance-none">
              <option value="portion">Porsiyon</option>
              <option value="gram">Gram</option>
              <option value="piece">Adet</option>
              <option value="ml">Mililitre</option>
            </select>
          </div>
        </div>

        {/* Özet (Mock) */}
        <div className="glass-item p-4 flex items-center justify-between mt-2">
          <div className="flex flex-col gap-1">
            <span className="text-body font-medium text-white">Tahmini Kalori</span>
            <span className="text-caption text-[var(--on-surface-variant)]">1 Porsiyon (350g)</span>
          </div>
          <span className="text-xl font-bold text-[var(--primary)]">350 kcal</span>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
          İptal
        </button>
        <button onClick={onClose} className="flex-[2] py-4 rounded-2xl bg-[var(--inverse-primary)] hover:bg-[var(--inverse-primary-hover)] text-white font-bold transition-colors">
          Güncelle
        </button>
      </div>
    </div>
  );
}
