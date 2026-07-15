import React from 'react';
import { useAddWeightViewModel } from '@/viewmodels/useAddWeightViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
  weightHistory: { date: string; weight: number }[];
}) {
  const viewModel = useAddWeightViewModel(currentWeight, currentDate, onSuccess);

  return (
    <div className="flex flex-col gap-6 pt-2">
      {weightHistory && weightHistory.length > 0 ? (
        <div className="w-full h-32 -ml-2 mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightHistory}>
              <XAxis 
                dataKey="date" 
                tickFormatter={(val) => new Date(val).getDate().toString()} 
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
                width={25}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(20,20,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#4ade80' }}
                labelFormatter={(val) => new Date(val).toLocaleDateString('tr-TR')}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#4ade80" 
                strokeWidth={2}
                dot={{ r: 3, fill: '#4ade80', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
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

      {viewModel.error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[var(--font-body)]">
          {viewModel.error}
        </div>
      )}

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
