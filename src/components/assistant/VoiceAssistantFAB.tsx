"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mic,
  Loader2,
  X,
  Trash2,
  Plus,
  RefreshCw,
  Check,
  Sunrise,
  Sun,
  Moon,
  Apple,
  Utensils,
  Wallet,
  Send,
  AlertCircle,
  Sparkles,
  Database,
  Search
} from 'lucide-react';
import {
  confirmAssistantFinanceAction,
  confirmAssistantHealthAction,
  processAssistantVoiceAction,
  type FinanceDraft,
  type HealthDraft,
  type AssistantFoodItem,
  type MealType
} from '@/actions/assistant';
import { getSmartPortionOptions, type FoodPortionOption } from '@/lib/food-portions';
import { toUserFacingError } from '@/lib/error-management';
import { useTranslation } from '@/hooks/useTranslation';
import toast from 'react-hot-toast';

const MACRO_COLORS = {
  carbs: '#60a5fa',
  protein: '#4ade80',
  fat: '#facc15',
  sugar: '#f472b6',
  calories: '#fb923c'
};

const MEAL_OPTIONS: { id: MealType; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'breakfast', label: 'Kahvaltı', icon: Sunrise },
  { id: 'lunch', label: 'Öğle', icon: Sun },
  { id: 'dinner', label: 'Akşam', icon: Moon },
  { id: 'snack', label: 'Ara Öğün', icon: Apple }
];

const MEAL_TYPE_CONFIG: Record<MealType, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }> = {
  breakfast: { label: 'Kahvaltı', icon: Sunrise, color: 'text-[#f97316]' },
  lunch: { label: 'Öğle', icon: Sun, color: 'text-[#eab308]' },
  dinner: { label: 'Akşam', icon: Moon, color: 'text-[#818cf8]' },
  snack: { label: 'Ara Öğün', icon: Apple, color: 'text-[#34d399]' }
};

interface DBFoodResult {
  id: string;
  food_name: string;
  food_name_en?: string | null;
  unit_type: string;
  per_unit: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    sugar_g?: number;
  };
  portions?: Array<{ name: string; gram_weight: number; label?: string }>;
  brand_name?: string | null;
  is_custom?: boolean;
}

const COMMON_UNITS = [
  'gram',
  'adet',
  'dilim',
  'porsiyon',
  'bardak',
  'kase',
  'yemek kaşığı',
  'tatlı kaşığı',
  'çay kaşığı'
];

function getPortionOptions(food: AssistantFoodItem): FoodPortionOption[] {
  if (food.unit_type !== 'gram') {
    const options: FoodPortionOption[] = [
      { name: `1 ${food.unit_type}`, gram_weight: 1 },
      { name: `Yarım (0.5 ${food.unit_type})`, gram_weight: 0.5 },
      { name: '1 Porsiyon', gram_weight: 1 }
    ];
    if (food.portions && food.portions.length > 0) {
      for (const p of food.portions) {
        if (!options.some(o => o.name.toLowerCase() === p.name.toLowerCase())) {
          options.push({ name: p.name, gram_weight: p.gram_weight, label: p.label });
        }
      }
    }
    return options;
  }

  return getSmartPortionOptions({
    name: food.food_name,
    unit_type: food.unit_type,
    portions: food.portions
  });
}

