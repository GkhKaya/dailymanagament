import React from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { useFinanceAnalysisViewModel } from '@/viewmodels/useFinanceAnalysisViewModel';

export function FinanceAnalysis({ onBack }: { onBack: () => void }) {
  const {
    timeFilter,
    setTimeFilter,
    currentMonthIndex,
    handlePrevMonth,
    handleNextMonth,
    isLoading,
    totalIncome,
    totalExpense,
    barData,
    pieData,
    lineData
  } = useFinanceAnalysisViewModel();

  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 
    'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  
  const currentYear = new Date().getFullYear();

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
            {months[currentMonthIndex]} {currentYear}
          </span>
          <button onClick={handleNextMonth} disabled={currentMonthIndex === 11} className="text-[var(--on-surface-variant)] hover:text-white disabled:opacity-50">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
        </div>
      ) : (
        <>
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
      </>
      )}
    </div>
  );
}
