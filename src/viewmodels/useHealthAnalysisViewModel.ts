import { useState, useEffect } from 'react';
import { getHealthAnalysisAction } from '@/actions/analysis';

export function useHealthAnalysisViewModel() {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month'>('week');
  const [timeOffset, setTimeOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const [data, setData] = useState({
    calorieData: [] as any[],
    sleepData: [] as any[],
    macroData: [] as any[]
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getHealthAnalysisAction(timeFilter, timeOffset);
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
  }, [timeFilter, timeOffset]);

  const handlePrevMonth = () => setTimeOffset(prev => prev - 1);
  const handleNextMonth = () => setTimeOffset(prev => prev + 1);

  return {
    timeFilter,
    setTimeFilter,
    timeOffset,
    handlePrevMonth,
    handleNextMonth,
    isLoading,
    ...data
  };
}
