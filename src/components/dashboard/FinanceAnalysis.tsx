import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';

export function FinanceAnalysis({ onBack }: { onBack: () => void }) {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('month');
  const [currentMonthIndex, setCurrentMonthIndex] = useState(6); // Mock index for July 2026
  
  const months = [
    'Ocak 2026', 'Şubat 2026', 'Mart 2026', 'Nisan 2026', 
    'Mayıs 2026', 'Haziran 2026', 'Temmuz 2026', 'Ağustos 2026'
  ];

  const handlePrevMonth = () => setCurrentMonthIndex(prev => Math.max(0, prev - 1));
  const handleNextMonth = () => setCurrentMonthIndex(prev => Math.min(months.length - 1, prev + 1));

  // Mock data for Income vs Expense
  const barData = [
    { name: 'Hafta 1', income: 4000, expense: 2400 },
    { name: 'Hafta 2', income: 3000, expense: 1398 },
    { name: 'Hafta 3', income: 2000, expense: 9800 },
    { name: 'Hafta 4', income: 2780, expense: 3908 },
  ];

  // Mock data for Categories (Expenses)
  const pieData = [
    { name: 'Market', value: 3400, color: '#4ade80' },
    { name: 'Ulaşım', value: 1200, color: '#60a5fa' },
    { name: 'Eğlence', value: 850, color: '#c084fc' },
    { name: 'Yemek', value: 2100, color: '#fb923c' },
  ];

  // Mock data for Daily Spending Trend
  const lineData = [
    { day: '01', spent: 150 }, { day: '05', spent: 400 }, { day: '10', spent: 120 },
    { day: '15', spent: 850 }, { day: '20', spent: 200 }, { day: '25', spent: 300 },
    { day: '30', spent: 180 }
  ];

  const totalIncome = barData.reduce((acc, curr) => acc + curr.income, 0);
  const totalExpense = barData.reduce((acc, curr) => acc + curr.expense, 0);
  const diff = totalIncome - totalExpense;

  const fmt = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 pb-24 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors">
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h2 className="text-2xl font-bold text-white">Detaylı Finans Analizi</h2>
          </div>
          
          <div className="flex bg-[rgba(255,255,255,0.05)] p-1 rounded-xl">
            {[
              { id: 'week', label: 'Haftalık' },
              { id: 'month', label: 'Aylık' },
              { id: 'year', label: 'Yıllık' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setTimeFilter(f.id as any)}
                className={`px-4 py-2 rounded-lg text-caption font-medium transition-colors ${timeFilter === f.id ? 'bg-[var(--surface-container)] text-white shadow-sm' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center justify-center gap-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-2xl py-3 w-fit mx-auto px-6">
          <button onClick={handlePrevMonth} disabled={currentMonthIndex === 0} className="text-[var(--on-surface-variant)] hover:text-white disabled:opacity-50">
            <ChevronLeft size={20} />
          </button>
          <span className="text-body font-bold text-white min-w-[120px] text-center">
            {months[currentMonthIndex]}
          </span>
          <button onClick={handleNextMonth} disabled={currentMonthIndex === months.length - 1} className="text-[var(--on-surface-variant)] hover:text-white disabled:opacity-50">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-item p-4 flex flex-col items-center justify-center border-b-4 border-b-[#4ade80]">
          <span className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">Toplam Gelir</span>
          <span className="text-xl font-bold text-[#4ade80]">{fmt(totalIncome)}</span>
        </div>
        <div className="glass-item p-4 flex flex-col items-center justify-center border-b-4 border-b-white">
          <span className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">Toplam Gider</span>
          <span className="text-xl font-bold text-white">{fmt(totalExpense)}</span>
        </div>
        <div className="glass-item p-4 flex flex-col items-center justify-center border-b-4 border-b-[#c0c1ff]">
          <span className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">Net Durum</span>
          <span className={`text-xl font-bold ${diff >= 0 ? 'text-[#c0c1ff]' : 'text-orange-400'}`}>
            {diff >= 0 ? '+' : ''}{fmt(diff)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Daily Spending Trend (Full Width) */}
        <div className="glass-item p-6 h-[350px] flex flex-col lg:col-span-2">
          <h3 className="text-body font-bold text-white mb-6">Günlük Harcama Trendi</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(20,20,25,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any) => fmt(value)}
                />
                <Line type="monotone" dataKey="spent" name="Harcama" stroke="#fb923c" strokeWidth={3} dot={{ r: 4, fill: '#fb923c', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income vs Expense Bar Chart */}
        <div className="glass-item p-6 h-[400px] flex flex-col">
          <h3 className="text-body font-bold text-white mb-6">Gelir / Gider Karşılaştırması</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(20,20,25,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="income" name="Gelir" fill="#4ade80" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Gider" fill="#c0c1ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Categories Pie Chart */}
        <div className="glass-item p-6 h-[400px] flex flex-col">
          <h3 className="text-body font-bold text-white mb-2">Harcama Dağılımı</h3>
          <div className="flex-1 w-full min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(20,20,25,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any) => fmt(value as number)}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Custom Legend */}
            <div className="flex justify-center flex-wrap gap-4 mt-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-caption text-[var(--on-surface-variant)]">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
