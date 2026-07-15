import React, { useState, useEffect } from 'react';
import { Search, Save, Check } from 'lucide-react';
import { useAddMealViewModel } from '@/viewmodels/useAddMealViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Alert } from '@/lib/alerts';

export function AddMealForm({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const {
    type: mealType, setType: setMealType,
    foodName, setFoodName,
    servingDescription, setServingDescription,
    quantity, setQuantity,
    calories, setCalories,
    protein, setProtein,
    carbs, setCarbs,
    fat, setFat,
    fatsecretFoodId, setFatsecretFoodId,
    saveAsRecipe, setSaveAsRecipe,
    savedFoods, isLoadingSaved,
    selectedSavedFoods, setSelectedSavedFoods,
    isLoading, error, handleSubmit, handleMultiSubmit
  } = useAddMealViewModel(onSuccess);

  const [activeTab, setActiveTab] = useState<'new' | 'saved'>('new');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // FatSecret serving tracking
  const [perGramMacros, setPerGramMacros] = useState({ cals: 0, protein: 0, carbs: 0, fat: 0 });

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (foodName && foodName.length > 2 && activeTab === 'new' && !fatsecretFoodId) {
        setIsSearching(true);
        setShowDropdown(true);
        try {
          const res = await fetch(`/api/fatsecret/search?query=${encodeURIComponent(foodName)}`);
          if (res.ok) {
            const data = await res.json();
            const foods = data.foods?.food || [];
            setSearchResults(Array.isArray(foods) ? foods : [foods]);
            setApiError(null);
          } else {
            const errData = await res.json();
            setApiError(errData.error || "Arama sırasında bir hata oluştu.");
            setSearchResults([]);
          }
        } catch (err) {
          console.error("FatSecret search error:", err);
          setApiError("Bağlantı hatası oluştu.");
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [foodName, activeTab, fatsecretFoodId]);

  useEffect(() => {
    // Only set initial if not already set, or just let ViewModel handle it.
    // The ViewModel initializes it to 'breakfast'. Let's override it based on time.
    const hour = new Date().getHours();
    if (hour < 12) setMealType('breakfast');
    else if (hour < 16) setMealType('lunch');
    else if (hour < 22) setMealType('dinner');
    else setMealType('snack');
  }, [setMealType]);

  const handleSavedRecipeClick = (recipe: Record<string, unknown>) => {
    const id = recipe.id as string;
    if (selectedSavedFoods.includes(id)) {
      setSelectedSavedFoods(selectedSavedFoods.filter(i => i !== id));
    } else {
      setSelectedSavedFoods([...selectedSavedFoods, id]);
    }
  };

  const handleSearchResultSelect = (food: any) => {
    setFoodName(food.food_name);
    setFatsecretFoodId(food.food_id);
    
    // Parse description for base macros
    const desc = food.food_description || '';
    const calsMatch = desc.match(/Calories: ([\d.]+)kcal/);
    const fatMatch = desc.match(/Fat: ([\d.]+)g/);
    const carbsMatch = desc.match(/Carbs: ([\d.]+)g/);
    const proteinMatch = desc.match(/Protein: ([\d.]+)g/);

    const baseCals = calsMatch ? parseFloat(calsMatch[1]) : 0;
    const baseFat = fatMatch ? parseFloat(fatMatch[1]) : 0;
    const baseCarbs = carbsMatch ? parseFloat(carbsMatch[1]) : 0;
    const baseProtein = proteinMatch ? parseFloat(proteinMatch[1]) : 0;

    let multiplier = 1 / 100; // Default: assume the description is for 100g
    if (desc.includes('100g') || desc.includes('100 g')) {
      multiplier = 1 / 100;
    } else if (desc.includes('1 oz')) {
      multiplier = 1 / 28.3495;
    } else {
      // Try to extract any "Per Xg" or "Per X g"
      const gMatch = desc.match(/Per ([\d.]+)\s*g/i);
      if (gMatch) {
        multiplier = 1 / parseFloat(gMatch[1]);
      }
    }

    const perGram = {
      cals: baseCals * multiplier,
      protein: baseProtein * multiplier,
      carbs: baseCarbs * multiplier,
      fat: baseFat * multiplier
    };
    
    setPerGramMacros(perGram);
    
    // Set default quantity to 100 grams
    setQuantity('100');
    setServingDescription('100 gram');
    
    setCalories(Math.round(perGram.cals * 100).toString());
    setProtein(Math.round(perGram.protein * 100).toString());
    setCarbs(Math.round(perGram.carbs * 100).toString());
    setFat(Math.round(perGram.fat * 100).toString());

    setShowDropdown(false);
  };

  // Re-calculate macros when quantity changes
  useEffect(() => {
    const qty = parseFloat(quantity) || 0;
    setServingDescription(`${qty} gram`);
    
    if (fatsecretFoodId) {
      setCalories(Math.round(perGramMacros.cals * qty).toString());
      setProtein(Math.round(perGramMacros.protein * qty).toString());
      setCarbs(Math.round(perGramMacros.carbs * qty).toString());
      setFat(Math.round(perGramMacros.fat * qty).toString());
    }
  }, [quantity, perGramMacros, fatsecretFoodId]);

  return (
    <form onSubmit={activeTab === 'saved' ? handleMultiSubmit : handleSubmit} className="flex flex-col gap-6">
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
          className={`flex-1 py-2.5 text-center rounded-xl text-body font-medium transition-all ${activeTab === 'new' ? 'bg-[var(--primary)] shadow-sm text-black' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
        >
          Yeni Öğün
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('saved')}
          className={`flex-1 py-2.5 text-center rounded-xl text-body font-medium transition-all ${activeTab === 'saved' ? 'bg-[var(--primary)] shadow-sm text-black' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
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
          <div className="flex flex-col gap-2 relative z-50">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Yemek Adı</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={20} />
              <input 
                type="text" 
                required
                value={foodName}
                onChange={(e) => {
                  setFoodName(e.target.value);
                  setFatsecretFoodId(null); // Clear ID when user edits the text
                }}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                  // Check for first time FatSecret usage
                  const hasSeenAlert = localStorage.getItem('hasSeenFatSecretAlert');
                  if (!hasSeenAlert) {
                    // Use standard alert as placeholder (or a toast if a toast system existed)
                    Alert.info("Bilgilendirme: FatSecret API'nin ücretsiz versiyonu yalnızca İngilizce çalışmaktadır. Lütfen yemekleri İngilizce (örn: chicken, egg) aratınız.");
                    localStorage.setItem('hasSeenFatSecretAlert', 'true');
                  }
                }}
                onBlur={() => {
                  // Small delay to allow clicking on dropdown items
                  setTimeout(() => setShowDropdown(false), 200);
                }}
                placeholder="Yemek adını girin..." 
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 pl-12 pr-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>

            {/* Dropdown Results */}
            {showDropdown && (
              <div className="absolute top-[100%] left-0 w-full mt-2 bg-[#1A1A24] border border-[rgba(255,255,255,0.1)] rounded-2xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto hide-scrollbar z-50">
                {apiError ? (
                  <div className="p-4 text-center text-red-400 text-sm">{apiError}</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((food: any) => (
                    <div 
                      key={food.food_id}
                      onClick={() => handleSearchResultSelect(food)}
                      className="p-4 hover:bg-[rgba(255,255,255,0.08)] cursor-pointer border-b border-[rgba(255,255,255,0.05)] last:border-0 transition-colors"
                    >
                      <div className="text-body font-medium text-white">{food.food_name}</div>
                      <div className="text-caption text-[var(--on-surface-variant)] mt-1">{food.food_description}</div>
                    </div>
                  ))
                ) : foodName.length > 2 && !isSearching && (
                  <div className="p-4 text-center text-[var(--on-surface-variant)] text-sm">Sonuç bulunamadı.</div>
                )}
              </div>
            )}
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
              <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Miktar (Gram)</label>
              <input 
                type="number" 
                step="0.1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Örn: 100" 
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
              />
            </div>
          </div>
          
          {/* Makro Önizleme */}
          {(parseFloat(protein) > 0 || parseFloat(carbs) > 0 || parseFloat(fat) > 0) && (
            <div className="flex gap-4 p-3 bg-[rgba(255,255,255,0.02)] rounded-xl border border-[rgba(255,255,255,0.05)] justify-center">
              <div className="text-center">
                <div className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider">Karb</div>
                <div className="font-medium text-[#60a5fa]">{carbs}g</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider">Protein</div>
                <div className="font-medium text-[#4ade80]">{protein}g</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider">Yağ</div>
                <div className="font-medium text-[#facc15]">{fat}g</div>
              </div>
            </div>
          )}

          {/* Tarif Olarak Kaydet */}
          <label className="flex items-center gap-3 cursor-pointer mt-2 group" onClick={() => setSaveAsRecipe(!saveAsRecipe)}>
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${saveAsRecipe ? 'bg-[var(--primary)] border-[var(--inverse-primary)]' : 'border-[rgba(255,255,255,0.2)] group-hover:border-[rgba(255,255,255,0.4)]'}`}>
              {saveAsRecipe && <Check size={14} className="text-white" />}
            </div>
            <span className="text-body text-[var(--on-surface-variant)] group-hover:text-white transition-colors">Bu yemeği favorilerime/tariflerime kaydet</span>
          </label>
        </div>
      ) : (
        <div className="flex flex-col gap-3 animate-fade-in">
          {isLoadingSaved ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : savedFoods.length > 0 ? (
            savedFoods.map((recipe: Record<string, unknown>) => {
              const isSelected = selectedSavedFoods.includes(recipe.id as string);
              return (
                <div 
                  key={recipe.id as string} 
                  onClick={() => handleSavedRecipeClick(recipe)}
                  className={`p-4 flex items-center justify-between rounded-2xl cursor-pointer transition-colors border ${
                    isSelected ? 'bg-[var(--primary)] border-[var(--primary)] text-black' : 'bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.05)] border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                      isSelected ? 'bg-black/20 border-transparent text-black' : 'border-[rgba(255,255,255,0.2)]'
                    }`}>
                      {isSelected && <Check size={14} />}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-body font-medium ${isSelected ? 'text-black' : 'text-white'}`}>{recipe.name as string}</span>
                      <span className={`text-caption ${isSelected ? 'text-black/70' : 'text-[var(--on-surface-variant)]'}`}>{recipe.serving_description as string || `${recipe.quantity} gram`}</span>
                    </div>
                  </div>
                  <span className={`text-body font-bold ${isSelected ? 'text-black' : 'text-[var(--primary)]'}`}>{recipe.calories as number} kcal</span>
                </div>
              );
            })
          ) : (
            <div className="text-center text-sm text-[var(--on-surface-variant)] py-4">
              Henüz kaydedilmiş bir yemeğiniz bulunmuyor. Yeni bir yemek eklerken "Kaydet" seçeneğini işaretleyebilirsiniz.
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-2 flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
          İptal
        </button>
        <button type="submit" disabled={isLoading || (activeTab === 'saved' && selectedSavedFoods.length === 0)} className="flex-[2] py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? <LoadingSpinner size="sm" /> : (activeTab === 'saved' ? `Seçilenleri Ekle (${selectedSavedFoods.length})` : "Ekle")}
        </button>
      </div>
    </form>
  );
}
