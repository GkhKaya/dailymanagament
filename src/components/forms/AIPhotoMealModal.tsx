"use client";

import React, { useState, useRef } from "react";
import { Camera, Sparkles, Upload, Check, Trash2, RefreshCw, X, Database, Bot, Home, Utensils, Leaf, Flame } from "lucide-react";
import { addMealsAction } from "@/actions/health";
import toast from "react-hot-toast";
import { useTranslation } from "@/hooks/useTranslation";

interface AnalyzedItem {
  id: string;
  food_name: string;
  food_name_en: string;
  amount: number;
  unit_type: string;
  description: string;
  matched_in_db: boolean;
  food_cache_id?: string;
  selected: boolean;
  per_unit: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    sugar_g: number;
  };
  calculated: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    sugar_g: number;
  };
}

interface AIPhotoMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentDate?: string;
  initialMealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export function AIPhotoMealModal({
  isOpen,
  onClose,
  onSuccess,
  currentDate,
  initialMealType = 'lunch',
}: AIPhotoMealModalProps) {
  const { locale, isAbroad } = useTranslation();
  const isEn = isAbroad || locale === 'en';

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>(initialMealType);
  const [mealName, setMealName] = useState("");
  const [userDirective, setUserDirective] = useState("");
  const [items, setItems] = useState<AnalyzedItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(isEn ? 'Please select a valid image file.' : 'Lütfen geçerli bir resim dosyası seçin.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      analyzePhoto(base64, userDirective);
    };
    reader.readAsDataURL(file);
  };

  const analyzePhoto = async (base64Image: string, customDirective?: string) => {
    setIsAnalyzing(true);
    setItems([]);

    const directiveToUse = customDirective !== undefined ? customDirective : userDirective;

    try {
      const res = await fetch('/api/food/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          userDirective: directiveToUse,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || (isEn ? 'Failed to analyze photo.' : 'Fotoğraf analiz edilemedi.'));
      }

      setMealName(data.meal_name || (isEn ? 'Meal Photo' : 'Görsel Yemek'));
      
      const processed: AnalyzedItem[] = (data.items || []).map((item: any) => ({
        ...item,
        selected: true,
      }));

      setItems(processed);
      toast.success(directiveToUse 
        ? (isEn ? 'AI analysis updated with your note!' : 'Notunuza göre AI analizi güncellendi!') 
        : (isEn ? 'Food detected with AI!' : 'Yemek AI ile tespit edildi!'));
    } catch (err: any) {
      toast.error(err.message || (isEn ? 'An error occurred during analysis.' : 'Analiz sırasında hata oluştu.'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAmountChange = (id: string, newAmount: number) => {
    const amount = Math.max(1, newAmount);
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      const calculated = {
        calories: Math.round(item.per_unit.calories * amount),
        protein_g: Math.round(item.per_unit.protein_g * amount * 10) / 10,
        carbs_g: Math.round(item.per_unit.carbs_g * amount * 10) / 10,
        fat_g: Math.round(item.per_unit.fat_g * amount * 10) / 10,
        sugar_g: Math.round(item.per_unit.sugar_g * amount * 10) / 10,
      };

      return {
        ...item,
        amount,
        calculated,
      };
    }));
  };

  const toggleSelect = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Grand totals for selected items
  const totals = items
    .filter(i => i.selected)
    .reduce(
      (acc, item) => ({
        calories: acc.calories + item.calculated.calories,
        protein_g: Math.round((acc.protein_g + item.calculated.protein_g) * 10) / 10,
        carbs_g: Math.round((acc.carbs_g + item.calculated.carbs_g) * 10) / 10,
        fat_g: Math.round((acc.fat_g + item.calculated.fat_g) * 10) / 10,
        sugar_g: Math.round((acc.sugar_g + item.calculated.sugar_g) * 10) / 10,
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, sugar_g: 0 }
    );

  const handleSaveMeal = async () => {
    const selectedItems = items.filter(i => i.selected);
    if (selectedItems.length === 0) {
      toast.error(isEn ? 'Please select at least one food item to add.' : 'Lütfen eklemek istediğiniz en az bir besini seçin.');
      return;
    }

    setIsSaving(true);
    const dateStr = currentDate || new Date().toISOString().slice(0, 10);

    const payload = selectedItems.map(item => ({
      date: dateStr,
      type: mealType,
      food_name: (isEn && item.food_name_en) ? item.food_name_en : item.food_name,
      serving_description: `${item.amount} ${item.unit_type}`,
      quantity: item.amount,
      unit_type: item.unit_type,
      calories: item.calculated.calories,
      protein_g: item.calculated.protein_g,
      carbs_g: item.calculated.carbs_g,
      fat_g: item.calculated.fat_g,
      sugar_g: item.calculated.sugar_g,
      food_cache_id: item.food_cache_id,
    }));

    try {
      const res = await addMealsAction(payload);
      if (res.success) {
        toast.success(isEn 
          ? `Added ${selectedItems.length} food items to your meal with AI!` 
          : `AI ile ${selectedItems.length} besin öğüne eklendi!`);
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || (isEn ? 'Failed to add meal.' : 'Öğün eklenemedi.'));
      }
    } catch (err: any) {
      toast.error(err.message || (isEn ? 'Meal recording failed.' : 'Öğün kaydı başarısız.'));
    } finally {
      setIsSaving(false);
    }
  };

  const resetAll = () => {
    setImagePreview(null);
    setItems([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/70 animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#12121c] rounded-3xl border border-[rgba(255,255,255,0.1)] shadow-[0_12px_48px_rgba(0,0,0,0.7)] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] bg-black/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {isEn ? 'AI Food Photo Analysis' : 'Fotoğraf ile AI Besin Analizi'}
              </h2>
              <p className="text-xs text-[var(--on-surface-variant)]">
                {isEn ? 'Take or upload a photo, AI segments items and estimates nutrition' : 'Fotoğraf çekin veya yükleyin, AI parçalara ayırıp eklesin'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-5">
          
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* User Directive / Note Input */}
          <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-black/30 border border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>{isEn ? 'SPECIAL NOTE / DIRECTIVE FOR AI (OPTIONAL)' : 'AI İÇİN ÖZEL NOT / DİREKTİF (OPSİYONEL)'}</span>
              </label>
              {userDirective && (
                <button
                  type="button"
                  onClick={() => setUserDirective("")}
                  className="text-[10px] text-white/40 hover:text-white"
                >
                  {isEn ? 'Clear' : 'Temizle'}
                </button>
              )}
            </div>
            
            <input
              type="text"
              value={userDirective}
              onChange={(e) => setUserDirective(e.target.value)}
              placeholder={isEn 
                ? "e.g. Home cooked (slightly higher fat), diet/low fat, restaurant style..." 
                : "Örn: Anne yemeği (yağı bir tık fazla hesaplasın), ev usulü, diyet/az yağlı, restoran yemeği..."}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500 transition-all"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: isEn ? 'Home Cooking / Homemade' : 'Anne Yemeği / Ev Yapımı', text: isEn ? 'homemade home cooking' : 'anne yemeği ev yapımı', icon: Home },
                { label: isEn ? 'Restaurant Meal' : 'Restoran Yemeği', text: isEn ? 'restaurant meal dining out' : 'restoran yemeği dışarıda', icon: Utensils },
                { label: isEn ? 'Low Fat / Diet' : 'Az Yağlı / Diyet', text: isEn ? 'low fat diet meal' : 'az yağlı diyet yemeği', icon: Leaf },
                { label: isEn ? 'Rich in Butter / High Fat' : 'Bol Tereyağlı', text: isEn ? 'high butter rich in fat' : 'bol tereyağlı yağlı', icon: Flame },
              ].map(preset => {
                const Icon = preset.icon;
                const isActive = userDirective.toLowerCase().includes(preset.text.split(' ')[0]);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      const newDirective = isActive ? '' : preset.text;
                      setUserDirective(newDirective);
                      if (imagePreview && !isAnalyzing) {
                        analyzePhoto(imagePreview, newDirective);
                      }
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-200 font-semibold'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={12} className={isActive ? 'text-purple-300' : 'text-white/60'} />
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {!imagePreview ? (
            /* Upload / Camera Dropzone */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[rgba(255,255,255,0.15)] hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Camera size={32} />
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <span className="text-base font-semibold text-white">
                  {isEn ? 'Upload or Take a Meal Photo' : 'Yemek Fotoğrafı Yükleyin veya Çekin'}
                </span>
                <span className="text-xs text-[var(--on-surface-variant)] max-w-sm">
                  {isEn 
                    ? 'Take a photo of your plate. AI will detect foods and estimate portions.' 
                    : 'Kameranızla tabağınızın fotoğrafını çekin. Yapay zeka yiyecekleri tespit edip gramaj tahmini yapacaktır.'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button type="button" className="px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold flex items-center gap-2 hover:bg-emerald-400 transition-colors shadow-md">
                  <Camera size={16} /> {isEn ? 'Take / Select Photo' : 'Fotoğraf Çek / Seç'}
                </button>
              </div>
            </div>
          ) : (
            /* Photo Uploaded Area */
            <div className="flex flex-col gap-4">
              <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-white/10 bg-black/40 group">
                <img
                  src={imagePreview}
                  alt="Meal Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-4">
                  <span className="text-sm font-bold text-white truncate max-w-[50%]">{mealName}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => analyzePhoto(imagePreview, userDirective)}
                      disabled={isAnalyzing}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/50 backdrop-blur-md text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-500/40"
                      title={isEn ? "Re-analyze with your new directive" : "Yeni direktifinizle yeniden analiz edin"}
                    >
                      <Sparkles size={13} className="animate-pulse" /> {isEn ? 'Re-analyze' : 'Yeniden Analiz'}
                    </button>
                    <button
                      type="button"
                      onClick={resetAll}
                      className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/90 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10"
                    >
                      <RefreshCw size={13} /> {isEn ? 'Change' : 'Değiştir'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Analyzing Spinner State */}
              {isAnalyzing && (
                <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center gap-3 text-center border border-emerald-500/20 bg-emerald-500/5 animate-pulse">
                  <div className="relative flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
                    <Sparkles size={18} className="absolute text-emerald-400" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-white">
                      {isEn ? 'Analyzing Meal Photo...' : 'Yemek Fotoğrafı Analiz Ediliyor...'}
                    </span>
                    <span className="text-xs text-[var(--on-surface-variant)]">
                      {isEn 
                        ? 'Segmenting food items, estimating portions & matching database.' 
                        : 'Yiyecekler parçalara ayrılıyor, gramajlar tahmin ediliyor & veritabanı eşleştiriliyor.'}
                    </span>
                  </div>
                </div>
              )}

              {/* Results Review & Edit */}
              {!isAnalyzing && items.length > 0 && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  
                  {/* Meal Category Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-wider">
                      {isEn ? 'Meal Category' : 'Öğün Kategorisi'}
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 p-1 bg-black/30 rounded-2xl border border-white/5">
                      {[
                        { key: 'breakfast', label: isEn ? 'Breakfast' : 'Kahvaltı' },
                        { key: 'lunch', label: isEn ? 'Lunch' : 'Öğle' },
                        { key: 'dinner', label: isEn ? 'Dinner' : 'Akşam' },
                        { key: 'snack', label: isEn ? 'Snack' : 'Atıştırmalık' },
                      ].map(cat => (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => setMealType(cat.key as any)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all ${
                            mealType === cat.key
                              ? 'bg-emerald-500 text-black shadow-sm'
                              : 'text-[var(--on-surface-variant)] hover:text-white'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Component Checklist */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                        {isEn ? 'Detected Foods' : 'Tespit Edilen Besinler'} ({items.filter(i => i.selected).length}/{items.length})
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 max-h-[35vh] overflow-y-auto pr-1">
                      {items.map(item => (
                        <div
                          key={item.id}
                          className={`glass-card p-3 rounded-2xl border transition-all flex flex-col gap-2 ${
                            item.selected
                              ? 'border-emerald-500/30 bg-emerald-500/5'
                              : 'border-white/5 opacity-50 bg-black/20'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={() => toggleSelect(item.id)}
                                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                              />
                              <span className="text-sm font-bold text-white truncate">
                                {(isEn && item.food_name_en) ? item.food_name_en : item.food_name}
                              </span>
                              {item.matched_in_db ? (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/20 shrink-0">
                                  <Database size={10} /> {isEn ? 'DB Matched' : 'DB Eşleşti'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/20 shrink-0">
                                  <Bot size={10} /> {isEn ? 'AI Estimate' : 'AI Tahmini'}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="p-1 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          {/* Controls & Macros */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pl-6 pt-1 border-t border-white/5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[var(--on-surface-variant)]">{isEn ? 'Amount:' : 'Miktar:'}</span>
                              <input
                                type="number"
                                min="1"
                                value={item.amount}
                                onChange={(e) => handleAmountChange(item.id, Number(e.target.value))}
                                className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-bold text-center focus:outline-none focus:border-emerald-500"
                              />
                              <span className="text-xs text-white/80 font-medium">{item.unit_type}</span>
                            </div>

                            {/* Item Macros */}
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-emerald-400">{item.calculated.calories} kcal</span>
                              <span className="text-blue-400">P:{item.calculated.protein_g}g</span>
                              <span className="text-[#8ec13b]">{isEn ? 'C' : 'K'}:{item.calculated.carbs_g}g</span>
                              <span className="text-amber-400">{isEn ? 'F' : 'Y'}:{item.calculated.fat_g}g</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total Summary Bar */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-wider">
                        {isEn ? 'Total Selected Nutrition' : 'Seçilen Toplam Besin Değeri'}
                      </span>
                      <span className="text-base font-extrabold text-emerald-400">{totals.calories} kcal</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5 text-white/80 font-medium">
                      <span>{isEn ? 'Carbs:' : 'Karbonhidrat:'} <strong className="text-[#8ec13b]">{totals.carbs_g}g</strong></span>
                      <span>{isEn ? 'Protein:' : 'Protein:'} <strong className="text-blue-400">{totals.protein_g}g</strong></span>
                      <span>{isEn ? 'Fat:' : 'Yağ:'} <strong className="text-amber-400">{totals.fat_g}g</strong></span>
                      <span>{isEn ? 'Sugar:' : 'Şeker:'} <strong className="text-pink-300">{totals.sugar_g}g</strong></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 flex items-center justify-end gap-3 border-t border-[rgba(255,255,255,0.08)] bg-black/30 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-white/80 hover:text-white text-xs font-semibold hover:bg-white/5 transition-colors"
          >
            {isEn ? 'Cancel' : 'İptal'}
          </button>
          {imagePreview && items.length > 0 && !isAnalyzing && (
            <button
              type="button"
              disabled={isSaving || items.filter(i => i.selected).length === 0}
              onClick={handleSaveMeal}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={16} /> {isSaving ? (isEn ? 'Saving...' : 'Kaydediliyor...') : (isEn ? 'Add Meal to Diary' : 'Öğünü Günlüğe Ekle')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
