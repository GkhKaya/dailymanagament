import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useHealthAnalysisViewModel } from '@/viewmodels/useHealthAnalysisViewModel';
import { ExportPdfModal } from '@/components/ui/ExportPdfModal';

export function HealthAnalysis({ onBack }: { onBack: () => void }) {
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const {
    timeFilter,
    setTimeFilter,
    timeOffset,
    handlePrevMonth,
    handleNextMonth,
    isLoading,
    calorieData,
    sleepData,
    macroData
  } = useHealthAnalysisViewModel();

  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 
    'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  
  const formatTimeOffset = () => {
    if (timeOffset === 0) return timeFilter === 'week' ? 'Bu Hafta' : 'Bu Ay';
    if (timeOffset === -1) return timeFilter === 'week' ? 'Geçen Hafta' : 'Geçen Ay';
    
    const now = new Date();
    if (timeFilter === 'month') {
      const d = new Date(now.getFullYear(), now.getMonth() + timeOffset, 1);
      return `${months[d.getMonth()]} ${d.getFullYear()}`;
    }
    
    return `${Math.abs(timeOffset)} Hafta Önce`;
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-6 pb-24 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors">
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Detaylı Sağlık Analizi</h2>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8ec13b]/15 hover:bg-[#8ec13b]/25 border border-[#8ec13b]/20 text-white text-xs font-bold transition-all shrink-0"
              title="PDF Raporu Al"
            >
              <Download size={15} className="text-white" />
              <span>PDF Raporu</span>
            </button>
            <div className="flex bg-[rgba(255,255,255,0.05)] p-1 rounded-xl shrink-0">
              {[
                { id: 'week', label: 'Haftalık' },
                { id: 'month', label: 'Aylık' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setTimeFilter(f.id as any)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-caption font-medium transition-colors ${timeFilter === f.id ? 'bg-[var(--surface-container)] text-white shadow-sm' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center justify-center gap-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-2xl py-3 w-fit mx-auto px-6">
          <button onClick={handlePrevMonth} className="text-[var(--on-surface-variant)] hover:text-white disabled:opacity-50">
            <ChevronLeft size={20} />
          </button>
          <span className="text-body font-bold text-white min-w-[120px] text-center">
            {formatTimeOffset()}
          </span>
          <button onClick={handleNextMonth} disabled={timeOffset >= 0} className="text-[var(--on-surface-variant)] hover:text-white disabled:opacity-50">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
        </div>
      ) : (
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
                <Line type="monotone" dataKey="burned" name="Yakılan (kcal)" stroke="#8ec13b" strokeWidth={3} dot={{ r: 4, fill: '#8ec13b', strokeWidth: 0 }} activeDot={{ r: 6 }} />
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
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[rgba(20,20,25,0.9)] border border-[rgba(255,255,255,0.1)] rounded-xl p-3 shadow-xl">
                          <p className="text-white font-bold mb-1">{data.day}</p>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-[#818cf8]">Süre: {data.sleep} Saat</span>
                            <span className="text-sm text-orange-400">Yakılan: {data.sleepCalories} kcal</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
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
      )}

      <ExportPdfModal 
        isOpen={isPdfModalOpen} 
        onClose={() => setIsPdfModalOpen(false)} 
      />
    </div>
  );
}
