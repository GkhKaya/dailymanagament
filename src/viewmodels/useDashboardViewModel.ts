import toast from 'react-hot-toast';
import { useState, useEffect, useCallback } from 'react';
import { DashboardMode, HealthDataDTO, FinanceDataDTO } from '@/models/DashboardTypes';
import { getHealthDataAction, getFinanceDataAction } from '@/actions/dashboard';

export function useDashboardViewModel() {
  const [mode, setModeState] = useState<DashboardMode>('overview');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.replace('#', '') as DashboardMode;
        if (['overview', 'health', 'finance', 'health-analysis', 'finance-analysis'].includes(hash)) {
          setModeState(hash);
        } else {
          setModeState('overview');
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
  
  const [healthData, setHealthData] = useState<HealthDataDTO | null>(null);
  const [financeData, setFinanceData] = useState<FinanceDataDTO | null>(null);
  
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [isLoadingFinance, setIsLoadingFinance] = useState(false);
  

  const fetchHealthData = useCallback(async (date: Date) => {
    setIsLoadingHealth(true);
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}T00:00:00.000Z`;
      const result = await getHealthDataAction(dateString);
      if (result.success && result.data) {
        setHealthData(result.data);
      } else {
        console.error(result.error);
        toast.error("Sağlık verileri yüklenemedi.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Beklenmedik bir hata oluştu.");
    } finally {
      setIsLoadingHealth(false);
    }
  }, []);

  const fetchFinanceData = useCallback(async () => {
    setIsLoadingFinance(true);
    try {
      const result = await getFinanceDataAction();
      if (result.success && result.data) {
        setFinanceData(result.data);
      } else {
        console.error(result.error);
        toast.error("Finans verileri yüklenemedi.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Beklenmedik bir hata oluştu.");
    } finally {
      setIsLoadingFinance(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await fetchHealthData(currentDate);
    await fetchFinanceData();
  }, [currentDate, fetchHealthData, fetchFinanceData]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

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

  return {
    mode,
    setMode,
    currentDate,
    handlePrevDay,
    handleNextDay,
    healthData,
    financeData,
    isLoadingHealth,
    isLoadingFinance,
    refreshData,
  };
}
