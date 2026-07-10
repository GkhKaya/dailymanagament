import React, { useState, useEffect } from 'react';
import { Search, Save, Check } from 'lucide-react';
import { useAddMealViewModel } from '@/viewmodels/useAddMealViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function AddMealForm({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const {
    type: mealType, setType: setMealType,
    foodName, setFoodName,
    servingDescription, setServingDescription,
    quantity, setQuantity,
    calories, setCalories,
    isLoading, error, handleSubmit
  } = useAddMealViewModel(onSuccess);

  const [activeTab, setActiveTab] = useState<'new' | 'saved'>('new');
  const [saveAsRecipe, setSaveAsRecipe] = useState(false);

  useEffect(() => {
    // Only set initial if not already set, or just let ViewModel handle it.
    // The ViewModel initializes it to 'breakfast'. Let's override it based on time.
    const hour = new Date().getHours();
    if (hour < 12) setMealType('breakfast');
    else if (hour < 16) setMealType('lunch');
    else if (hour < 22) setMealType('dinner');
    else setMealType('snack');
  }, [setMealType]);

  const savedRecipes = [
    { id: 1, name: 'Yulaf Lapası', calories: 350 },
    { id: 2, name: 'Tavuk Salata', calories: 420 },
    { id: 3, name: 'Protein Shake', calories: 200 }
  ];

  const handleSavedRecipeClick = (recipe: any) => {
    setFoodName(recipe.name);
    setCalories(recipe.calories.toString());
    setQuantity('1');
    setServingDescription('1 porsiyon');
    setActiveTab('new');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/20 text-red-200 text-sm border border-red-500/30">
          {error}
        </div>
      )}

      {/* Top Tabs: Yeni vs Kaydedilenler */}
      <div className="flex p-1 bg-[rgba(255,255,255,0.05)] rounded-2xl">
        <button 
          type="button"
          onClick={() => setActiveTab('new')}
          className={`flex-1 py-2.5 text-center rounded-xl text-body font-medium transition-all ${activeTab === 'new' ? 'bg-[var(--inverse-primary)] shadow-sm text-white' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
        >
          Yeni Öğün
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('saved')}
          className={`flex-1 py-2.5 text-center rounded-xl text-body font-medium transition-all ${activeTab === 'saved' ? 'bg-[var(--inverse-primary)] shadow-sm text-white' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
        >
          Kaydedilenler
        </button>
      </div>

      {/* Öğün Seçimi (Ortak) */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: 'breakfast', label: 'Kahvaltı' },
          { id: 'lunch', label: 'Öğle' },
          { id: 'dinner', label: 'Akşam' },
          { id: 'snack', label: 'Atıştırmalık' }
        ].map(m => (
          <button 
            key={m.id}
            type="button"
            onClick={() => setMealType(m.id as any)}
            className={`py-3 text-center rounded-2xl text-body font-medium transition-all ${mealType === m.id ? 'bg-[rgba(255,255,255,0.1)] text-white shadow-sm ring-1 ring-[rgba(255,255,255,0.2)]' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {activeTab === 'new' ? (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Yemek Arama / Adı */}
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Yemek Adı</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={20} />
              <input 
                type="text" 
                required
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="Yemek adını girin..." 
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 pl-12 pr-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Kalori (kcal)</label>
              <input 
                type="number" 
                required
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="Örn: 350" 
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Miktar</label>
              <input 
                type="number" 
                step="0.1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1" 
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Birim Seçimi</label>
            <select 
              value={servingDescription}
              onChange={(e) => setServingDescription(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all appearance-none"
            >
              <option value="1 porsiyon">Porsiyon</option>
              <option value="100 gram">Gram (100g)</option>
              <option value="1 adet">Adet</option>
              <option value="1 bardak">Bardak / Kupa</option>
            </select>
          </div>

          {/* Tarif Olarak Kaydet */}
          <label className="flex items-center gap-3 cursor-pointer mt-2 group" onClick={() => setSaveAsRecipe(!saveAsRecipe)}>
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${saveAsRecipe ? 'bg-[var(--inverse-primary)] border-[var(--inverse-primary)]' : 'border-[rgba(255,255,255,0.2)] group-hover:border-[rgba(255,255,255,0.4)]'}`}>
              {saveAsRecipe && <Check size={14} className="text-white" />}
            </div>
            <span className="text-body text-[var(--on-surface-variant)] group-hover:text-white transition-colors">Bu yemeği favorilerime/tariflerime kaydet</span>
          </label>
        </div>
      ) : (
        <div className="flex flex-col gap-3 animate-fade-in">
          {savedRecipes.map(recipe => (
            <div 
              key={recipe.id} 
              onClick={() => handleSavedRecipeClick(recipe)}
              className="p-4 flex items-center justify-between bg-[rgba(255,255,255,0.03)] rounded-2xl hover:bg-[rgba(255,255,255,0.05)] cursor-pointer transition-colors"
            >
              <span className="text-body font-medium text-white">{recipe.name}</span>
              <span className="text-body font-bold text-[var(--inverse-primary)]">{recipe.calories} kcal</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-2 flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
          İptal
        </button>
        <button type="submit" disabled={isLoading} className="flex-[2] py-3 rounded-xl bg-[var(--inverse-primary)] hover:bg-[var(--inverse-primary-hover)] text-white font-bold transition-colors flex items-center justify-center">
          {isLoading ? <LoadingSpinner size="sm" /> : "Ekle"}
        </button>
      </div>
    </form>
  );
}
