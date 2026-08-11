'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, ChevronDown, Check, X, Loader2, Trash2, CheckCircle2, Camera } from 'lucide-react';
import { useAddMealViewModel } from '@/viewmodels/useAddMealViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { deleteMealAction } from '@/actions/health';
import toast from 'react-hot-toast';
import { t } from '@/lib/i18n';
import { resolveFoodName } from '@/lib/mistral-ocr';

// Makro renk kodları
const MACRO_COLORS = {
  carbs: '#60a5fa',
  protein: '#4ade80',
  fat: '#facc15',
  sugar: '#f472b6',
  calories: '#fb923c'
};

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type SearchStep = 'idle' | 'searching' | 'results' | 'gemini_form' | 'gemini_loading' | 'gemini_result' | 'manual_form' | 'manual_loading';

interface DBFoodResult {
  id: string;
  food_name: string;
  food_name_en: string | null;
  unit_type: 'gram' | 'adet' | 'kase' | 'bardak' | 'tabak' | 'çay kaşığı' | 'tatlı kaşığı' | 'çorba kaşığı' | 'yemek kaşığı';
  per_unit: { calories: number; protein_g: number; carbs_g: number; fat_g: number; sugar_g?: number; fiber_g?: number };
  brand_name: string | null;
  source: string;
  provider?: 'gemini' | 'openrouter' | null;
}

interface SelectedFood {
  id: string | null;
  name: string;
  unit_type: 'gram' | 'adet' | 'kase' | 'bardak' | 'tabak' | 'çay kaşığı' | 'tatlı kaşığı' | 'çorba kaşığı' | 'yemek kaşığı';
  per_unit: { calories: number; protein_g: number; carbs_g: number; fat_g: number; sugar_g?: number };
}

interface SessionAddedMeal {
  entry_id: string;
  food_name: string;
  quantity: number;
  unit_type: string;
  serving_description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sugar_g: number;
  type: string;
}
const MEAL_OPTIONS: { id: MealType; label: string; icon: string }[] = [
  { id: 'breakfast', label: 'Kahvaltı', icon: '🌅' },
  { id: 'lunch', label: 'Öğle', icon: '☀️' },
  { id: 'dinner', label: 'Akşam', icon: '🌙' },
  { id: 'snack', label: 'Ara Öğün', icon: '🍎' }
];

