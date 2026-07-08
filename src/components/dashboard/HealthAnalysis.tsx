import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export function HealthAnalysis({ onBack }: { onBack: () => void }) {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month'>('week');
  const [currentMonthIndex, setCurrentMonthIndex] = useState(6); // Mock index for July 2026
  
  const months = [
    'Ocak 2026', 'Şubat 2026', 'Mart 2026', 'Nisan 2026', 
    'Mayıs 2026', 'Haziran 2026', 'Temmuz 2026', 'Ağustos 2026'
  ];

  const handlePrevMonth = () => setCurrentMonthIndex(prev => Math.max(0, prev - 1));
  const handleNextMonth = () => setCurrentMonthIndex(prev => Math.min(months.length - 1, prev + 1));

  const calorieData = [
    { day: 'Pzt', consumed: 2200, burned: 2400 },
    { day: 'Sal', consumed: 2400, burned: 2100 },
    { day: 'Çar', consumed: 2100, burned: 2600 },
    { day: 'Per', consumed: 1900, burned: 2200 },
    { day: 'Cum', consumed: 2500, burned: 2300 },
    { day: 'Cmt', consumed: 2800, burned: 2800 },
    { day: 'Paz', consumed: 2300, burned: 2100 },
  ];

  const sleepData = [
    { day: 'Pzt', sleep: 7.5 },
    { day: 'Sal', sleep: 6.8 },
    { day: 'Çar', sleep: 8.0 },
    { day: 'Per', sleep: 7.2 },
    { day: 'Cum', sleep: 6.5 },
    { day: 'Cmt', sleep: 9.0 },
    { day: 'Paz', sleep: 8.5 },
  ];

  const macroData = [
    { name: 'Karbonhidrat', value: 45, color: '#c0c1ff' },
    { name: 'Protein', value: 30, color: '#4ade80' },
    { name: 'Yağ', value: 25, color: '#fb923c' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 pb-24 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors">
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h2 className="text-2xl font-bold text-white">Detaylı Sağlık Analizi</h2>
          </div>
          
          <div className="flex bg-[rgba(255,255,255,0.05)] p-1 rounded-xl">
            {[
              { id: 'week', label: 'Haftalık' },
              { id: 'month', label: 'Aylık' }
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calorie Trend Line Chart (Full Width) */}
        <div className="glass-item p-6 h-[400px] flex flex-col lg:col-span-2">
          <h3 className="text-body font-bold text-white mb-6">Kalori Alım / Yakım Trendi</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calorieData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(20,20,25,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="consumed" name="Alınan (kcal)" stroke="#c0c1ff" strokeWidth={3} dot={{ r: 4, fill: '#c0c1ff', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="burned" name="Yakılan (kcal)" stroke="#4ade80" strokeWidth={3} dot={{ r: 4, fill: '#4ade80', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sleep Hours Bar Chart */}
        <div className="glass-item p-6 h-[350px] flex flex-col">
          <h3 className="text-body font-bold text-white mb-6">Uyku Süreleri (Saat)</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(20,20,25,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="sleep" name="Uyku Süresi" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Macros Pie Chart */}
        <div className="glass-item p-6 h-[350px] flex flex-col">
          <h3 className="text-body font-bold text-white mb-2">Makro Besin Dağılımı</h3>
          <div className="flex-1 w-full min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {macroData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(20,20,25,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any) => `${value}%`}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Custom Legend */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <span className="text-2xl font-bold text-white">100%</span>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {macroData.map((item) => (
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