export function VoiceAssistantFAB({ onSuccess, currentDate }: { onSuccess?: () => void; currentDate?: string }) {
  const { locale, isAbroad: userAbroad } = useTranslation();
  const isEn = userAbroad || locale === 'en';

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [micUnavailable, setMicUnavailable] = useState(false);

  const [financeDraft, setFinanceDraft] = useState<FinanceDraft | null>(null);
  const [healthDraft, setHealthDraft] = useState<HealthDraft | null>(null);

  // Besin değiştirme arama durumu
  const [activeReplaceCardId, setActiveReplaceCardId] = useState<string | null>(null);
  const [replaceQuery, setReplaceQuery] = useState('');
  const [replaceResults, setReplaceResults] = useState<DBFoodResult[]>([]);
  const [isSearchingReplace, setIsSearchingReplace] = useState(false);

  // Alttan yeni besin arama/ekleme durumu
  const [newFoodQuery, setNewFoodQuery] = useState('');
  const [newFoodResults, setNewFoodResults] = useState<DBFoodResult[]>([]);
  const [isSearchingNewFood, setIsSearchingNewFood] = useState(false);
  const [showNewFoodDropdown, setShowNewFoodDropdown] = useState(false);

  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopMediaTracks();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Kart içinden besin değiştirme araması
  useEffect(() => {
    if (!replaceQuery.trim() || replaceQuery.trim().length < 2) {
      setReplaceResults([]);
      setIsSearchingReplace(false);
      return;
    }
    setIsSearchingReplace(true);
    const timer = setTimeout(async () => {
      try {
        const langParam = isEn ? '&lang=en&is_abroad=1' : '';
        const res = await fetch(`/api/food/search?query=${encodeURIComponent(replaceQuery.trim())}${langParam}`);
        const data = await res.json();
        setReplaceResults(data.foods || []);
      } catch {
        setReplaceResults([]);
      } finally {
        setIsSearchingReplace(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [replaceQuery, isEn]);

  // Alttan yeni besin arama
  useEffect(() => {
    if (!newFoodQuery.trim() || newFoodQuery.trim().length < 2) {
      setNewFoodResults([]);
      setIsSearchingNewFood(false);
      return;
    }
    setIsSearchingNewFood(true);
    setShowNewFoodDropdown(true);
    const timer = setTimeout(async () => {
      try {
        const langParam = isEn ? '&lang=en&is_abroad=1' : '';
        const res = await fetch(`/api/food/search?query=${encodeURIComponent(newFoodQuery.trim())}${langParam}`);
        const data = await res.json();
        setNewFoodResults(data.foods || []);
      } catch {
        setNewFoodResults([]);
      } finally {
        setIsSearchingNewFood(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [newFoodQuery, isEn]);

  // Anlık toplam makro hesaplama
  const healthTotals = useMemo(() => {
    if (!healthDraft?.foods) return { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 };
    return healthDraft.foods.reduce(
      (acc, f) => ({
        calories: acc.calories + (Number(f.calories) || 0),
        protein: Math.round((acc.protein + (Number(f.protein_g) || 0)) * 10) / 10,
        carbs: Math.round((acc.carbs + (Number(f.carbs_g) || 0)) * 10) / 10,
        fat: Math.round((acc.fat + (Number(f.fat_g) || 0)) * 10) / 10,
        sugar: Math.round((acc.sugar + (Number(f.sugar_g) || 0)) * 10) / 10
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 }
    );
  }, [healthDraft]);

  const totalMacros = healthTotals.carbs + healthTotals.protein + healthTotals.fat;
  const carbsPct = totalMacros > 0 ? Math.round((healthTotals.carbs / totalMacros) * 100) : 0;
  const proteinPct = totalMacros > 0 ? Math.round((healthTotals.protein / totalMacros) * 100) : 0;
  const fatPct = totalMacros > 0 ? Math.max(0, 100 - carbsPct - proteinPct) : 0;

  const toggleListening = async () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      stopMediaTracks();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicUnavailable(true);
      setIsOpen(true);
      const friendlyErr = toUserFacingError('not-allowed');
      setSpeechError(friendlyErr);
      toast.error('Tarayıcınız sesli komutları desteklemiyor. Yazılı olarak giriş yapabilirsiniz.');
      return;
    }

    setTranscript('');
    setTextInput('');
    setSpeechError(null);
    setFinanceDraft(null);
    setHealthDraft(null);
    setIsOpen(true);
    setIsListening(true);
    setMicUnavailable(false);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = isEn ? 'en-US' : 'tr-TR';
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      handleProcessAction(text);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      stopMediaTracks();

      const userErr = toUserFacingError(event.error);
      setSpeechError(userErr);
      if (event.error === 'not-allowed') {
        setMicUnavailable(true);
      }
      if (event.error !== 'aborted') {
        toast.error(userErr);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      stopMediaTracks();
    };

    recognitionRef.current = recognition;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      recognition.start();
    } catch (e) {
      console.error('Speech recognition start error', e);
      setIsListening(false);
      stopMediaTracks();
      setMicUnavailable(true);
      setSpeechError(toUserFacingError(e, 'Mikrofon başlatılamadı. Komutunuzu yazarak iletebilirsiniz.'));
    }
  };

  const handleProcessAction = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setIsProcessing(true);
    setSpeechError(null);
    setIsOpen(true);

    try {
      const result = await processAssistantVoiceAction(cleanText, currentDate);
      if (result.success) {
        if (result.action === 'finance_preview') {
          setFinanceDraft(result.draft);
          setHealthDraft(null);
        } else if (result.action === 'health_preview') {
          setHealthDraft(result.draft);
          setFinanceDraft(null);
        }
      } else {
        const userErr = toUserFacingError(result.error);
        setSpeechError(userErr);
        toast.error(userErr);
      }
    } catch (err) {
      const userErr = toUserFacingError(err, 'Asistan ile bağlantı kurulamadı. Lütfen tekrar deneyin.');
      setSpeechError(userErr);
      toast.error(userErr);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmFinance = async () => {
    if (!financeDraft) return;
    setIsConfirming(true);
    try {
      const result = await confirmAssistantFinanceAction(financeDraft);
      if (!result.success) {
        toast.error(toUserFacingError(result.error, 'Finans işlemi kaydedilemedi.'));
        return;
      }
      toast.success('Finans işlemi eklendi.');
      setFinanceDraft(null);
      setIsOpen(false);
      onSuccess?.();
    } catch (err) {
      toast.error(toUserFacingError(err, 'Finans işlemi kaydedilemedi.'));
    } finally {
      setIsConfirming(false);
    }
  };

  const handleConfirmHealth = async () => {
    if (!healthDraft) return;
    if (!healthDraft.foods || healthDraft.foods.length === 0) {
      toast.error('Kaydedilecek en az bir besin bulunmalıdır.');
      return;
    }

    for (const food of healthDraft.foods) {
      if (!food.food_name.trim()) {
        toast.error('Lütfen tüm besinlerin adlarını doldurun.');
        return;
      }
      if (isNaN(food.quantity) || food.quantity <= 0) {
        toast.error(`${food.food_name} için geçerli bir miktar girin.`);
        return;
      }
    }

    setIsConfirming(true);
    try {
      const result = await confirmAssistantHealthAction(healthDraft);
      if (!result.success) {
        toast.error(toUserFacingError(result.error, 'Besinler kaydedilemedi.'));
        return;
      }
      toast.success(result.message || 'Öğün başarıyla eklendi.');
      setHealthDraft(null);
      setIsOpen(false);
      onSuccess?.();
    } catch (err) {
      toast.error(toUserFacingError(err, 'Besinler kaydedilemedi. Lütfen tekrar deneyin.'));
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    setFinanceDraft(null);
    setHealthDraft(null);
    setTranscript('');
    setTextInput('');
    setSpeechError(null);
    setActiveReplaceCardId(null);
    setReplaceQuery('');
    setReplaceResults([]);
    setNewFoodQuery('');
    setNewFoodResults([]);
    setShowNewFoodDropdown(false);
    setIsOpen(false);
  };

  const handleRetry = () => {
    setFinanceDraft(null);
    setHealthDraft(null);
    setSpeechError(null);
    setTranscript('');
    setTextInput('');
    setActiveReplaceCardId(null);
    setReplaceQuery('');
    setReplaceResults([]);
    setNewFoodQuery('');
    setNewFoodResults([]);
    setShowNewFoodDropdown(false);
    toggleListening();
  };

  const updateFoodItem = (id: string, updates: Partial<AssistantFoodItem>) => {
    if (!healthDraft) return;
    setHealthDraft({
      ...healthDraft,
      foods: healthDraft.foods.map((item) => (item.id === id ? { ...item, ...updates } : item))
    });
  };

  const removeFoodItem = (id: string) => {
    if (!healthDraft) return;
    const remaining = healthDraft.foods.filter((item) => item.id !== id);
    if (remaining.length === 0) {
      toast.error('Öğünde en az bir besin kalmalıdır.');
      return;
    }
    setHealthDraft({
      ...healthDraft,
      foods: remaining
    });
  };

  const handleSelectReplaceFood = (cardId: string, item: DBFoodResult) => {
    if (!healthDraft) return;
    const isGram = item.unit_type === 'gram';
    const mult = isGram ? 100 : 1;
    const cal = Math.round(item.per_unit.calories * mult);
    const p = Math.round(item.per_unit.protein_g * mult * 10) / 10;
    const c = Math.round(item.per_unit.carbs_g * mult * 10) / 10;
    const f = Math.round(item.per_unit.fat_g * mult * 10) / 10;
    const s = Math.round((item.per_unit.sugar_g || 0) * mult * 10) / 10;

    setHealthDraft({
      ...healthDraft,
      foods: healthDraft.foods.map((food) => {
        if (food.id !== cardId) return food;
        return {
          ...food,
          food_name: item.food_name,
          brand_name: item.brand_name || null,
          unit_type: item.unit_type,
          quantity: mult,
          serving_description: isGram ? `${mult} gram` : `${mult} ${item.unit_type}`,
          calories: cal,
          protein_g: p,
          carbs_g: c,
          fat_g: f,
          sugar_g: s,
          food_cache_id: item.id,
          matched_in_db: true,
          per_unit: item.per_unit,
          portions: item.portions || []
        };
      })
    });

    setActiveReplaceCardId(null);
    setReplaceQuery('');
    setReplaceResults([]);
    toast.success(`"${item.food_name}" veritabanından seçildi.`);
  };

  const handleOpenCardDBSearch = (cardId: string, currentName: string) => {
    if (activeReplaceCardId === cardId) {
      setActiveReplaceCardId(null);
      setReplaceQuery('');
      setReplaceResults([]);
      return;
    }
    setActiveReplaceCardId(cardId);
    setReplaceQuery(currentName);
    if (currentName.trim().length >= 2) {
      setIsSearchingReplace(true);
      fetch(`/api/food/search?query=${encodeURIComponent(currentName.trim())}`)
        .then((res) => res.json())
        .then((data) => setReplaceResults(data.foods || []))
        .catch(() => setReplaceResults([]))
        .finally(() => setIsSearchingReplace(false));
    }
  };

  const handleFoodNameChange = (cardId: string, val: string) => {
    updateFoodItem(cardId, { food_name: val });
    setActiveReplaceCardId(cardId);
    setReplaceQuery(val);
  };

  const handlePortionSelect = (cardId: string, opt: FoodPortionOption) => {
    if (!healthDraft) return;
    setHealthDraft({
      ...healthDraft,
      foods: healthDraft.foods.map((food) => {
        if (food.id !== cardId) return food;
        const p = food.per_unit;
        let newQty = opt.gram_weight;
        let desc = opt.name;

        if (opt.isRawGram) {
          newQty = 100;
          desc = '100 gram';
        }

        if (!p) {
          return {
            ...food,
            quantity: newQty,
            serving_description: desc
          };
        }

        return {
          ...food,
          quantity: newQty,
          serving_description: desc,
          calories: Math.round(p.calories * newQty),
          protein_g: Math.round(p.protein_g * newQty * 10) / 10,
          carbs_g: Math.round(p.carbs_g * newQty * 10) / 10,
          fat_g: Math.round(p.fat_g * newQty * 10) / 10,
          sugar_g: Math.round((p.sugar_g || 0) * newQty * 10) / 10
        };
      })
    });
  };

  const handleAddNewFoodFromDB = (item: DBFoodResult) => {
    if (!healthDraft) return;
    const mult = item.unit_type === 'gram' ? 100 : 1;
    const cal = Math.round(item.per_unit.calories * mult);
    const p = Math.round(item.per_unit.protein_g * mult * 10) / 10;
    const c = Math.round(item.per_unit.carbs_g * mult * 10) / 10;
    const f = Math.round(item.per_unit.fat_g * mult * 10) / 10;
    const s = Math.round((item.per_unit.sugar_g || 0) * mult * 10) / 10;

    const newItem: AssistantFoodItem = {
      id: `voice-food-db-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      food_name: item.food_name,
      brand_name: item.brand_name || null,
      unit_type: item.unit_type,
      quantity: mult,
      serving_description: item.unit_type === 'gram' ? `${mult} gram` : `${mult} ${item.unit_type}`,
      calories: cal,
      protein_g: p,
      carbs_g: c,
      fat_g: f,
      sugar_g: s,
      food_cache_id: item.id,
      matched_in_db: true,
      per_unit: item.per_unit,
      portions: item.portions || []
    };

    setHealthDraft({
      ...healthDraft,
      foods: [...healthDraft.foods, newItem]
    });

    setNewFoodQuery('');
    setNewFoodResults([]);
    setShowNewFoodDropdown(false);
    toast.success(`"${item.food_name}" eklendi.`);
  };

  const handleQuantityChange = (id: string, newQty: number) => {
    if (!healthDraft) return;
    const validQty = Math.max(0, newQty);
    setHealthDraft({
      ...healthDraft,
      foods: healthDraft.foods.map((item) => {
        if (item.id !== id) return item;
        const perUnit = item.per_unit || (item.quantity > 0 ? {
          calories: item.calories / item.quantity,
          protein_g: item.protein_g / item.quantity,
          carbs_g: item.carbs_g / item.quantity,
          fat_g: item.fat_g / item.quantity,
          sugar_g: (item.sugar_g || 0) / item.quantity
        } : null);

        if (!perUnit) {
          return { ...item, quantity: validQty };
        }

        return {
          ...item,
          quantity: validQty,
          serving_description: item.unit_type === 'gram' ? `${validQty} gram` : `${validQty} ${item.unit_type}`,
          calories: Math.round(perUnit.calories * validQty),
          protein_g: Math.round(perUnit.protein_g * validQty * 10) / 10,
          carbs_g: Math.round(perUnit.carbs_g * validQty * 10) / 10,
          fat_g: Math.round(perUnit.fat_g * validQty * 10) / 10,
          sugar_g: Math.round((perUnit.sugar_g || 0) * validQty * 10) / 10,
          per_unit: perUnit
        };
      })
    });
  };

  const addEmptyFoodItem = () => {
    if (!healthDraft) return;
    const newItem: AssistantFoodItem = {
      id: `voice-food-custom-${Date.now()}`,
      food_name: '',
      serving_description: '1 porsiyon',
      quantity: 1,
      unit_type: 'porsiyon',
      calories: 100,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      sugar_g: 0
    };
    setHealthDraft({
      ...healthDraft,
      foods: [...healthDraft.foods, newItem]
    });
  };

  return (
    <>
      {/* ── FAB BUTTON ── */}
      <div className="fixed bottom-6 left-6 z-[90] flex items-center">
        <button
          type="button"
          onClick={() => {
            if (!isOpen) {
              setIsOpen(true);
              toggleListening();
            } else {
              toggleListening();
            }
          }}
          aria-label="DailyM Sesli Asistanı Başlat"
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.6)] border transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${
            isListening
              ? 'bg-rose-500 border-rose-400 text-white ring-4 ring-rose-500/30 animate-pulse'
              : 'bg-[var(--primary)] border-[var(--primary-hover)] text-black hover:bg-[var(--primary-hover)]'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="animate-spin text-black" size={24} />
          ) : (
            <Mic className={isListening ? 'text-white' : 'text-black'} size={24} />
          )}
        </button>
      </div>

      {/* ── DAILYM MODAL / BOTTOM SHEET OVERLAY ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={handleCancel} />

          {/* Modal Container */}
          <div
            className={`relative z-10 w-full bg-[var(--surface-container-low)] border border-[var(--outline)] rounded-t-3xl sm:rounded-3xl shadow-[0_16px_48px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col transition-all duration-300 max-h-[92vh] sm:max-h-[85vh] ${
              healthDraft ? 'max-w-2xl' : 'max-w-md'
            }`}
            style={{ backgroundColor: '#141414' }}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[var(--outline)] bg-[var(--surface-container)]/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                    healthDraft
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20'
                      : financeDraft
                      ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                      : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20'
                  }`}
                >
                  {healthDraft ? (
                    <Utensils size={20} />
                  ) : financeDraft ? (
                    <Wallet size={20} />
                  ) : (
                    <Sparkles size={20} />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                    {healthDraft
                      ? 'Besin Önizleme ve Onay'
                      : financeDraft
                      ? 'Finans İşlemi Onayı'
                      : 'DailyM Sesli Asistan'}
                  </h2>
                  <span className="text-[11px] text-[var(--on-surface-variant)]">
                    {healthDraft
                      ? 'Değerleri kontrol edip dilediğiniz gibi düzenleyebilirsiniz'
                      : financeDraft
                      ? 'İşlem detaylarını kontrol edin'
                      : 'Yapay zeka ile sesli veya yazılı komut verin'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-[var(--on-surface-variant)] hover:text-white flex items-center justify-center transition-colors shrink-0"
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── CASE 1: HEALTH PREVIEW & CONFIRMATION ── */}
            {healthDraft ? (
              <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4 text-white">
                {/* Transcript Bilgisi */}
                {healthDraft.transcript && (
                  <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-2xl p-3 flex items-start gap-2.5 text-xs text-white/90">
                    <Mic size={15} className="text-[var(--primary)] mt-0.5 shrink-0" />
                    <span className="leading-relaxed italic">&ldquo;{healthDraft.transcript}&rdquo;</span>
                  </div>
                )}

                {/* Öğün Seçimi - AddMealForm stili */}
                <div className="flex gap-2">
                  {MEAL_OPTIONS.map((m) => {
                    const IconComp = m.icon;
                    const isSelected = healthDraft.meal_type === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setHealthDraft({ ...healthDraft, meal_type: m.id })}
                        className={`flex-1 py-2.5 flex flex-col items-center gap-1 rounded-2xl text-[11px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[rgba(255,255,255,0.12)] text-white ring-1 ring-[rgba(255,255,255,0.2)]'
                            : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'
                        }`}
                      >
                        <IconComp size={18} className={isSelected ? 'text-[var(--primary)]' : 'text-[var(--on-surface-variant)]'} />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Makro Özeti - AddMealForm stili */}
                <div className="p-4 bg-[rgba(255,255,255,0.03)] rounded-2xl border border-[rgba(255,255,255,0.06)]">
                  <div className="flex items-baseline justify-between mb-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[28px] font-bold text-white">{healthTotals.calories}</span>
                      <span className="text-[13px] text-[var(--on-surface-variant)]">kcal</span>
                    </div>
                    <span className="text-[11px] font-medium text-[var(--on-surface-variant)]">
                      Toplam {healthDraft.foods.length} besin
                    </span>
                  </div>

                  {/* Makro bar */}
                  <div className="flex rounded-full overflow-hidden h-2 mb-3 gap-0.5 bg-white/5">
                    {carbsPct > 0 && (
                      <div style={{ width: `${carbsPct}%`, background: MACRO_COLORS.carbs }} className="rounded-full" />
                    )}
                    {proteinPct > 0 && (
                      <div style={{ width: `${proteinPct}%`, background: MACRO_COLORS.protein }} className="rounded-full" />
                    )}
                    {fatPct > 0 && (
                      <div style={{ width: `${fatPct}%`, background: MACRO_COLORS.fat }} className="rounded-full" />
                    )}
                  </div>

                  {/* Makro değerler */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: 'Karb', value: healthTotals.carbs, pct: carbsPct, color: MACRO_COLORS.carbs, bg: 'rgba(96,165,250,0.1)' },
                      { label: 'Protein', value: healthTotals.protein, pct: proteinPct, color: MACRO_COLORS.protein, bg: 'rgba(74,222,128,0.1)' },
                      { label: 'Yağ', value: healthTotals.fat, pct: fatPct, color: MACRO_COLORS.fat, bg: 'rgba(250,204,21,0.1)' },
                      { label: 'Şeker', value: healthTotals.sugar, pct: 0, color: MACRO_COLORS.sugar, bg: 'rgba(244,114,182,0.1)' }
                    ].map((m) => (
                      <div key={m.label} className="flex flex-col items-center py-2 rounded-xl" style={{ background: m.bg }}>
                        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: m.color }}>{m.label}</span>
                        <span className="text-[15px] font-bold text-white mt-0.5">{m.value}g</span>
                        <span className="text-[10px]" style={{ color: m.color }}>{m.pct > 0 ? `%${m.pct}` : '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Besin Listesi */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[12px] font-semibold text-white flex items-center gap-1.5">
                      <Utensils size={15} className="text-[var(--primary)]" />
                      Öğündeki Besinler ({healthDraft.foods.length})
                    </span>
                    <span className="text-[11px] text-[var(--on-surface-variant)]">
                      İstediğiniz besini değiştirebilir veya düzenleyebilirsiniz
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[38vh] overflow-y-auto custom-scrollbar pr-1">
                    {healthDraft.foods.map((food, idx) => {
                      const isReplacing = activeReplaceCardId === food.id;
                      const portionOptions = getPortionOptions(food);
                      return (
                        <div
                          key={food.id || idx}
                          className="p-3.5 bg-[#161622] rounded-2xl border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] transition-colors flex flex-col gap-3 relative"
                        >
                          {/* Üst Kısım: Rozetler ve Silme Butonu */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                              {food.matched_in_db ? (
                                <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                                  <Database size={11} />
                                  Veritabanından Doğrulandı
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30">
                                  <Sparkles size={11} />
                                  AI Tahmini
                                </span>
                              )}
                              {food.brand_name && (
                                <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/25 font-semibold">
                                  {food.brand_name}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => removeFoodItem(food.id)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/15 rounded-xl border border-transparent hover:border-red-500/20 transition-colors shrink-0 cursor-pointer"
                              title="Öğünden Çıkar"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          {/* Besin Adı Arama ve DB Seçim Alanı */}
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
                                <Utensils size={13} className="text-[var(--primary)]" />
                                Besin Adı (DB Arama & Seçim)
                              </label>
                              <button
                                type="button"
                                onClick={() => handleOpenCardDBSearch(food.id, food.food_name)}
                                className={`text-[11px] font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                                  isReplacing
                                    ? 'bg-[var(--primary)] text-black border-[var(--primary)] font-bold'
                                    : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[var(--primary)] border-[rgba(255,255,255,0.08)]'
                                }`}
                                title="Veritabanında ara ve seç"
                              >
                                <Search size={12} />
                                <span>{isReplacing ? 'Aramayı Kapat' : 'DB\'den Seç'}</span>
                              </button>
                            </div>

                            <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                {isReplacing && isSearchingReplace ? (
                                  <Loader2 size={16} className="text-[var(--primary)] animate-spin" />
                                ) : (
                                  <Search size={16} className="text-[var(--primary)]" />
                                )}
                              </div>
                              <input
                                type="text"
                                value={food.food_name}
                                onChange={(e) => handleFoodNameChange(food.id, e.target.value)}
                                onFocus={() => {
                                  if (!isReplacing && food.food_name.trim().length >= 2) {
                                    handleOpenCardDBSearch(food.id, food.food_name);
                                  }
                                }}
                                placeholder={isEn ? "Search in database (e.g. Rice, Chicken, Eggs...)" : "Veritabanında arayın (Örn: Bulgur, Tavuk, Yumurta...)"}
                                className="w-full bg-[#14141E] border-2 border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] focus:border-[var(--primary)] rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-semibold text-white focus:outline-none transition-all placeholder:text-[var(--on-surface-variant)] placeholder:font-normal"
                              />
                            </div>
                          </div>

                          {/* Kart İçi Veritabanı Sonuçları Açılır Menüsü */}
                          {isReplacing && (
                            <div className="bg-[#1A1A26] border border-[var(--primary)]/40 rounded-2xl p-2 flex flex-col gap-1 shadow-2xl animate-fade-in max-h-56 overflow-y-auto custom-scrollbar">
                              <div className="px-3 py-1 text-[10px] uppercase tracking-wider font-bold text-[var(--primary)] flex items-center justify-between border-b border-white/5 pb-1.5">
                                <span>Veritabanı Sonuçları ({replaceResults.length})</span>
                                <span className="text-[10px] text-white/50 lowercase font-normal">seçmek için tıklayın</span>
                              </div>
                              {isSearchingReplace ? (
                                <div className="py-6 flex items-center justify-center gap-2 text-[var(--on-surface-variant)] text-xs">
                                  <Loader2 size={16} className="animate-spin text-[var(--primary)]" />
                                  <span>Veritabanında aranıyor...</span>
                                </div>
                              ) : replaceResults.length > 0 ? (
                                replaceResults.map((dbItem) => (
                                  <div
                                    key={dbItem.id}
                                    onClick={() => handleSelectReplaceFood(food.id, dbItem)}
                                    className="px-3 py-2 hover:bg-white/10 rounded-xl cursor-pointer border border-transparent hover:border-[var(--primary)]/30 transition-all flex items-center justify-between gap-3 group"
                                  >
                                    <div className="flex flex-col min-w-0">
                                      <div className="text-[13px] font-bold text-white truncate flex items-center gap-1.5">
                                        {dbItem.is_custom && (
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                                            Özel
                                          </span>
                                        )}
                                        <span className="truncate group-hover:text-[var(--primary)] transition-colors">{dbItem.food_name}</span>
                                        {dbItem.brand_name && (
                                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[var(--primary)]/15 text-[var(--primary)] shrink-0">
                                            {dbItem.brand_name}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-[var(--on-surface-variant)] mt-0.5 flex items-center gap-2">
                                        <span>{dbItem.unit_type === 'gram' ? '100g' : '1 adet'} — {Math.round((dbItem.per_unit?.calories || 0) * (dbItem.unit_type === 'gram' ? 100 : 1))} kcal</span>
                                        {dbItem.portions && dbItem.portions.length > 0 && (
                                          <span className="text-[10px] text-emerald-400">({dbItem.portions[0].name})</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <div className="flex gap-1">
                                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(96,165,250,0.15)', color: MACRO_COLORS.carbs }}>K{Math.round((dbItem.per_unit?.carbs_g || 0) * (dbItem.unit_type === 'gram' ? 100 : 1))}g</span>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(74,222,128,0.15)', color: MACRO_COLORS.protein }}>P{Math.round((dbItem.per_unit?.protein_g || 0) * (dbItem.unit_type === 'gram' ? 100 : 1))}g</span>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(250,204,21,0.15)', color: MACRO_COLORS.fat }}>Y{Math.round((dbItem.per_unit?.fat_g || 0) * (dbItem.unit_type === 'gram' ? 100 : 1))}g</span>
                                      </div>
                                      <span className="text-[11px] font-bold text-black bg-[var(--primary)] px-2.5 py-1 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
                                        Seç
                                      </span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-4 text-center text-xs text-[var(--on-surface-variant)] flex flex-col items-center gap-2">
                                  <span>&ldquo;{replaceQuery}&rdquo; veritabanında bulunamadı.</span>
                                  <button
                                    type="button"
                                    onClick={() => setActiveReplaceCardId(null)}
                                    className="text-xs text-[var(--primary)] font-semibold hover:underline cursor-pointer"
                                  >
                                    Özel isim olarak kullan ve kapat
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Miktar ve Porsiyon / Ölçü Birimi */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {/* Porsiyon / Ölçü Birimi Seçici */}
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider font-semibold flex items-center justify-between">
                                <span>Ölçü Birimi / Porsiyon</span>
                                {food.unit_type === 'gram' && (
                                  <span className="text-[var(--primary)] font-medium">gram bazlı</span>
                                )}
                              </label>
                              {portionOptions.length > 0 ? (
                                <select
                                  value={food.serving_description || ''}
                                  onChange={(e) => {
                                    const found = portionOptions.find((o) => o.name === e.target.value);
                                    if (found) {
                                      handlePortionSelect(food.id, found);
                                    } else {
                                      updateFoodItem(food.id, { serving_description: e.target.value });
                                    }
                                  }}
                                  className="w-full bg-[#14141E] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] focus:border-[var(--primary)] rounded-xl py-2 px-3 text-[13px] font-medium text-white focus:outline-none transition-all cursor-pointer"
                                >
                                  {portionOptions.map((opt, i) => (
                                    <option key={i} value={opt.name}>
                                      {opt.name} {opt.isRawGram ? '' : `(${opt.gram_weight}${food.unit_type === 'gram' ? 'g' : ''})`}
                                    </option>
                                  ))}
                                  {!portionOptions.some((o) => o.name === food.serving_description) && food.serving_description && (
                                    <option value={food.serving_description}>{food.serving_description}</option>
                                  )}
                                </select>
                              ) : (
                                <select
                                  value={COMMON_UNITS.includes(food.unit_type) ? food.unit_type : 'diger'}
                                  onChange={(e) => {
                                    if (e.target.value !== 'diger') {
                                      updateFoodItem(food.id, {
                                        unit_type: e.target.value,
                                        serving_description: `${food.quantity} ${e.target.value}`
                                      });
                                    }
                                  }}
                                  className="w-full bg-[#14141E] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] focus:border-[var(--primary)] rounded-xl py-2 px-3 text-[13px] font-medium text-white focus:outline-none transition-all cursor-pointer"
                                >
                                  {COMMON_UNITS.map((u) => (
                                    <option key={u} value={u}>
                                      {u}
                                    </option>
                                  ))}
                                  {!COMMON_UNITS.includes(food.unit_type) && (
                                    <option value="diger">{food.unit_type || 'adet'}</option>
                                  )}
                                </select>
                              )}
                            </div>

                            {/* Miktar Girişi */}
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider font-semibold flex items-center justify-between">
                                <span>Miktar ({food.unit_type})</span>
                                <span className="text-[var(--on-surface-variant)] text-[9px]">otomatik çarpar</span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={food.quantity}
                                onChange={(e) => handleQuantityChange(food.id, Number(e.target.value) || 0)}
                                className="w-full bg-[#14141E] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] focus:border-[var(--primary)] rounded-xl py-2 px-3 text-[13px] font-bold text-white focus:outline-none transition-all"
                              />
                            </div>
                          </div>

                          {/* Makro Değerleri (Renkli ve Düzenlenebilir) */}
                          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[rgba(255,255,255,0.05)]">
                            <div className="flex flex-col items-center py-1.5 px-1 rounded-xl" style={{ background: 'rgba(251,146,60,0.08)' }}>
                              <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: MACRO_COLORS.calories }}>Kalori</span>
                              <input
                                type="number"
                                min="0"
                                value={food.calories}
                                onChange={(e) => updateFoodItem(food.id, { calories: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                                className="w-full bg-transparent text-center text-[13px] font-bold text-white focus:outline-none mt-0.5"
                              />
                              <span className="text-[9px]" style={{ color: MACRO_COLORS.calories }}>kcal</span>
                            </div>

                            <div className="flex flex-col items-center py-1.5 px-1 rounded-xl" style={{ background: 'rgba(96,165,250,0.08)' }}>
                              <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: MACRO_COLORS.carbs }}>Karb</span>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={food.carbs_g}
                                onChange={(e) => updateFoodItem(food.id, { carbs_g: Math.max(0, Number(e.target.value) || 0) })}
                                className="w-full bg-transparent text-center text-[13px] font-bold text-white focus:outline-none mt-0.5"
                              />
                              <span className="text-[9px]" style={{ color: MACRO_COLORS.carbs }}>g</span>
                            </div>

                            <div className="flex flex-col items-center py-1.5 px-1 rounded-xl" style={{ background: 'rgba(74,222,128,0.08)' }}>
                              <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: MACRO_COLORS.protein }}>Protein</span>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={food.protein_g}
                                onChange={(e) => updateFoodItem(food.id, { protein_g: Math.max(0, Number(e.target.value) || 0) })}
                                className="w-full bg-transparent text-center text-[13px] font-bold text-white focus:outline-none mt-0.5"
                              />
                              <span className="text-[9px]" style={{ color: MACRO_COLORS.protein }}>g</span>
                            </div>

                            <div className="flex flex-col items-center py-1.5 px-1 rounded-xl" style={{ background: 'rgba(250,204,21,0.08)' }}>
                              <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: MACRO_COLORS.fat }}>Yağ</span>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={food.fat_g}
                                onChange={(e) => updateFoodItem(food.id, { fat_g: Math.max(0, Number(e.target.value) || 0) })}
                                className="w-full bg-transparent text-center text-[13px] font-bold text-white focus:outline-none mt-0.5"
                              />
                              <span className="text-[9px]" style={{ color: MACRO_COLORS.fat }}>g</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Alt Kısım: Öğüne Başka Besin Ekleme (DB Arama + Manuel Ekle) */}
                <div className="flex flex-col gap-2 relative">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
                      <Plus size={13} className="text-[var(--primary)]" />
                      Öğüne Başka Besin Ekle
                    </span>
                    <button
                      type="button"
                      onClick={addEmptyFoodItem}
                      className="text-[11px] text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <Plus size={12} />
                      Manuel Ekle
                    </button>
                  </div>

                  {/* Arama Input - AddMealForm arama stili */}
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      {isSearchingNewFood ? (
                        <Loader2 className="text-[var(--primary)] animate-spin" size={18} />
                      ) : (
                        <Search className="text-[var(--primary)]" size={18} />
                      )}
                    </div>
                    <input
                      type="text"
                      value={newFoodQuery}
                      onChange={(e) => {
                        setNewFoodQuery(e.target.value);
                        setShowNewFoodDropdown(true);
                      }}
                      onFocus={() => {
                        if (newFoodResults.length > 0) setShowNewFoodDropdown(true);
                      }}
                      placeholder={isEn ? "Search foods in database (e.g. Rice, Chicken, Eggs...)" : "Veritabanından yemek arayın (Örn: Bulgur, Tavuk, Yumurta...)"}
                      className="w-full bg-[#16161F] border-2 border-[rgba(255,255,255,0.06)] rounded-2xl py-3 pl-11 pr-4 text-[13px] font-medium text-white focus:outline-none focus:border-[var(--primary)] focus:shadow-[0_0_20px_rgba(var(--primary-rgb),0.12)] transition-all placeholder:text-[var(--on-surface-variant)]"
                    />
                  </div>

                  {/* Arama Sonuçları Açılır Menüsü */}
                  {showNewFoodDropdown && newFoodQuery.trim().length >= 2 && (
                    <div className="w-full bg-[#1A1A26] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden shadow-2xl max-h-56 overflow-y-auto animate-fade-in z-20">
                      {isSearchingNewFood ? (
                        <div className="p-6 flex items-center justify-center gap-2 text-[var(--on-surface-variant)] text-xs">
                          <Loader2 size={16} className="animate-spin text-[var(--primary)]" />
                          <span>Aranıyor...</span>
                        </div>
                      ) : newFoodResults.length > 0 ? (
                        <>
                          <div className="p-2 pb-1 text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider font-semibold px-4">
                            Veritabanı Sonuçları ({newFoodResults.length})
                          </div>
                          {newFoodResults.map((food) => (
                            <div
                              key={food.id}
                              onClick={() => handleAddNewFoodFromDB(food)}
                              className="px-4 py-2.5 hover:bg-[rgba(255,255,255,0.06)] cursor-pointer border-b border-[rgba(255,255,255,0.04)] last:border-0 transition-colors flex items-center justify-between gap-3"
                            >
                              <div className="flex flex-col min-w-0">
                                <div className="text-[13px] font-semibold text-white truncate flex items-center gap-1.5 flex-wrap">
                                  {food.is_custom && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                                      Özel
                                    </span>
                                  )}
                                  <span className="truncate">{food.food_name}</span>
                                  {food.brand_name && (
                                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/20 shrink-0">
                                      {food.brand_name}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[var(--on-surface-variant)] mt-0.5">
                                  <span>{food.unit_type === 'gram' ? '100g' : '1 adet'} — {Math.round((food.per_unit?.calories || 0) * (food.unit_type === 'gram' ? 100 : 1))} kcal</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex gap-1">
                                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'rgba(96,165,250,0.15)', color: MACRO_COLORS.carbs }}>K{Math.round((food.per_unit?.carbs_g || 0) * (food.unit_type === 'gram' ? 100 : 1))}g</span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'rgba(74,222,128,0.15)', color: MACRO_COLORS.protein }}>P{Math.round((food.per_unit?.protein_g || 0) * (food.unit_type === 'gram' ? 100 : 1))}g</span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'rgba(250,204,21,0.15)', color: MACRO_COLORS.fat }}>Y{Math.round((food.per_unit?.fat_g || 0) * (food.unit_type === 'gram' ? 100 : 1))}g</span>
                                </div>
                                <span className="text-[11px] font-bold text-[var(--primary)] px-2 py-1 rounded-lg bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20">
                                  + Ekle
                                </span>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="p-4 text-center text-xs text-[var(--on-surface-variant)] flex flex-col items-center gap-2">
                          <span>&ldquo;{newFoodQuery}&rdquo; bulunamadı.</span>
                          <button
                            type="button"
                            onClick={addEmptyFoodItem}
                            className="text-xs text-[var(--primary)] font-semibold hover:underline cursor-pointer"
                          >
                            Manuel olarak eklemek için tıklayın
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Butonlar: İptal, Tekrar Dene, Onayla - AddMealForm stili */}
                <div className="flex gap-3 mt-1 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isConfirming}
                    className="flex-1 py-3.5 rounded-2xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.09)] text-white text-[13px] font-semibold transition-all cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    onClick={handleRetry}
                    disabled={isConfirming}
                    className="py-3.5 px-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={14} />
                    <span>Tekrar Dene</span>
                  </button>
                  <button
                    type="button"
                    disabled={isConfirming || healthDraft.foods.length === 0}
                    onClick={handleConfirmHealth}
                    className="flex-[2] py-3.5 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black text-[13px] font-bold transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 cursor-pointer"
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-black" />
                        <span>Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Öğünü Onayla ve Kaydet</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : financeDraft ? (
              /* ── CASE 2: FINANCE PREVIEW & CONFIRMATION ── */
              <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4 text-white">
                <div className="bg-[var(--surface-container)] border border-[var(--outline)] rounded-2xl p-4 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                      İşlem Türü
                    </span>
                    <span className="text-xs font-bold text-sky-400">
                      {financeDraft.transaction_type === 'income' ? 'Gelir İşlemi' : 'Gider İşlemi'}
                    </span>
                  </div>
                  {transcript && (
                    <div className="text-xs text-white/70 italic mt-1">&ldquo;{transcript}&rdquo;</div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                    Tutar (₺)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={financeDraft.amount}
                    onChange={(e) => setFinanceDraft({ ...financeDraft, amount: Number(e.target.value) })}
                    className="w-full bg-black/50 border border-[var(--outline)] rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                    Hesap
                  </label>
                  <select
                    value={financeDraft.account_id || ''}
                    onChange={(e) => setFinanceDraft({ ...financeDraft, account_id: e.target.value || null })}
                    className="w-full bg-[#1c1c1e] border border-[var(--outline)] rounded-xl px-3 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-sky-400 cursor-pointer"
                  >
                    <option value="">Hesap seçin</option>
                    {financeDraft.accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                    Kategori
                  </label>
                  <select
                    value={financeDraft.category_id || ''}
                    onChange={(e) => setFinanceDraft({ ...financeDraft, category_id: e.target.value || null })}
                    className="w-full bg-[#1c1c1e] border border-[var(--outline)] rounded-xl px-3 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-sky-400 cursor-pointer"
                  >
                    <option value="">Kategori seçin</option>
                    {financeDraft.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                    Açıklama
                  </label>
                  <input
                    type="text"
                    value={financeDraft.description}
                    onChange={(e) => setFinanceDraft({ ...financeDraft, description: e.target.value })}
                    className="w-full bg-black/50 border border-[var(--outline)] rounded-xl px-3 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-3 border-t border-[var(--outline)]">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isConfirming}
                    className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    onClick={handleRetry}
                    disabled={isConfirming}
                    className="py-3 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={14} />
                    <span>Tekrar Dene</span>
                  </button>
                  <button
                    type="button"
                    disabled={
                      isConfirming ||
                      !financeDraft.account_id ||
                      !financeDraft.category_id ||
                      financeDraft.amount <= 0
                    }
                    onClick={handleConfirmFinance}
                    className="flex-1 py-3 px-5 rounded-xl bg-sky-500 hover:bg-sky-600 text-black font-extrabold text-xs sm:text-sm disabled:opacity-40 transition-all shadow-lg cursor-pointer"
                  >
                    {isConfirming ? 'Kaydediliyor...' : 'Onayla'}
                  </button>
                </div>
              </div>
            ) : (
              /* ── CASE 3: PROMPT / LISTENING / EXAMPLES SCREEN ── */
              <div className="p-5 sm:p-6 flex flex-col gap-4 text-white">
                {/* Visual Status Box */}
                <div className="bg-[var(--surface-container)] border border-[var(--outline)] rounded-2xl p-5 min-h-[110px] flex flex-col items-center justify-center text-center">
                  {isListening ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-sm">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--primary)]"></span>
                        </span>
                        <span>Dinliyorum, konuşabilirsiniz...</span>
                      </div>
                      {transcript ? (
                        <span className="text-white text-sm font-semibold bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                          &ldquo;{transcript}&rdquo;
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--on-surface-variant)]">
                          Yediğiniz besinleri veya yaptığınız harcamayı söyleyin
                        </span>
                      )}
                    </div>
                  ) : isProcessing ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-white">Yapay Zeka İşliyor...</span>
                        <span className="text-xs text-[var(--on-surface-variant)] truncate max-w-xs">
                          &ldquo;{transcript}&rdquo;
                        </span>
                      </div>
                    </div>
                  ) : speechError ? (
                    /* Error State with friendly manager */
                    <div className="flex flex-col items-center gap-2.5 text-center">
                      <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                        <AlertCircle size={20} />
                      </div>
                      <span className="text-xs sm:text-sm text-rose-300 max-w-sm leading-relaxed font-medium">
                        {speechError}
                      </span>
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="mt-1 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw size={13} />
                        <span>Tekrar Dene</span>
                      </button>
                    </div>
                  ) : (
                    /* Clickable Prompts in DailyM style */
                    <div className="w-full text-left space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                          Örnek Komutlar (Tıklayıp Deneyin)
                        </span>
                      </div>

                      {/* Food Example Card */}
                      <button
                        type="button"
                        onClick={() => {
                          const sample = '2 yumurta, 100 gram peynir ve 2 dilim ekmek yedim.';
                          setTranscript(sample);
                          handleProcessAction(sample);
                        }}
                        className="w-full text-left bg-black/40 hover:bg-black/60 p-3 rounded-2xl border border-[var(--outline)] hover:border-[var(--primary)]/40 flex items-start gap-3 transition-all cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Utensils size={15} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-white group-hover:text-[var(--primary)] transition-colors">
                            Besin Ekleme Örneği
                          </span>
                          <span className="text-xs text-[var(--on-surface-variant)] truncate">
                            &ldquo;2 yumurta, 100 gram peynir ve 2 dilim ekmek yedim.&rdquo;
                          </span>
                        </div>
                      </button>

                      {/* Finance Example Card */}
                      <button
                        type="button"
                        onClick={() => {
                          const sample = 'Nakit hesabımdan 150 TL market harcaması yaptım.';
                          setTranscript(sample);
                          handleProcessAction(sample);
                        }}
                        className="w-full text-left bg-black/40 hover:bg-black/60 p-3 rounded-2xl border border-[var(--outline)] hover:border-sky-400/40 flex items-start gap-3 transition-all cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Wallet size={15} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">
                            Finans Harcaması Örneği
                          </span>
                          <span className="text-xs text-[var(--on-surface-variant)] truncate">
                            &ldquo;Nakit hesabımdan 150 TL market harcaması yaptım.&rdquo;
                          </span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Text Input Fallback */}
                <div className="flex flex-col gap-1.5 pt-1">
                  {micUnavailable && (
                    <span className="text-[11px] text-amber-400 leading-snug">
                      Mikrofon kullanılamıyor. Komutunuzu aşağıdaki kutudan yazıp gönderebilirsiniz:
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Veya komutunuzu buraya yazın..."
                      className="flex-1 bg-black/50 border border-[var(--outline)] rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[var(--primary)] placeholder:text-[var(--on-surface-variant)]/60 transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && textInput.trim()) {
                          const val = textInput.trim();
                          setTranscript(val);
                          setTextInput('');
                          handleProcessAction(val);
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={!textInput.trim() || isProcessing}
                      onClick={() => {
                        if (textInput.trim()) {
                          const val = textInput.trim();
                          setTranscript(val);
                          setTextInput('');
                          handleProcessAction(val);
                        }
                      }}
                      className="w-11 h-11 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black rounded-2xl flex items-center justify-center disabled:opacity-30 transition-colors shrink-0 cursor-pointer shadow-md"
                      title="Gönder"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
