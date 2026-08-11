import { useState, useEffect } from 'react';
import { getFinanceAnalysisAction } from '@/actions/analysis';

export function useFinanceAnalysisViewModel() {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('month');
  const [timeOffset, setTimeOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const [data, setData] = useState({
    totalIncome: 0,
    totalExpense: 0,
    barData: [] as any[],
    pieData: [] as any[],
    lineData: [] as any[]
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getFinanceAnalysisAction(timeFilter, timeOffset);
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
