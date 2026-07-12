import { useState, useEffect } from 'react';
import { getHealthAnalysisAction } from '@/actions/analysis';

export function useHealthAnalysisViewModel() {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month'>('week');
  const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth());
  const [isLoading, setIsLoading] = useState(true);
  
  const [data, setData] = useState({
    calorieData: [] as any[],
    sleepData: [] as any[],
    macroData: [] as any[]
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getHealthAnalysisAction(timeFilter, currentMonthIndex);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeFilter, currentMonthIndex]);

  const handlePrevMonth = () => setCurrentMonthIndex(prev => Math.max(0, prev - 1));
  const handleNextMonth = () => setCurrentMonthIndex(prev => Math.min(11, prev + 1));

  return {
    timeFilter,
    setTimeFilter,
    currentMonthIndex,
    handlePrevMonth,
    handleNextMonth,
    isLoading,
    ...data
  };
}
