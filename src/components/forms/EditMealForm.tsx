import { t } from '@/lib/i18n';
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
    protein, setProtein,
    carbs, setCarbs,
    fat, setFat,
    sugar, setSugar,
    getServingDesc,
    isLoading,
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
            className={`py-3 text-center rounded-2xl text-body font-medium transition-all ${mealType === m.id ? 'bg-[var(--primary)] text-black shadow-sm' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {/* Yemek Adı */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">{t('forms.mealName')}</label>
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
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">{t('forms.quantity')}</label>
            <input 
              type="number" 
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">{t('forms.unit')}</label>
            <select 
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all appearance-none"
            >
              <option value="portion">Porsiyon</option>
              <option value="gram">Gram</option>
              <option value="piece">Adet</option>
              <option value="ml">Mililitre</option>
              <option value="bardak">Bardak</option>
              <option value="tabak">Tabak</option>
            </select>
          </div>
        </div>

        {/* Kalori & Makrolar */}
        <div className="flex flex-col gap-3 mt-1">
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">{t('forms.calories')}</label>
            <div className="relative">
              <input 
                type="number" 
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body font-bold text-white focus:outline-none focus:border-[var(--inverse-primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--on-surface-variant)]">kcal</span>
            </div>
          </div>

          {/* Canlı Makro Kartları (Protein, Karbonhidrat, Şeker, Yağ) */}
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Makro Besin Değerleri</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Protein */}
              <div className="flex flex-col p-2.5 bg-[#161622] border border-[#4ade80]/25 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4ade80]">Protein</span>
                <div className="flex items-center justify-between mt-1">
                  <input
                    type="number"
                    step="0.1"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="w-full bg-transparent text-[13px] font-bold text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-[var(--on-surface-variant)] ml-1">g</span>
                </div>
              </div>

              {/* Karbonhidrat */}
              <div className="flex flex-col p-2.5 bg-[#161622] border border-[#60a5fa]/25 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa]">Karb</span>
                <div className="flex items-center justify-between mt-1">
                  <input
                    type="number"
                    step="0.1"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    className="w-full bg-transparent text-[13px] font-bold text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-[var(--on-surface-variant)] ml-1">g</span>
                </div>
              </div>

              {/* Şeker */}
              <div className="flex flex-col p-2.5 bg-[#161622] border border-[#f472b6]/25 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#f472b6]">Şeker</span>
                <div className="flex items-center justify-between mt-1">
                  <input
                    type="number"
                    step="0.1"
                    value={sugar}
                    onChange={(e) => setSugar(e.target.value)}
                    className="w-full bg-transparent text-[13px] font-bold text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-[var(--on-surface-variant)] ml-1">g</span>
                </div>
              </div>

              {/* Yağ */}
              <div className="flex flex-col p-2.5 bg-[#161622] border border-[#facc15]/25 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#facc15]">Yağ</span>
                <div className="flex items-center justify-between mt-1">
                  <input
                    type="number"
                    step="0.1"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    className="w-full bg-transparent text-[13px] font-bold text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-[var(--on-surface-variant)] ml-1">g</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      

      <div className="mt-4 flex flex-col gap-3">
        <button onClick={handleUpdate} disabled={isLoading} className="w-full flex items-center justify-center py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold transition-colors">
          {isLoading ? <LoadingSpinner size="sm" /> : "Değişiklikleri Kaydet"}
        </button>
        <button onClick={handleDelete} disabled={isLoading} className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-medium transition-colors">
          Yemeği Sil
        </button>
      </div>
    </div>
  );
}
