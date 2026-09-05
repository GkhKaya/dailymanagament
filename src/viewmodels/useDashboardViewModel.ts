import toast from 'react-hot-toast';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardMode, HealthDataDTO, FinanceDataDTO } from '@/models/DashboardTypes';
import { getHealthDataAction, getFinanceDataAction } from '@/actions/dashboard';
import { isAbroad, getLocale } from '@/lib/i18n';
import { useTranslation } from '@/hooks/useTranslation';

// Module-level caches & in-flight promise deduplication to make screen switches instantaneous (0ms)
let cachedFinanceData: { data: FinanceDataDTO; timestamp: number } | null = null;
let financeInFlightPromise: Promise<{ success: boolean; data?: FinanceDataDTO; error?: string }> | null = null;

const healthCacheMap = new Map<string, { data: HealthDataDTO; timestamp: number }>();
const healthInFlightMap = new Map<string, Promise<{ success: boolean; data?: HealthDataDTO; error?: string }>>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds fresh cache

export function useDashboardViewModel() {
  const router = useRouter();
  const { locale, isAbroad: userAbroad } = useTranslation();
  const isEn = userAbroad || locale === 'en' || isAbroad() || getLocale() === 'en';
  const [mode, setModeState] = useState<DashboardMode>('overview');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.replace('#', '') as DashboardMode;
        if (['overview', 'health', 'finance', 'stocks', 'health-analysis', 'finance-analysis', 'stocks-analysis'].includes(hash)) {
          setModeState(hash);
        } else {
          setModeState('overview');
          // Clear hash if invalid
          if (window.location.hash) {
            window.history.pushState(null, '', window.location.pathname);
          }
        }
      }
    };

    handleHashChange(); // Set initial on mount
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const setMode = useCallback((newMode: DashboardMode) => {
    if (typeof window !== 'undefined') {
      window.location.hash = newMode;
    } else {
      setModeState(newMode);
    }
  }, []);
  
  const [healthData, setHealthData] = useState<HealthDataDTO | null>(() => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const cached = healthCacheMap.get(key);
    return (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) ? cached.data : null;
  });

  const [financeData, setFinanceData] = useState<FinanceDataDTO | null>(() => {
    return (cachedFinanceData && Date.now() - cachedFinanceData.timestamp < CACHE_TTL_MS) ? cachedFinanceData.data : null;
  });
  
  const [isLoadingHealth, setIsLoadingHealth] = useState(!healthData);
  const [isLoadingFinance, setIsLoadingFinance] = useState(!financeData);
  

  const fetchHealthData = useCallback(async (date: Date, force = false) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    const dateString = `${dateKey}T00:00:00.000Z`;

    // 1. Serve from cache if fresh and not forced
    const cached = healthCacheMap.get(dateKey);
    if (!force && cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      setHealthData(cached.data);
      setIsLoadingHealth(false);
      return;
    }

    // 2. Deduplicate in-flight requests for the same date
    if (healthInFlightMap.has(dateKey)) {
      try {
        const result = await healthInFlightMap.get(dateKey);
        if (result?.success && result.data) {
          setHealthData(result.data);
        }
      } finally {
        setIsLoadingHealth(false);
      }
      return;
    }

    setIsLoadingHealth(true);
    const fetchPromise = getHealthDataAction(dateString);
    healthInFlightMap.set(dateKey, fetchPromise);

    try {
      const result = await fetchPromise;
      if (result.success && result.data) {
        healthCacheMap.set(dateKey, { data: result.data, timestamp: Date.now() });
        setHealthData(result.data);
      } else {
        console.error(result.error);
        toast.error("Sağlık verileri yüklenemedi.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Beklenmedik bir hata oluştu.");
    } finally {
      healthInFlightMap.delete(dateKey);
      setIsLoadingHealth(false);
    }
  }, []);

  const fetchFinanceData = useCallback(async (force = false) => {
    // 1. Serve from cache if fresh and not forced
    if (!force && cachedFinanceData && (Date.now() - cachedFinanceData.timestamp < CACHE_TTL_MS)) {
      setFinanceData(cachedFinanceData.data);
      setIsLoadingFinance(false);
      return;
    }

    // 2. Deduplicate in-flight requests
    if (financeInFlightPromise) {
      try {
        const result = await financeInFlightPromise;
        if (result?.success && result.data) {
          setFinanceData(result.data);
        }
      } finally {
        setIsLoadingFinance(false);
      }
      return;
    }

    setIsLoadingFinance(true);
    financeInFlightPromise = getFinanceDataAction();

    try {
      const result = await financeInFlightPromise;
      if (result.success && result.data) {
        cachedFinanceData = { data: result.data, timestamp: Date.now() };
        setFinanceData(result.data);
      } else {
        console.error(result.error);
        toast.error("Finans verileri yüklenemedi.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Beklenmedik bir hata oluştu.");
    } finally {
      financeInFlightPromise = null;
      setIsLoadingFinance(false);
    }
  }, []);

  // Fetch health data when currentDate changes
  useEffect(() => {
    fetchHealthData(currentDate);
  }, [currentDate, fetchHealthData]);

  // Fetch finance data once on mount
  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  // Explicit refresh (bypasses cache when a modal adds transactions/meals)
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchHealthData(currentDate, true),
      fetchFinanceData(true)
    ]);
  }, [currentDate, fetchHealthData, fetchFinanceData]);

  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleAddBmr = async () => {
    if (healthData && (!healthData.hasHealthProfile || !healthData.isBmrCalculable || (healthData.currentWeight || 0) <= 0)) {
      toast.error(
        isEn
          ? "Please complete your weight, height, and age to calculate BMR."
          : "BMR hesaplayabilmemiz için lütfen önce boy, kilo ve yaş bilgilerinizi girin."
      );
      router.push('/onboarding?step=health');
      return;
    }

    try {
      const { addBMRAction } = await import('@/actions/health');
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}T00:00:00.000Z`;
      
      const res = await addBMRAction(dateString);
      if (res.success) {
        toast.success(isEn ? `BMR added: ${res.bmr} kcal` : `BMR eklendi: ${res.bmr} kcal`);
        await fetchHealthData(currentDate, true);
      } else {
        let msg = res.error;
        if (isEn) {
          if (msg?.includes("BMR hesaplamak") || msg?.includes("doğum tarihi") || msg?.includes("eksiksiz olmalıdır")) {
            msg = "Height, weight, and birth date are required to calculate BMR.";
          } else if (msg?.includes("zaten eklenmiş")) {
            msg = "BMR has already been added for today.";
          }
        }
        toast.error(msg || (isEn ? "Failed to add BMR." : "BMR eklenirken bir hata oluştu."));
        if (!healthData?.hasHealthProfile || !healthData?.isBmrCalculable) {
          router.push('/onboarding?step=health');
        }
      }
    } catch (e) {
      toast.error(isEn ? "An unexpected error occurred." : "Beklenmedik bir hata oluştu.");
    }
  };

  return {
    mode, setMode,
    currentDate,
    healthData, financeData,
    isLoadingHealth, isLoadingFinance,
    handlePrevDay, handleNextDay,
    handleAddBmr,
    refreshData
  };
}
