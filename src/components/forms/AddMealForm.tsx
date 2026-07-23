import { t } from '@/lib/i18n';
import React, { useState, useEffect } from 'react';
import { Search, Save, Check, Wand2 } from 'lucide-react';
import { useAddMealViewModel } from '@/viewmodels/useAddMealViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { searchLocalFoodsAction, fetchFromGeminiAction } from '@/actions/foodDictionary';
import toast from 'react-hot-toast';

const STANDARD_UNITS = ['gram', 'adet', 'tabak', 'porsiyon'];

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
    saveAsRecipe, setSaveAsRecipe,
    savedFoods, recentByType, isLoadingSaved,
    selectedSavedFoods, setSelectedSavedFoods,
    isLoading, handleSubmit, handleMultiSubmit
  } = useAddMealViewModel(onSuccess);

  const [activeTab, setActiveTab] = useState<'new' | 'saved'>('new');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Selected food state
  const [selectedFood, setSelectedFood] = useState<any | null>(null);
  const [unitName, setUnitName] = useState('gram');
  const [perUnitMacros, setPerUnitMacros] = useState({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  const [isFetchingGemini, setIsFetchingGemini] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (foodName && foodName.length > 1 && activeTab === 'new' && !selectedFood) {
        setIsSearching(true);
        setShowDropdown(true);
        try {
          const res = await searchLocalFoodsAction(foodName);
          if (res.success) {
            setSearchResults(res.foods);
          } else {
            setSearchResults([]);
          }
        } catch (err) {
          console.error("Local search error:", err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else if (!selectedFood) {
        setSearchResults([]);
        if (foodName.length === 0) setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [foodName, activeTab, selectedFood]);

  useEffect(() => {
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

  const selectLocalFood = (food: any) => {
    setFoodName(food.name);
    setSelectedFood(food);
    setShowDropdown(false);
    
    // Automatically select the first available unit or 'gram'
    const defaultUnit = food.units.length > 0 ? food.units[0] : null;
    if (defaultUnit) {
      applyUnit(defaultUnit);
    } else {
      setUnitName('gram');
    }
  };

  const applyUnit = (unitData: any) => {
    setUnitName(unitData.unit_name);
    setPerUnitMacros({
      calories: unitData.calories,
      protein_g: unitData.protein_g,
      carbs_g: unitData.carbs_g,
      fat_g: unitData.fat_g
    });
    
    // Set default quantity based on unit
    const defaultQty = unitData.unit_name === 'gram' ? 100 : 1;
    setQuantity(defaultQty.toString());
    setServingDescription(unitData.unit_name === 'gram' ? '100 gram' : `1 ${unitData.unit_name}`);
  };

  const fetchFromGemini = async (targetUnit: string) => {
    setIsFetchingGemini(true);
    const toastId = toast.loading(`Gemini yapay zeka ile 1 ${targetUnit} ${foodName} aranıyor...`);
    try {
      const res = await fetchFromGeminiAction(foodName, targetUnit);
      if (res.success && res.unit) {
        toast.success("Besin değerleri bulundu ve kaydedildi!", { id: toastId });
        applyUnit(res.unit);
        
        // Update selectedFood to include the new unit
        if (selectedFood) {
          const updatedUnits = [...selectedFood.units.filter((u: any) => u.unit_name !== targetUnit), res.unit];
          setSelectedFood({ ...selectedFood, units: updatedUnits });
        } else {
          // It was a completely new food
          setSelectedFood({
            name: foodName,
            units: [res.unit]
          });
        }
      } else {
        toast.error(res.error || "Değerler bulunamadı.", { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message || "Hata oluştu.", { id: toastId });
    } finally {
      setIsFetchingGemini(false);
    }
  };

  // Re-calculate macros when quantity changes
  useEffect(() => {
    const qty = parseFloat(quantity) || 0;
    setServingDescription(`${qty} ${unitName}`);
    
    if (selectedFood && perUnitMacros.calories > 0) {
      setCalories(Math.round(perUnitMacros.calories * qty).toString());
      setProtein(Math.round(perUnitMacros.protein_g * qty).toString());
      setCarbs(Math.round(perUnitMacros.carbs_g * qty).toString());
      setFat(Math.round(perUnitMacros.fat_g * qty).toString());
    }
  }, [quantity, perUnitMacros, unitName, selectedFood]);

  const renderUnitButtons = () => {
    // Determine which units we have and which we are missing
    const availableUnits = selectedFood?.units || [];
    const availableUnitNames = availableUnits.map((u: any) => u.unit_name);
    
    // Combine standard units with any custom units that might be in the DB
    const allUnits = Array.from(new Set([...STANDARD_UNITS, ...availableUnitNames]));

    return (
      <div className="flex flex-col gap-2 mt-4 animate-fade-in">
        <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Miktar Türü Seçin</label>
        <div className="flex flex-wrap gap-2">
          {allUnits.map(unit => {
            const isAvailable = availableUnitNames.includes(unit);
            const isActive = unitName === unit;
            
            return (
              <button
                key={unit}
                type="button"
                onClick={() => {
                  setUnitName(unit);
                  if (isAvailable) {
                    const unitData = availableUnits.find((u: any) => u.unit_name === unit);
                    applyUnit(unitData);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-[var(--primary)] text-black shadow-sm' 
                    : isAvailable 
                      ? 'bg-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.15)]'
                      : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] border border-dashed border-[rgba(255,255,255,0.2)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                }`}
              >
                {unit} {!isAvailable && <span className="ml-1 text-[10px]">(Eksik)</span>}
              </button>
            );
          })}
        </div>
        
        {/* If selected unit is missing, show Gemini fetch button */}
        {!availableUnitNames.includes(unitName) && foodName && (
          <button
            type="button"
            onClick={() => fetchFromGemini(unitName)}
            disabled={isFetchingGemini}
            className="mt-2 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-medium shadow-md transition-all disabled:opacity-50"
          >
            {isFetchingGemini ? <LoadingSpinner size="sm" /> : <Wand2 size={18} />}
            {foodName} için 1 {unitName} değerini Gemini ile Bul
          </button>
        )}
      </div>
    );
  };

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
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap">
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
            className={`flex-1 min-w-[120px] py-3 text-center rounded-2xl text-body font-medium transition-all ${mealType === m.id ? 'bg-[rgba(255,255,255,0.1)] text-white shadow-sm ring-1 ring-[rgba(255,255,255,0.2)]' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
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
                  setSelectedFood(null); // Clear selected food when typing
                  setShowDropdown(true);
                }}
                onFocus={() => {
                  if (foodName.length > 0 && !selectedFood) setShowDropdown(true);
                }}
                placeholder="Yemek arayın (Örn: Kıyma, Muz)..." 
                className="w-full bg-[#16161F] border-2 border-[rgba(255,255,255,0.05)] rounded-2xl py-5 pl-14 pr-24 text-[1.05rem] font-medium text-white focus:outline-none focus:border-[var(--primary)] focus:bg-[rgba(255,255,255,0.02)] focus:shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] transition-all placeholder:text-[var(--on-surface-variant)] placeholder:font-normal"
              />
              <div className="absolute inset-y-0 right-3 flex items-center">
                <button type="button" onClick={() => setShowDropdown(false)} className="bg-[var(--primary)] text-black text-[10px] uppercase font-bold px-3 py-2 rounded-lg opacity-90 shadow-sm hover:opacity-100 transition-opacity">
                  Kapat
                </button>
              </div>
            </div>

            {/* Always Open Results List (Search Results or Recent Foods) */}
            {showDropdown && !selectedFood && (
            <div className="absolute top-[100%] mt-2 left-0 right-0 bg-[#1A1A24] border border-[rgba(255,255,255,0.1)] rounded-2xl overflow-hidden shadow-xl max-h-64 overflow-y-auto hide-scrollbar z-50">
              {isSearching ? (
                <div className="p-6 flex flex-col items-center justify-center gap-3 text-[var(--on-surface-variant)] h-32">
                  <LoadingSpinner size="md" />
                  <span className="text-body animate-pulse">Lokal sözlükte aranıyor...</span>
                </div>
              ) : foodName.length > 1 ? (
                searchResults.length > 0 ? (
                  searchResults.map((food: any) => (
                    <div 
                      key={food.id}
                      onClick={() => selectLocalFood(food)}
                      className="p-4 hover:bg-[rgba(255,255,255,0.08)] cursor-pointer border-b border-[rgba(255,255,255,0.05)] last:border-0 transition-colors flex justify-between items-center"
                    >
                      <div className="text-body font-medium text-white">{food.name}</div>
                      <div className="flex gap-1">
                        {food.units.map((u: any) => (
                          <span key={u.unit_name} className="text-[10px] bg-[rgba(255,255,255,0.1)] px-2 py-1 rounded text-[var(--on-surface-variant)]">{u.unit_name}</span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center flex flex-col gap-2">
                    <span className="text-[var(--on-surface-variant)] text-[var(--font-body)]">Lokal veritabanında bulunamadı.</span>
                    <button 
                      type="button"
                      onClick={() => {
                        setShowDropdown(false);
                        // The UI below will render Gemini buttons for missing units
                      }}
                      className="text-[var(--primary)] text-sm font-medium hover:underline"
                    >
                      Yeni Ekle / Gemini ile Arat
                    </button>
                  </div>
                )
              ) : (
                /* Recent Foods / Defaults - Only show when not searching */
                <div className="flex flex-col">
                  <div className="p-3 bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.05)] text-caption text-[var(--on-surface-variant)] uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                    Son Eklenenler (Hızlı Seçim)
                  </div>
                  {(() => {
                    const mealTypeRecent = (recentByType?.[mealType] || []).filter((f: any) => f.food_name && f.food_name.trim());
                    const favoriteFoods = (savedFoods || []).filter((f: any) => f.food_name && f.food_name.trim());
                    
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

                    return uniqueFoods.map((food: any, idx: number) => (
                      <div 
                        key={idx}
                        onClick={() => {
                          setFoodName(food.food_name);
                          setServingDescription(food.serving_description || '1 porsiyon');
                          setQuantity((food.quantity || 1).toString());
                          setCalories((food.calories || 0).toString());
                          setProtein((food.protein_g || 0).toString());
                          setCarbs((food.carbs_g || 0).toString());
                          setFat((food.fat_g || 0).toString());
                          setShowDropdown(false);
                        }}
                        className="p-4 hover:bg-[rgba(255,255,255,0.08)] cursor-pointer border-b border-[rgba(255,255,255,0.05)] last:border-0 transition-colors flex justify-between items-center"
                      >
                        <div>
                          <div className="text-body font-medium text-white">{food.food_name}</div>
                          <div className="text-caption text-[var(--on-surface-variant)] mt-1 opacity-75">{food.serving_description} - {food.calories} kcal</div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
            )}
          </div>

          {/* Unit / Gemini Options */}
          {foodName.length > 0 && !showDropdown && renderUnitButtons()}

          {/* SADECE GEMINI ILE VERILER BULUNDUKTAN VEYA LOCAL'DEN SEÇILDİKTEN SONRA GÖSTERILECEK ALAN */}
          {((selectedFood && selectedFood.units.find((u:any) => u.unit_name === unitName)) || parseFloat(calories) > 0) && (
            <div className="grid grid-cols-2 gap-4 mt-2 md:flex md:flex-col">
              <div className="flex flex-col gap-2">
                <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Miktar ({unitName})</label>
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
              
              <div className="flex flex-col gap-2">
                <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Toplam Kalori (kcal)</label>
                <input 
                  type="number" 
                  required
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
                />
              </div>
            </div>
          )}
          
          {/* Makro Önizleme */}
          {parseFloat(calories) > 0 && (parseFloat(protein) > 0 || parseFloat(carbs) > 0 || parseFloat(fat) > 0) && (
            <div className="flex gap-4 p-3 bg-[rgba(255,255,255,0.02)] rounded-xl border border-[rgba(255,255,255,0.05)] justify-center flex-wrap">
              <div className="text-center px-4">
                <div className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider">{t('forms.carbs')}</div>
                <div className="font-medium text-[#60a5fa]">{carbs}g</div>
              </div>
              <div className="text-center px-4 border-l border-r border-[rgba(255,255,255,0.1)]">
                <div className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider">{t('forms.protein')}</div>
                <div className="font-medium text-[#4ade80]">{protein}g</div>
              </div>
              <div className="text-center px-4">
                <div className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider">{t('forms.fat')}</div>
                <div className="font-medium text-[#facc15]">{fat}g</div>
              </div>
            </div>
          )}

          {/* Tarif Olarak Kaydet */}
          {parseFloat(calories) > 0 && (
            <label className="flex items-center gap-3 cursor-pointer mt-2 group" onClick={() => setSaveAsRecipe(!saveAsRecipe)}>
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${saveAsRecipe ? 'bg-[var(--primary)] border-[var(--inverse-primary)]' : 'border-[rgba(255,255,255,0.2)] group-hover:border-[rgba(255,255,255,0.4)]'}`}>
                {saveAsRecipe && <Check size={14} className="text-white" />}
              </div>
              <span className="text-body text-[var(--on-surface-variant)] group-hover:text-white transition-colors">Bu yemeği favorilerime/tariflerime kaydet</span>
            </label>
          )}
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
      <div className="mt-4 flex gap-3 flex-col sm:flex-row">
        <button type="button" onClick={onClose} className="w-full sm:flex-1 py-4 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
          İptal
        </button>
        <button type="submit" disabled={isLoading || (activeTab === 'saved' && selectedSavedFoods.length === 0) || (activeTab === 'new' && (!foodName || !calories))} className="w-full sm:flex-[2] py-4 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
          {isLoading ? <LoadingSpinner size="sm" /> : (activeTab === 'saved' ? `Seçilenleri Ekle (${selectedSavedFoods.length})` : "Öğünü Kaydet")}
        </button>
      </div>
    </form>
  );
}
