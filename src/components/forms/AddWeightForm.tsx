import React from 'react';
import { useAddWeightViewModel } from '@/viewmodels/useAddWeightViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const d = new Date(item.date);
    const dateStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    const timeStr = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return (
      <div className="bg-[#161622] border border-[#4ade80]/30 rounded-xl p-2 shadow-2xl">
        <div className="text-[10px] text-gray-400 font-medium">{dateStr} {timeStr !== '00:00' ? timeStr : ''}</div>
        <div className="text-sm font-bold text-[#4ade80] mt-0.5">{item.weight} kg</div>
      </div>
    );
  }
  return null;
};

export function AddWeightForm({
  onClose,
  onSuccess,
  currentWeight,
  currentDate,
  weightHistory
}: {
  onClose: () => void;
  onSuccess: () => void;
  currentWeight: number;
  currentDate: string;
  weightHistory: { id?: string; date: string; weight: number; note?: string }[];
}) {
  const viewModel = useAddWeightViewModel(currentWeight, currentDate, onSuccess);

  return (
    <div className="flex flex-col gap-6 pt-2">
      {weightHistory && weightHistory.length > 0 ? (
        <div className="w-full h-40 -ml-2 mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightHistory} margin={{ top: 18, right: 10, left: -10, bottom: 0 }}>
              <XAxis 
                dataKey="date" 
                tickFormatter={(val) => new Date(val).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} 
                stroke="rgba(255,255,255,0.2)" 
                fontSize={10}
                tickMargin={8}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={['dataMin - 1', 'dataMax + 1']} 
                stroke="rgba(255,255,255,0.2)" 
                fontSize={10}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#4ade80" 
                strokeWidth={2}
                dot={{ r: 4, fill: '#4ade80', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                label={{ fill: '#4ade80', fontSize: 10, position: 'top', dy: -6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-4 px-2 mb-2 bg-[rgba(255,255,255,0.02)] rounded-xl border border-[rgba(255,255,255,0.05)]">
          <p className="text-caption text-[var(--on-surface-variant)]">
            Henüz grafik oluşturacak kadar kilo geçmişiniz yok. Yeni kilonuzu kaydettikçe burada değişim grafiği oluşacaktır.
          </p>
        </div>
      )}

      <form onSubmit={viewModel.handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-body font-medium text-white">Güncel Kilonuz (kg)</label>
        <input 
          type="number"
          step="0.1"
          className="form-input text-[var(--font-headline)]"
          placeholder="Örn: 75.5"
          value={viewModel.weight}
          onChange={(e) => viewModel.setWeight(e.target.value)}
          required
          autoFocus
        />
        <p className="text-caption text-[var(--on-surface-variant)] mt-1">
          Kilonuzu güncellediğinizde günlük hedef kaloriniz (TDEE) otomatik olarak yeniden hesaplanacaktır.
        </p>
      </div>

      

      <button 
        type="submit" 
        className="btn-primary mt-2"
        disabled={viewModel.loading}
      >
        {viewModel.loading ? <LoadingSpinner size="sm" /> : 'Kaydet'}
      </button>
    </form>
    </div>
  );
}
