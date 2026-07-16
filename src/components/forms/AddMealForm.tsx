import { t } from '@/lib/i18n';
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
    savedFoods, recentByType, isLoadingSaved,
    selectedSavedFoods, setSelectedSavedFoods,
    isLoading, handleSubmit, handleMultiSubmit
  } = useAddMealViewModel(onSuccess);

  const [activeTab, setActiveTab] = useState<'new' | 'saved'>('new');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(true);
  
  // FatSecret serving tracking
  const [perGramMacros, setPerGramMacros] = useState({ cals: 0, protein: 0, carbs: 0, fat: 0 });
  const [unitName, setUnitName] = useState('gram');

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (foodName && foodName.length > 2 && activeTab === 'new' && !fatsecretFoodId) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/fatsecret/search?query=${encodeURIComponent(foodName)}`);
          if (res.ok) {
            const data = await res.json();
            const foodsArray = Array.isArray(data.foods) ? data.foods : (data.foods?.food || []);
            setSearchResults(Array.isArray(foodsArray) ? foodsArray : [foodsArray]);
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
    let unit = "gram";
    
    if (desc.match(/100\s*g/i)) {
      multiplier = 1 / 100;
    } else if (desc.match(/1 oz/i)) {
      multiplier = 1 / 28.3495;
    } else {
      const gMatch = desc.match(/Per ([\d.]+)\s*g/i);
      if (gMatch) {
        multiplier = 1 / parseFloat(gMatch[1]);
      } else {
        // Adet veya Porsiyon tabanlı tespit
        const eggMatch = desc.match(/1 egg/i);
        const adetMatch = desc.match(/1 adet/i) || desc.match(/1 tane/i);
        const sliceMatch = desc.match(/1 slice/i) || desc.match(/1 dilim/i);
        const porsiyonMatch = desc.match(/1 porsiyon/i) || desc.match(/1 serving/i);
        const kaseMatch = desc.match(/1 kase/i) || desc.match(/1 cup/i) || desc.match(/1 bardak/i);
        
        if (eggMatch || adetMatch) {
           multiplier = 1;
           unit = "adet";
        } else if (sliceMatch) {
           multiplier = 1;
           unit = "dilim";
        } else if (porsiyonMatch) {
           multiplier = 1;
           unit = "porsiyon";
        } else if (kaseMatch) {
           multiplier = 1;
           unit = "kase";
        } else if (desc.toLowerCase().startsWith('per 1') || desc.match(/^1\s/)) {
           multiplier = 1;
           unit = "adet";
        }
      }
    }
    
    setUnitName(unit);

    const perGram = {
      cals: baseCals * multiplier,
      protein: baseProtein * multiplier,
      carbs: baseCarbs * multiplier,
      fat: baseFat * multiplier
    };
    
    setPerGramMacros(perGram);
    
    // Set default quantity to 100 grams
    const defaultQty = unit === 'gram' ? 100 : 1;
    setQuantity(defaultQty.toString());
    setServingDescription(unit === 'gram' ? '100 gram' : `1 ${unit}`);
    
    setCalories(Math.round(perGram.cals * defaultQty).toString());
    setProtein(Math.round(perGram.protein * defaultQty).toString());
    setCarbs(Math.round(perGram.carbs * defaultQty).toString());
    setFat(Math.round(perGram.fat * defaultQty).toString());

    setShowDropdown(false);
  };

  // Re-calculate macros when quantity changes
  useEffect(() => {
    const qty = parseFloat(quantity) || 0;
    setServingDescription(`${qty} ${unitName}`);
    
    if (fatsecretFoodId) {
      setCalories(Math.round(perGramMacros.cals * qty).toString());
      setProtein(Math.round(perGramMacros.protein * qty).toString());
      setCarbs(Math.round(perGramMacros.carbs * qty).toString());
      setFat(Math.round(perGramMacros.fat * qty).toString());
    }
  }, [quantity, perGramMacros, fatsecretFoodId]);

  return (
    <form onSubmit={activeTab === 'saved' ? handleMultiSubmit : handleSubmit} className="flex flex-col gap-6">
      

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
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="text-[var(--primary)] transition-transform group-focus-within:scale-110" size={22} />
              </div>
              <input 
                type="text" 
                required
                value={foodName}
                onChange={(e) => {
                  setFoodName(e.target.value);
                  setFatsecretFoodId(null); // Clear ID when user edits the text
                }}
                onFocus={() => {
                  setShowDropdown(true);
                  const hasSeenAlert = localStorage.getItem('hasSeenFatSecretAlert');
                  if (!hasSeenAlert) {
                    Alert.info("Bilgilendirme: FatSecret API'nin ücretsiz versiyonu yalnızca İngilizce çalışmaktadır. Lütfen yemekleri İngilizce (örn: chicken, egg) aratınız.");
                    localStorage.setItem('hasSeenFatSecretAlert', 'true');
                  }
                }}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="Veritabanında yemek arayın (Örn: Egg, Apple)..." 
                className="w-full bg-[#16161F] border-2 border-[rgba(255,255,255,0.05)] rounded-2xl py-5 pl-14 pr-24 text-[1.05rem] font-medium text-white focus:outline-none focus:border-[var(--primary)] focus:bg-[rgba(255,255,255,0.02)] focus:shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] transition-all placeholder:text-[var(--on-surface-variant)] placeholder:font-normal"
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <div className="bg-[var(--primary)] text-black text-[10px] uppercase font-bold px-2.5 py-1.5 rounded-lg opacity-80 shadow-sm">
                  Ara
                </div>
              </div>
            </div>

            {/* Always Open Results List (Search Results or Recent Foods) */}
            {showDropdown && (
            <div className="w-full mt-2 bg-[#1A1A24] border border-[rgba(255,255,255,0.1)] rounded-2xl overflow-hidden shadow-sm max-h-64 overflow-y-auto hide-scrollbar z-10">
              {isSearching && foodName.length > 2 ? (
                <div className="p-6 flex flex-col items-center justify-center gap-3 text-[var(--on-surface-variant)] h-32">
                  <LoadingSpinner size="md" />
                  <span className="text-body animate-pulse">Sonuçlar aranıyor...</span>
                </div>
              ) : apiError ? (
                <div className="p-4 text-center text-red-400 text-[var(--font-body)]">{apiError}</div>
              ) : foodName.length > 2 ? (
                searchResults.length > 0 ? (
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
                ) : (
                  <div className="p-4 text-center text-[var(--on-surface-variant)] text-[var(--font-body)]">Sonuç bulunamadı.</div>
                )
              ) : (
                /* Recent Foods / Defaults - Only show when not searching */
                <div className="flex flex-col">
                  <div className="p-3 bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.05)] text-caption text-[var(--on-surface-variant)] uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                    Son Eklenenler (Hızlı Seçim)
                  </div>
                  {(() => {
                    // Combine saved foods (favorites) + recent meals for this meal type
                    const mealTypeRecent = (recentByType?.[mealType] || []).filter((f: any) => f.food_name && f.food_name.trim());
                    const favoriteFoods = (savedFoods || []).filter((f: any) => f.food_name && f.food_name.trim());
                    
                    // Combine and deduplicate
                    const combined = [...mealTypeRecent, ...favoriteFoods];
                    const uniqueMap = new Map(combined.map((f: any) => [f.food_name.toLowerCase().trim(), f]));
                    const uniqueFoods = Array.from(uniqueMap.values()).slice(0, 8);
                    
                    if (uniqueFoods.length === 0) {
                      return (
                        <div className="p-6 text-center text-[var(--on-surface-variant)] text-body">
                          <div className="text-[var(--on-surface-variant)] opacity-75">Henüz yiyecek eklemediniz</div>
                        </div>
                      );
                    }
                    
                    const mappedRecent = uniqueFoods.map((f: any) => ({
                      food_id: f.fatsecret_food_id || f.id,
                      food_name: f.food_name,
                      food_description: `${f.serving_description} - Calories: ${f.calories}kcal | Fat: ${f.fat_g}g | Carbs: ${f.carbs_g}g | Protein: ${f.protein_g}g`,
                      food_type: "Brand",
                      brand_name: "Kaydedilen"
                    }));

                    return mappedRecent.map((food: any, idx: number) => (
                      <div 
                        key={idx}
                        onClick={() => handleSearchResultSelect(food)}
                        className="p-4 hover:bg-[rgba(255,255,255,0.08)] cursor-pointer border-b border-[rgba(255,255,255,0.05)] last:border-0 transition-colors flex justify-between items-center"
                      >
                        <div>
                          <div className="text-body font-medium text-white">{food.food_name}</div>
                          <div className="text-caption text-[var(--on-surface-variant)] mt-1 opacity-75">{food.food_description}</div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
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
                <div className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider">{t('forms.carbs')}</div>
                <div className="font-medium text-[#60a5fa]">{carbs}g</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider">{t('forms.protein')}</div>
                <div className="font-medium text-[#4ade80]">{protein}g</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider">{t('forms.fat')}</div>
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
                        <span className={`text-body font-medium ${isSelected ? 'text-black' : 'text-white'}`}>{recipe.food_name as string}</span>
                      <span className={`text-caption ${isSelected ? 'text-black/70' : 'text-[var(--on-surface-variant)]'}`}>{recipe.serving_description as string || `${recipe.quantity} gram`}</span>
                    </div>
                  </div>
                  <span className={`text-body font-bold ${isSelected ? 'text-black' : 'text-[var(--primary)]'}`}>{recipe.calories as number} kcal</span>
                </div>
              );
            })
          ) : (
            <div className="text-center text-[var(--font-body)] text-[var(--on-surface-variant)] py-4">
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
