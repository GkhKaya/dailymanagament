import { useState } from 'react';
import { DashboardMode, HealthDataDTO, FinanceDataDTO } from '@/models/DashboardTypes';

// Mock veriler
const MOCK_HEALTH_DATA: HealthDataDTO = {
  date: new Date().toISOString(),
  targetCalories: 2400,
  consumedCalories: 1450,
  burnedCalories: 450,
  sleepMinutes: 0, // 0 to simulate missing sleep data
  exerciseMinutes: 45,
  meals: [
    { 
      id: '1', type: 'breakfast', foodName: 'Yulaf & Süt', calories: 320,
      foods: [
        { name: 'Yulaf Ezmesi', amount: '50 gr', calories: 190 },
        { name: 'Yarım Yağlı Süt', amount: '200 ml', calories: 90 },
        { name: 'Ceviz', amount: '10 gr', calories: 40 }
      ]
    },
    { 
      id: '2', type: 'lunch', foodName: 'Tavuk Salata', calories: 450,
      foods: [
        { name: 'Izgara Tavuk Göğsü', amount: '200 gr', calories: 330 },
        { name: 'Mevsim Yeşillikleri', amount: '1 porsiyon', calories: 20 },
        { name: 'Zeytinyağı', amount: '1 yemek kaşığı', calories: 100 }
      ]
    },
    { 
      id: '3', type: 'snack', foodName: 'Elma & Badem', calories: 180,
      foods: [
        { name: 'Yeşil Elma', amount: '1 adet', calories: 80 },
        { name: 'Çiğ Badem', amount: '15 gr', calories: 100 }
      ]
    },
    { 
      id: '4', type: 'dinner', foodName: 'Izgara Somon', calories: 500,
      foods: [
        { name: 'Somon Fileto', amount: '150 gr', calories: 310 },
        { name: 'Haşlanmış Brokoli', amount: '100 gr', calories: 35 },
        { name: 'Kinoa', amount: '50 gr', calories: 155 }
      ]
    },
  ],
};

const MOCK_FINANCE_DATA: FinanceDataDTO = {
  totalBalance: 34500,
  monthlyBudget: 12000,
  dailySpend: 450,
  accounts: [
    { id: 'a1', name: 'Nakit Cüzdan', balance: 1500, type: 'cash' },
    { id: 'a2', name: 'Garanti Kredi Kartı', balance: -4500, type: 'credit' },
    { id: 'a3', name: 'Enpara Maaş', balance: 37500, type: 'debit' },
  ],
  recentTransactions: [
    { id: 't1', title: 'Migros Alışverişi', amount: 450, date: 'Bugün, 14:30', type: 'expense' },
    { id: 't2', title: 'Netflix Aboneliği', amount: 150, date: 'Dün, 09:00', type: 'expense' },
    { id: 't3', title: 'Maaş Ödemesi', amount: 45000, date: '01 Tem, 08:00', type: 'income' },
  ],
  categories: [
    { id: 'c1', name: 'Market', type: 'expense' },
    { id: 'c2', name: 'Maaş', type: 'income' },
    { id: 'c3', name: 'Eğlence', type: 'expense' },
  ],
  debts: [
    { id: 'd1', personName: 'Ali', type: 'lent', amount: 2000, remainingAmount: 1000, dueDate: '2026-07-20' },
  ],
  subscriptions: [
    { id: 's1', name: 'Netflix', amount: 150, nextBillingDate: '2026-07-15' },
    { id: 's2', name: 'Spor Salonu', amount: 500, nextBillingDate: '2026-07-10' },
  ]
};

export function useDashboardViewModel() {
  const [mode, setMode] = useState<DashboardMode>('overview');
  // For health date navigation
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

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

  // Override mock data date with current date for demonstration
  const activeHealthData = {
    ...MOCK_HEALTH_DATA,
    date: currentDate.toISOString(),
    // slightly randomize calories based on date just to show UI updates
    consumedCalories: MOCK_HEALTH_DATA.consumedCalories + (currentDate.getDate() % 3) * 100
  };

  return {
    mode,
    setMode,
    currentDate,
    handlePrevDay,
    handleNextDay,
    healthData: activeHealthData,
    financeData: MOCK_FINANCE_DATA,
  };
}
