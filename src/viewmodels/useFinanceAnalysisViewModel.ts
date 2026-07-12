import { useState, useEffect } from 'react';
import { getFinanceAnalysisAction } from '@/actions/analysis';

export function useFinanceAnalysisViewModel() {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('month');
  const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth());
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
      const res = await getFinanceAnalysisAction(timeFilter, currentMonthIndex);
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