export function AddMealForm({ onClose, onSuccess, currentDate }: { onClose: () => void; onSuccess: () => void; currentDate?: string }) {
  const {
    type: mealType, setType: setMealType,
    foodName, setFoodName,
    servingDescription, setServingDescription,
    quantity, setQuantity,
    unitType, setUnitType,
    calories, setCalories,
    protein, setProtein,
    carbs, setCarbs,
    fat, setFat,
    sugar, setSugar,
    fatsecretFoodId: foodCacheId, setFatsecretFoodId: setFoodCacheId,
    saveAsRecipe, setSaveAsRecipe,
    savedFoods, recentByType, isLoadingSaved,
    selectedSavedFoods, setSelectedSavedFoods,
    isLoading, handleSubmit, handleMultiSubmit
  } = useAddMealViewModel(onSuccess, currentDate);

  const [activeTab, setActiveTab] = useState<'new' | 'saved'>('new');
  const [searchStep, setSearchStep] = useState<SearchStep>('idle');
  const [searchResults, setSearchResults] = useState<DBFoodResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<SelectedFood | null>(null);
  const [amount, setAmount] = useState('100');
  const [geminiResult, setGeminiResult] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(true);
  const [manualBrand, setManualBrand] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [manualSugar, setManualSugar] = useState('');
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [isOcrReady, setIsOcrReady] = useState(false);
  const [ocrProvider, setOcrProvider] = useState<'gemini' | 'mistral'>('gemini');
  const searchRef = useRef<HTMLInputElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  // Otomatik öğün seçimi
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 10) setMealType('breakfast');
    else if (hour < 15) setMealType('lunch');
    else if (hour < 21) setMealType('dinner');
    else setMealType('snack');
  }, [setMealType]);

  // Arama debounce
  useEffect(() => {
    if (selectedFood) return;
    
    if (!searchQuery || searchQuery.length < 2) {
      setSearchStep('idle');
      setSearchResults([]);
      return;
    }

    clearTimeout(searchTimer.current);
    setSearchStep('searching');
    setShowDropdown(true);

    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/food/search?query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.foods || []);
        setSearchStep('results');
      } catch {
        setSearchResults([]);
        setSearchStep('results');
      }
    }, 400);

    return () => clearTimeout(searchTimer.current);
  }, [searchQuery, selectedFood]);

  // Miktar değişince makroları yeniden hesapla
  useEffect(() => {
    if (!selectedFood) return;
    const qty = parseFloat(amount) || 0;
    const p = selectedFood.per_unit;
    setCalories(Math.round(p.calories * qty).toString());
    setProtein((Math.round(p.protein_g * qty * 10) / 10).toString());
    setCarbs((Math.round(p.carbs_g * qty * 10) / 10).toString());
    setFat((Math.round(p.fat_g * qty * 10) / 10).toString());
    setSugar((Math.round((p.sugar_g || 0) * qty * 10) / 10).toString());
    setQuantity(qty.toString());
    setServingDescription(`${qty} ${unitType}`);
  }, [amount, selectedFood, unitType]);

  const handleSelectFromDB = (food: DBFoodResult) => {
    setSelectedFood({
      id: food.id,
      name: food.food_name,
      unit_type: food.unit_type,
      per_unit: { 
          calories: food.per_unit.calories, 
          protein_g: food.per_unit.protein_g, 
          carbs_g: food.per_unit.carbs_g, 
          fat_g: food.per_unit.fat_g,
          sugar_g: food.per_unit.sugar_g || 0
      }
    });
    setFoodName(food.food_name);
    setFoodCacheId(food.id);
    setGeminiResult(food.provider ? { provider: food.provider, cached: true } : null);
    setUnitType(food.unit_type);
    setAmount(food.unit_type === 'gram' ? '100' : '1');
    setShowDropdown(false);
    setSearchStep('idle');
  };

  const handleSelectRecent = async (food: any) => {
    let detectedUnit = food.unit_type || 'gram';
    if (!food.unit_type && food.serving_description) {
      const descLower = food.serving_description.toLowerCase();
      if (descLower.includes('adet') || descLower.includes('porsiyon')) {
        detectedUnit = 'adet';
      }
    }

    let perUnit = food.per_unit;

    // Eğer per_unit yoksa veya makrolar 0 gelmişse FoodCache'ten arama yapıp güncel verileri alalım
    if (!perUnit || (perUnit.protein_g === 0 && perUnit.carbs_g === 0 && perUnit.fat_g === 0)) {
      try {
        const res = await fetch(`/api/food/search?query=${encodeURIComponent(food.food_name)}`);
        const data = await res.json();
        const match = data.foods?.find((f: any) => f.food_name.toLowerCase() === food.food_name.toLowerCase()) || data.foods?.[0];
        if (match) {
          detectedUnit = match.unit_type || detectedUnit;
          perUnit = match.per_unit;
        }
      } catch (e) {
        console.error('Besin verisi arama hatası:', e);
      }
    }

    if (!perUnit) {
      const qtyCalc = Number(food.quantity) > 0 ? Number(food.quantity) : (detectedUnit === 'gram' ? 100 : 1);
      perUnit = {
        calories: (Number(food.calories) || 0) / qtyCalc,
        protein_g: (Number(food.protein_g) || 0) / qtyCalc,
        carbs_g: (Number(food.carbs_g) || 0) / qtyCalc,
        fat_g: (Number(food.fat_g) || 0) / qtyCalc,
        sugar_g: (Number(food.sugar_g) || 0) / qtyCalc
      };
    }

    const qty = Number(food.quantity) > 0 ? Number(food.quantity) : (detectedUnit === 'gram' ? 100 : 1);

    setSelectedFood({
      id: food.food_cache_id || food.fatsecret_food_id || food.id || null,
      name: food.food_name,
      unit_type: detectedUnit,
      per_unit: perUnit
    });
    setFoodName(food.food_name);
    setFoodCacheId(food.food_cache_id || food.fatsecret_food_id || food.id || null);
    setUnitType(detectedUnit);
    setAmount(qty.toString());
    setShowDropdown(false);
  };

  const handleGeminiSearch = async () => {
    if (!searchQuery || !amount) return;
    setSearchStep('gemini_loading');
    setShowDropdown(false);

    try {
      const res = await fetch('/api/food/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food_name: searchQuery, amount: parseFloat(amount), unit: unitType })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI besin araması başarısız oldu.');

      setGeminiResult(data);
      setSelectedFood({
        id: null,
        name: data.food_name,
        unit_type: data.unit_type,
        per_unit: data.per_unit
      });
      setFoodName(data.food_name);
      setFoodCacheId(null);
      setCalories(data.calculated.calories.toString());
      setProtein(data.calculated.protein_g.toString());
      setCarbs(data.calculated.carbs_g.toString());
      setFat(data.calculated.fat_g.toString());
      setSugar(data.calculated.sugar_g.toString());
      setQuantity(amount);
      setServingDescription(`${amount} ${unitType}`);
      setSearchStep('gemini_result');
    } catch (err: any) {
      toast.error(err.message || 'AI besin değeri alınamadı. Manuel giriş yapabilirsiniz.');
      setSearchStep('gemini_form');
    }
  };

  const handleManualSubmit = async () => {
    if (!searchQuery || !manualCalories || !manualProtein || !manualCarbs || !manualFat || !manualSugar) {
      toast.error('Lütfen kalori, karp, protein, yağ ve şeker alanlarını doldurun.');
      return;
    }
    setSearchStep('manual_loading');
    setShowDropdown(false);

    try {
      const res = await fetch('/api/food/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          food_name: searchQuery, 
          brand_name: manualBrand,
          unit_type: unitType,
          calories: manualCalories,
          protein_g: manualProtein,
          carbs_g: manualCarbs,
          fat_g: manualFat,
          sugar_g: manualSugar
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Manuel ekleme hatası');

      setSelectedFood({
        id: data.food.id,
        name: data.food.food_name,
        unit_type: data.food.unit_type,
        per_unit: data.food.per_unit
      });
      setFoodName(data.food.food_name);
      setFoodCacheId(data.food.id);
      
      const qty = parseFloat(amount) || (unitType === 'gram' ? 100 : 1);
      const p = data.food.per_unit;
      setCalories(Math.round(p.calories * qty).toString());
      setProtein((Math.round(p.protein_g * qty * 10) / 10).toString());
      setCarbs((Math.round(p.carbs_g * qty * 10) / 10).toString());
      setFat((Math.round(p.fat_g * qty * 10) / 10).toString());
      setSugar((Math.round((p.sugar_g || 0) * qty * 10) / 10).toString());
      setQuantity(qty.toString());
      setServingDescription(`${qty} ${unitType}`);
      setSearchStep('gemini_result');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Manuel ekleme başarısız oldu.');
      setSearchStep('manual_form');
    }
  };

  const handleLabelImage = async (file: File | undefined) => {
    if (!file) return;
    setIsOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('provider', ocrProvider);
      const res = await fetch('/api/food/ocr', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Etiket okunamadı.');

      const nutrition = data.nutrition;
      const foodName = resolveFoodName(searchQuery, nutrition.food_name);
      setSearchQuery(foodName);
      setManualBrand(nutrition.brand_name || '');
      setManualCalories(String(nutrition.calories));
      setManualProtein(String(nutrition.protein_g));
      setManualCarbs(String(nutrition.carbs_g));
      setManualFat(String(nutrition.fat_g));
      setManualSugar(String(nutrition.sugar_g));
      setUnitType('gram');
      setAmount('100');
      setFoodName(foodName);
      setCalories(String(nutrition.calories));
      setProtein(String(nutrition.protein_g));
      setCarbs(String(nutrition.carbs_g));
      setFat(String(nutrition.fat_g));
      setSugar(String(nutrition.sugar_g));
      setQuantity('100');
      setServingDescription('100 gram');
      setFoodCacheId(null);
      setIsOcrReady(true);
      toast.success(t('forms.foodLabelOcrSuccess'));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Etiket okunamadı.');
    } finally {
      setIsOcrLoading(false);
      if (ocrInputRef.current) ocrInputRef.current.value = '';
    }
  };

  const handleClearSelection = () => {
    setSelectedFood(null);
    setGeminiResult(null);
    setFoodName('');
    setSearchQuery('');
    setFoodCacheId(null);
    setCalories('');
    setProtein('0');
    setCarbs('0');
    setFat('0');
    setSugar('0');
    setManualCalories('');
    setManualProtein('');
    setManualCarbs('');
    setManualFat('');
    setManualSugar('');
    setManualBrand('');
    setIsOcrReady(false);
    setSearchStep('idle');
    setSearchResults([]);
    setShowDropdown(true);
    setTimeout(() => searchRef.current?.focus(), 100);
  };

  const [addedCount, setAddedCount] = useState(0);
  const [sessionAddedMeals, setSessionAddedMeals] = useState<SessionAddedMeal[]>([]);

  const handleSavedRecipeClick = (recipe: Record<string, unknown>) => {
    const id = recipe.id as string;
    if (selectedSavedFoods.includes(id)) {
      setSelectedSavedFoods(selectedSavedFoods.filter(i => i !== id));
    } else {
      setSelectedSavedFoods([...selectedSavedFoods, id]);
    }
  };

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'saved') {
      const countToAdd = selectedSavedFoods.length;
      const ok = await handleMultiSubmit(e);
      if (ok) {
        setAddedCount(prev => prev + countToAdd);
      }
    } else {
      const res = await handleSubmit(e);
      if (res.success) {
        setAddedCount(prev => prev + 1);
        if (res.item) {
          setSessionAddedMeals(prev => [res.item, ...prev]);
        }
        handleClearSelection();
      }
    }
  };

  const handleRemoveSessionMeal = async (item: SessionAddedMeal) => {
    try {
      const res = await deleteMealAction({
        date: new Date().toISOString(),
        entry_id: item.entry_id,
        type: item.type || mealType
      });
      if (res.success) {
        setSessionAddedMeals(prev => prev.filter(i => i.entry_id !== item.entry_id));
        setAddedCount(prev => Math.max(0, prev - 1));
        toast.success(`"${item.food_name}" kaldırıldı`);
        onSuccess();
      } else {
        toast.error(res.error || "Silinirken hata oluştu.");
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const calcNutrients = () => {
    const c = parseFloat(calories) || 0;
    const p = parseFloat(protein) || 0;
    const cb = parseFloat(carbs) || 0;
    const f = parseFloat(fat) || 0;
    const s = parseFloat(sugar) || 0;
    const total = p * 4 + cb * 4 + f * 9;
    return {
      calories: c,
      protein: p,
      carbs: cb,
      fat: f,
      sugar: s,
      proteinPct: total > 0 ? Math.round((p * 4 / total) * 100) : 0,
      carbsPct: total > 0 ? Math.round((cb * 4 / total) * 100) : 0,
      fatPct: total > 0 ? Math.round((f * 9 / total) * 100) : 0
    };
  };

  const nutrients = calcNutrients();

  return (
    <form
      onSubmit={onFormSubmit}
      className="flex flex-col gap-5"
    >
      {/* ── TABS ── */}
      <div className="flex p-1 bg-[rgba(255,255,255,0.04)] rounded-2xl">
        {(['new', 'saved'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
              activeTab === tab
                ? 'bg-[var(--primary)] text-black shadow-sm'
                : 'text-[var(--on-surface-variant)] hover:text-white'
            }`}
          >
            {tab === 'new' ? 'Yeni Öğün' : 'Kaydedilenler'}
          </button>
        ))}
      </div>

      {/* ── ÖĞÜN SEÇİMİ ── */}
      <div className="flex gap-2">
        {MEAL_OPTIONS.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => { setMealType(m.id); setShowDropdown(true); }}
            className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 rounded-2xl text-[11px] font-semibold transition-all ${
              mealType === m.id
                ? 'bg-[rgba(255,255,255,0.12)] text-white ring-1 ring-[rgba(255,255,255,0.2)]'
                : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'
            }`}
          >
            <span className="text-base">{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'new' ? (
        <div className="flex flex-col gap-4">

          {/* ── BU OTURUMDA EKLENEN ÖĞÜNLER LİSTESİ ── */}
          {sessionAddedMeals.length > 0 && (
            <div className="flex flex-col gap-2 p-3.5 bg-[rgba(74,222,128,0.06)] border border-[rgba(74,222,128,0.2)] rounded-2xl animate-fade-in">
              <div className="flex items-center justify-between px-1">
                <span className="text-[12px] font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={15} /> Bu Oturumda Eklenenler ({sessionAddedMeals.length})
                </span>
                <span className="text-[12px] font-bold text-emerald-300">
                  Toplam: {sessionAddedMeals.reduce((sum, item) => sum + item.calories, 0)} kcal
                </span>
              </div>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                {sessionAddedMeals.map((item) => (
                  <div key={item.entry_id} className="flex items-center justify-between p-2.5 bg-[#161622] rounded-xl border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] transition-colors">
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-[13px] font-semibold text-white truncate">{item.food_name}</span>
                      <span className="text-[11px] text-[var(--on-surface-variant)] mt-0.5">
                        {item.serving_description || `${item.quantity} ${item.unit_type}`} — <strong className="text-emerald-400">{item.calories} kcal</strong> (P:{item.protein_g}g, K:{item.carbs_g}g, Y:{item.fat_g}g)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSessionMeal(item)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/15 rounded-lg transition-colors shrink-0"
                      title="Öğünlerden Çıkar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ARAMA ALANI ── */}
          {!selectedFood ? (
            <div className="flex flex-col gap-2 relative">
              {/* Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {searchStep === 'searching' || searchStep === 'gemini_loading'
                    ? <Loader2 className="text-[var(--primary)] animate-spin" size={20} />
                    : <Search className="text-[var(--primary)]" size={20} />
                  }
                </div>
                <input
                  ref={searchRef}
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setSelectedFood(null); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Türkçe yemek arayın (Örn: Bulgur, Tavuk...)"
                  className="w-full bg-[#16161F] border-2 border-[rgba(255,255,255,0.06)] rounded-2xl py-4 pl-12 pr-4 text-[15px] font-medium text-white focus:outline-none focus:border-[var(--primary)] focus:shadow-[0_0_20px_rgba(var(--primary-rgb),0.12)] transition-all placeholder:text-[var(--on-surface-variant)] placeholder:font-normal"
                />
              </div>

              {/* Dropdown */}
              {showDropdown && (
                <div className="w-full bg-[#1A1A26] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden shadow-2xl max-h-72 overflow-y-auto">
                  {searchStep === 'searching' ? (
                    <div className="p-8 flex items-center justify-center gap-3 text-[var(--on-surface-variant)]">
                      <Loader2 size={18} className="animate-spin" />
                      <span className="text-sm">Aranıyor...</span>
                    </div>
                  ) : searchQuery.length >= 2 && searchResults.length > 0 ? (
                    <>
                      {/* DB Sonuçları */}
                      <div className="p-2.5 pb-1 text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider font-semibold px-4">
                        Veritabanı Sonuçları
                      </div>
                      {searchResults.map(food => (
                        <div
                          key={food.id}
                          onMouseDown={(e) => { e.preventDefault(); handleSelectFromDB(food); }}
                          className="px-4 py-3 hover:bg-[rgba(255,255,255,0.06)] cursor-pointer border-b border-[rgba(255,255,255,0.04)] last:border-0 transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="flex flex-col min-w-0">
                            <div className="text-[13px] font-semibold text-white truncate">
                              {food.food_name}
                              {food.brand_name && <span className="text-[var(--primary)] ml-1.5 font-normal text-[11px]">({food.brand_name})</span>}
                            </div>
                            <div className="text-[11px] text-[var(--on-surface-variant)] mt-0.5">
                              {food.unit_type === 'gram' ? '100g' : '1 adet'} — {Math.round((food.per_unit?.calories || 0) * (food.unit_type === 'gram' ? 100 : 1))} kcal
                            </div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ background: 'rgba(96,165,250,0.15)', color: MACRO_COLORS.carbs }}>K{Math.round((food.per_unit?.carbs_g || 0) * (food.unit_type === 'gram' ? 100 : 1))}g</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ background: 'rgba(74,222,128,0.15)', color: MACRO_COLORS.protein }}>P{Math.round((food.per_unit?.protein_g || 0) * (food.unit_type === 'gram' ? 100 : 1))}g</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ background: 'rgba(250,204,21,0.15)', color: MACRO_COLORS.fat }}>Y{Math.round((food.per_unit?.fat_g || 0) * (food.unit_type === 'gram' ? 100 : 1))}g</span>
                          </div>
                        </div>
                      ))}
                      {/* AI ile ara butonu */}
                      <div className="flex border-t border-[rgba(255,255,255,0.05)]">
                        <div
                          onMouseDown={(e) => { e.preventDefault(); setSearchStep('gemini_form'); setShowDropdown(false); }}
                          className="flex-1 px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-[rgba(139,92,246,0.08)] transition-colors border-r border-[rgba(255,255,255,0.05)]"
                        >
                          <Sparkles size={16} className="text-purple-400 shrink-0" />
                          <span className="text-[12px] text-purple-300 font-medium">AI ile Bul</span>
                        </div>
                        <div
                          onMouseDown={(e) => { e.preventDefault(); setSearchStep('manual_form'); setShowDropdown(false); }}
                          className="flex-1 px-4 py-3 flex items-center justify-center gap-2 cursor-pointer hover:bg-[rgba(255,255,255,0.08)] transition-colors text-[var(--on-surface-variant)]"
                        >
                          <span className="text-[16px] shrink-0">✍️</span>
                          <span className="text-[12px] font-medium">Manuel Ekle</span>
                        </div>
                      </div>
                    </>
                  ) : searchQuery.length >= 2 ? (
                    <>
                      <div className="px-4 py-4 text-center text-[13px] text-[var(--on-surface-variant)]">
                        "{searchQuery}" bulunamadı.
                      </div>
                      <div className="flex border-t border-[rgba(255,255,255,0.05)]">
                        <div
                          onMouseDown={(e) => { e.preventDefault(); setSearchStep('gemini_form'); setShowDropdown(false); }}
                          className="flex-1 px-4 py-3 flex items-center justify-center gap-2 cursor-pointer hover:bg-[rgba(139,92,246,0.08)] transition-colors border-r border-[rgba(255,255,255,0.05)]"
                        >
                          <Sparkles size={16} className="text-purple-400 shrink-0" />
                          <span className="text-[12px] text-purple-300 font-medium">AI ile Bul</span>
                        </div>
                        <div
                          onMouseDown={(e) => { e.preventDefault(); setSearchStep('manual_form'); setShowDropdown(false); }}
                          className="flex-1 px-4 py-3 flex items-center justify-center gap-2 cursor-pointer hover:bg-[rgba(255,255,255,0.08)] transition-colors text-[var(--on-surface-variant)]"
                        >
                          <span className="text-[16px] shrink-0">✍️</span>
                          <span className="text-[12px] font-medium">Manuel Ekle</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Son Yemekler */
                    <div className="flex flex-col">
                      <div className="px-4 py-2 text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider font-semibold bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.05)]">
                        Son Eklenenler
                      </div>
                      {(() => {
                        const recent = (recentByType?.[mealType] || []).filter((f: any) => f.food_name?.trim());
                        const favs = (savedFoods || []).filter((f: any) => f.food_name?.trim());
                        const combined = [...recent, ...favs];
                        const unique = Array.from(new Map(combined.map((f: any) => [f.food_name.toLowerCase(), f])).values()).slice(0, 8);

                        if (unique.length === 0) {
                          return <div className="px-4 py-6 text-center text-[13px] text-[var(--on-surface-variant)]">Henüz eklenen yemek yok</div>;
                        }
                        return unique.map((f: any, idx: number) => (
                          <div
                            key={idx}
                            onMouseDown={(e) => { e.preventDefault(); handleSelectRecent(f); }}
                            className="px-4 py-3 hover:bg-[rgba(255,255,255,0.05)] cursor-pointer border-b border-[rgba(255,255,255,0.04)] last:border-0 transition-colors flex items-center justify-between"
                          >
                            <div className="flex flex-col">
                              <span className="text-[13px] font-medium text-white">{f.food_name}</span>
                              <span className="text-[11px] text-[var(--on-surface-variant)]">{f.serving_description || `${f.quantity}g`}</span>
                            </div>
                            <span className="text-[13px] font-semibold text-[var(--primary)]">{f.calories} kcal</span>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* AI Ekleme Formu */}
              {searchStep === 'gemini_form' && (
                <div className="flex flex-col gap-3 p-4 bg-[rgba(139,92,246,0.05)] border border-[rgba(139,92,246,0.2)] rounded-2xl animate-fade-in">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={16} className="text-purple-400" />
                    <span className="text-[13px] font-semibold text-purple-200">AI ile Besin Değeri Bul</span>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      readOnly
                      className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl py-2 px-3 text-sm text-[var(--on-surface-variant)] focus:outline-none cursor-not-allowed"
                    />
                    <div className="flex gap-2">
                      <select
                        value={unitType}
                        onChange={(e) => setUnitType(e.target.value as any)}
                        className="flex-1 bg-[#1A1A26] border border-[rgba(255,255,255,0.1)] rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-all cursor-pointer"
                      >
                        {['gram', 'adet', 'kase', 'bardak', 'tabak', 'çay kaşığı', 'tatlı kaşığı', 'çorba kaşığı', 'yemek kaşığı'].map(u => (
                          <option key={u} value={u} className="bg-[#1A1A26]">{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGeminiSearch}
                    className="w-full mt-2 py-2.5 bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} /> AI ile Hesapla
                  </button>
                </div>
              )}

              {/* Manuel Ekleme Formu */}
              {searchStep === 'manual_form' && (
                <div className="flex flex-col gap-3 p-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-2xl animate-fade-in">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[16px]">✍️</span>
                    <span className="text-[13px] font-semibold text-white">Yemeği Manuel Olarak Ekle</span>
                  </div>

                  <input
                    ref={ocrInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    capture="environment"
                    className="hidden"
                    onChange={(event) => handleLabelImage(event.target.files?.[0])}
                  />
                  <select
                    value={ocrProvider}
                    onChange={(event) => setOcrProvider(event.target.value as 'gemini' | 'mistral')}
                    disabled={isOcrLoading}
                    className="min-h-[44px] w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#1A1A26] px-3 text-sm text-white disabled:opacity-60"
                    aria-label="OCR sağlayıcısı"
                  >
                    <option value="gemini">Gemini Vision (Önerilen)</option>
                    <option value="mistral">Mistral OCR</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => ocrInputRef.current?.click()}
                    disabled={isOcrLoading}
                    className="min-h-[48px] w-full rounded-xl border border-[rgba(142,193,59,0.35)] bg-[rgba(142,193,59,0.08)] px-3 py-2.5 text-sm font-semibold text-[var(--primary)] transition-colors hover:bg-[rgba(142,193,59,0.14)] disabled:cursor-wait disabled:opacity-60 flex items-center justify-center gap-2"
                    aria-label={t('forms.foodLabelOcr')}
                  >
                    {isOcrLoading ? <Loader2 size={17} className="animate-spin" /> : <Camera size={17} />}
                    {isOcrLoading ? t('forms.foodLabelOcrReading') : `${ocrProvider === 'gemini' ? 'Gemini Vision' : 'Mistral OCR'} ile oku`}
                  </button>
                  <span className="text-center text-[11px] text-[var(--on-surface-variant)]">{t('forms.foodLabelOcrHint')}</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      readOnly
                      className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl py-2 px-3 text-sm text-[var(--on-surface-variant)] focus:outline-none cursor-not-allowed"
                    />
                    <input
                      type="text"
                      value={manualBrand}
                      onChange={e => setManualBrand(e.target.value)}
                      placeholder="Marka (İsteğe bağlı)"
                      className="bg-[#1A1A26] border border-[rgba(255,255,255,0.1)] rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-[var(--primary)] transition-all"
                    />
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={unitType}
                      onChange={(e) => setUnitType(e.target.value as any)}
                      className="flex-1 bg-[#1A1A26] border border-[rgba(255,255,255,0.1)] rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
                    >
                      {['gram', 'adet', 'kase', 'bardak', 'tabak', 'çay kaşığı', 'tatlı kaşığı', 'çorba kaşığı', 'yemek kaşığı'].map(u => (
                        <option key={u} value={u} className="bg-[#1A1A26]">{u}</option>
                      ))}
                    </select>
                    <div className="py-2 px-3 text-xs text-[var(--on-surface-variant)] flex items-center bg-[rgba(255,255,255,0.03)] rounded-xl border border-[rgba(255,255,255,0.05)]">
                      Değerleri {unitType === 'gram' ? '100g' : `1 ${unitType}`} için girin
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-1">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-orange-400 font-semibold pl-1">Kalori</label>
                      <input type="number" min="0" step="0.1" value={manualCalories} onChange={e => { setManualCalories(e.target.value); if (isOcrReady) setCalories(e.target.value); }} placeholder="0" className="w-full bg-[#1A1A26] border border-orange-500/30 rounded-xl py-2 px-2 text-sm text-white focus:outline-none focus:border-orange-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-blue-400 font-semibold pl-1">Karb (g)</label>
                      <input type="number" min="0" step="0.1" value={manualCarbs} onChange={e => { setManualCarbs(e.target.value); if (isOcrReady) setCarbs(e.target.value); }} placeholder="0" className="w-full bg-[#1A1A26] border border-blue-500/30 rounded-xl py-2 px-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-green-400 font-semibold pl-1">Protein (g)</label>
                      <input type="number" min="0" step="0.1" value={manualProtein} onChange={e => { setManualProtein(e.target.value); if (isOcrReady) setProtein(e.target.value); }} placeholder="0" className="w-full bg-[#1A1A26] border border-green-500/30 rounded-xl py-2 px-2 text-sm text-white focus:outline-none focus:border-green-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-yellow-400 font-semibold pl-1">Yağ (g)</label>
                      <input type="number" min="0" step="0.1" value={manualFat} onChange={e => { setManualFat(e.target.value); if (isOcrReady) setFat(e.target.value); }} placeholder="0" className="w-full bg-[#1A1A26] border border-yellow-500/30 rounded-xl py-2 px-2 text-sm text-white focus:outline-none focus:border-yellow-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-pink-400 font-semibold pl-1">Şeker (g)</label>
                      <input type="number" min="0" step="0.1" value={manualSugar} onChange={e => { setManualSugar(e.target.value); if (isOcrReady) setSugar(e.target.value); }} placeholder="0" className="w-full bg-[#1A1A26] border border-pink-500/30 rounded-xl py-2 px-2 text-sm text-white focus:outline-none focus:border-pink-500" />
                    </div>
                  </div>

                  {!isOcrReady ? (
                    <button
                      type="button"
                      onClick={handleManualSubmit}
                      disabled={!manualCalories || !manualProtein || !manualCarbs || !manualFat || !manualSugar}
                      className="w-full mt-2 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Veritabanına Kaydet ve Seç
                    </button>
                  ) : (
                    <div className="mt-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-xs text-emerald-300">
                      Değerleri kontrol et. Kaydetmek için aşağıdaki “Öğüne Ekle” düğmesine bas.
                    </div>
                  )}
                </div>
              )}

              {/* Yükleniyor (Manuel/Gemini) */}
              {(searchStep === 'gemini_loading' || searchStep === 'manual_loading') && (
                <div className="flex flex-col items-center gap-3 py-6 animate-fade-in">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${searchStep === 'gemini_loading' ? 'bg-[rgba(139,92,246,0.15)]' : 'bg-[rgba(var(--primary-rgb),0.15)]'}`}>
                    {searchStep === 'gemini_loading' ? <Sparkles size={18} className="text-purple-400 animate-pulse" /> : <Loader2 size={18} className="text-[var(--primary)] animate-spin" />}
                  </div>
                  <span className={`text-[13px] animate-pulse ${searchStep === 'gemini_loading' ? 'text-purple-300' : 'text-[var(--primary)]'}`}>
                    {searchStep === 'gemini_loading' ? 'AI besin değerlerini hesaplıyor...' : 'Veritabanına kaydediliyor...'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* ── SEÇİLEN YEMEK + MİKTAR ── */
            <div className="flex flex-col gap-4 animate-fade-in">
              {/* Seçilen yemek başlığı */}
              <div className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.04)] rounded-2xl border border-[rgba(255,255,255,0.08)]">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-white truncate">{selectedFood.name}</div>
                  <div className="text-[11px] text-[var(--primary)] mt-0.5">
                    {geminiResult ? `AI tahmini${geminiResult.provider ? `: ${geminiResult.provider}` : ''}. Değerleri kontrol edin.` : 'Veritabanından'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="w-7 h-7 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.12)] transition-colors text-[var(--on-surface-variant)]"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Miktar + Birim */}
              <div className="flex gap-2 items-end">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider font-semibold">
                    {selectedFood.unit_type === 'gram' ? 'Miktar (gram)' : 'Adet'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.04)] border-2 border-[rgba(255,255,255,0.08)] rounded-xl py-3.5 px-4 text-[16px] font-bold text-white focus:outline-none focus:border-[var(--primary)] transition-all"
                  />
                </div>
                <div className="py-3.5 px-4 bg-[rgba(255,255,255,0.04)] border-2 border-[rgba(255,255,255,0.08)] rounded-xl text-[13px] text-[var(--on-surface-variant)] font-medium min-w-[64px] text-center">
                  {selectedFood.unit_type}
                </div>
              </div>

              {/* Makro Önizleme */}
              {parseFloat(calories) > 0 && (
                <div className="p-4 bg-[rgba(255,255,255,0.03)] rounded-2xl border border-[rgba(255,255,255,0.06)] animate-fade-in">
                  {/* Kalori büyük gösterim */}
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-[28px] font-bold text-white">{nutrients.calories}</span>
                    <span className="text-[13px] text-[var(--on-surface-variant)]">kcal</span>
                  </div>

                  {/* Makro bar */}
                  <div className="flex rounded-full overflow-hidden h-2 mb-3 gap-0.5">
                    {nutrients.carbsPct > 0 && (
                      <div style={{ width: `${nutrients.carbsPct}%`, background: MACRO_COLORS.carbs }} className="rounded-full" />
                    )}
                    {nutrients.proteinPct > 0 && (
                      <div style={{ width: `${nutrients.proteinPct}%`, background: MACRO_COLORS.protein }} className="rounded-full" />
                    )}
                    {nutrients.fatPct > 0 && (
                      <div style={{ width: `${nutrients.fatPct}%`, background: MACRO_COLORS.fat }} className="rounded-full" />
                    )}
                  </div>

                  {/* Makro değerler */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: 'Karb', value: nutrients.carbs, pct: nutrients.carbsPct, color: MACRO_COLORS.carbs, bg: 'rgba(96,165,250,0.1)' },
                      { label: 'Protein', value: nutrients.protein, pct: nutrients.proteinPct, color: MACRO_COLORS.protein, bg: 'rgba(74,222,128,0.1)' },
                      { label: 'Yağ', value: nutrients.fat, pct: nutrients.fatPct, color: MACRO_COLORS.fat, bg: 'rgba(250,204,21,0.1)' },
                      { label: 'Şeker', value: nutrients.sugar, pct: 0, color: MACRO_COLORS.sugar, bg: 'rgba(244,114,182,0.1)' }
                    ].map(m => (
                      <div key={m.label} className="flex flex-col items-center py-2 rounded-xl" style={{ background: m.bg }}>
                        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: m.color }}>{m.label}</span>
                        <span className="text-[15px] font-bold text-white mt-0.5">{m.value}g</span>
                        <span className="text-[10px]" style={{ color: m.color }}>%{m.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Favorilere kaydet */}
              <button
                type="button"
                onClick={() => setSaveAsRecipe(!saveAsRecipe)}
                className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl transition-all text-[13px] font-medium border ${
                  saveAsRecipe
                    ? 'bg-[rgba(var(--primary-rgb),0.12)] border-[var(--primary)] text-[var(--primary)]'
                    : 'bg-transparent border-[rgba(255,255,255,0.08)] text-[var(--on-surface-variant)] hover:border-[rgba(255,255,255,0.15)] hover:text-white'
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${saveAsRecipe ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[rgba(255,255,255,0.3)]'}`}>
                  {saveAsRecipe && <Check size={10} className="text-black" />}
                </div>
                Favorilerime ekle
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── KAYDEDİLENLER SEKMESI ── */
        <div className="flex flex-col gap-2.5">
          {isLoadingSaved ? (
            <div className="flex justify-center py-6"><LoadingSpinner size="sm" /></div>
          ) : savedFoods.length > 0 ? (
            savedFoods.map((recipe: Record<string, unknown>) => {
              const isSelected = selectedSavedFoods.includes(recipe.id as string);
              return (
                <div
                  key={recipe.id as string}
                  onClick={() => handleSavedRecipeClick(recipe)}
                  className={`p-3.5 flex items-center justify-between rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-[rgba(var(--primary-rgb),0.12)] border-[var(--primary)]'
                      : 'bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.05)] border-transparent hover:border-[rgba(255,255,255,0.08)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[rgba(255,255,255,0.2)]'}`}>
                      {isSelected && <Check size={12} className="text-black" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-white">{recipe.food_name as string}</span>
                      <span className="text-[11px] text-[var(--on-surface-variant)]">{recipe.serving_description as string || `${recipe.quantity}g`}</span>
                    </div>
                  </div>
                  <span className="text-[14px] font-bold text-[var(--primary)]">{recipe.calories as number} kcal</span>
                </div>
              );
            })
          ) : (
            <div className="text-center text-[13px] text-[var(--on-surface-variant)] py-8">
              <div className="text-3xl mb-2">🥗</div>
              Henüz kaydedilmiş yemeğiniz yok.
              <br />Yeni öğün eklerken "Favorilerime ekle" seçeneğini işaretleyebilirsiniz.
            </div>
          )}
        </div>
      )}

      {/* ── AKSIYONLAR ── */}
      <div className="flex gap-3 mt-1">
        <button
          type="button"
          onClick={onClose}
          className={`flex-1 py-3.5 rounded-2xl text-[13px] font-semibold transition-all ${
            addedCount > 0
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.09)] text-white'
          }`}
        >
          {addedCount > 0 ? `Tamam (${addedCount} eklendi)` : 'İptal'}
        </button>
        <button
          type="submit"
          disabled={
            isLoading
            || (activeTab === 'new' && ((!selectedFood && !isOcrReady) || !calories))
            || (activeTab === 'saved' && selectedSavedFoods.length === 0)
          }
          className="flex-[2] py-3.5 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black text-[13px] font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading
            ? <LoadingSpinner size="sm" />
            : activeTab === 'saved'
              ? `Seçilenleri Ekle (${selectedSavedFoods.length})`
              : 'Öğüne Ekle'
          }
        </button>
      </div>
    </form>
  );
}
