import React from 'react';
import { Search } from 'lucide-react';
import { useEditMealViewModel } from '@/viewmodels/useEditMealViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function EditMealForm({ onClose, onSuccess, initialData }: { onClose: () => void, onSuccess?: () => void, initialData?: any }) {
  const {
    mealType, setMealType,
    foodName, setFoodName,
    quantity, setQuantity,
    unit, setUnit,
    calories, setCalories,
    getServingDesc,
    isLoading, error,
    handleUpdate, handleDelete
  } = useEditMealViewModel(initialData, onSuccess);

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
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
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
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Birim</label>
            <select 
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all appearance-none"
            >
              <option value="portion">Porsiyon</option>
              <option value="gram">Gram</option>
              <option value="piece">Adet</option>
              <option value="ml">Mililitre</option>
            </select>
          </div>
        </div>

        {/* Kalori */}
        <div className="flex flex-col gap-2 mt-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Kalori (Kcal)</label>
          <input 
            type="number" 
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body font-bold text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/20 text-red-200 text-sm border border-red-500/30">
          {error}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        <button onClick={handleUpdate} disabled={isLoading} className="w-full flex items-center justify-center py-3 rounded-xl bg-[var(--inverse-primary)] hover:bg-[var(--inverse-primary-hover)] text-white font-bold transition-colors">
          {isLoading ? <LoadingSpinner size="sm" /> : "Değişiklikleri Kaydet"}
        </button>
        <button onClick={handleDelete} disabled={isLoading} className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-medium transition-colors">
          Yemeği Sil
        </button>
      </div>
    </div>
  );
}
