import React, { useState } from 'react';
import { CalendarClock, PlaySquare, Music, Dumbbell, Plus } from 'lucide-react';

export function ManageSubscriptionsForm({ onClose }: { onClose: () => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [category, setCategory] = useState<'entertainment' | 'health' | 'other'>('entertainment');

  const fmt = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  const subscriptions = [
    { id: '1', name: 'Netflix', price: 150, billingDate: '12', icon: <PlaySquare size={18} /> },
    { id: '2', name: 'Spotify', price: 40, billingDate: '15', icon: <Music size={18} /> },
    { id: '3', name: 'MacFit', price: 450, billingDate: '01', icon: <Dumbbell size={18} /> },
  ];

  const totalMonthly = subscriptions.reduce((acc, sub) => acc + sub.price, 0);

  return (
    <div className="flex flex-col gap-6">
      {!isAdding ? (
        <>
          <div className="glass-item p-4 flex flex-col items-center justify-center border-l-4 border-l-[#c0c1ff]">
            <span className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">Aylık Toplam Gider</span>
            <span className="text-2xl font-bold text-white">{fmt(totalMonthly)}</span>
          </div>

          <div className="flex flex-col gap-3">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="glass-item px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[var(--on-surface-variant)]">
                    {sub.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-body font-medium">{sub.name}</span>
                    <span className="text-caption text-[var(--on-surface-variant)] flex items-center gap-1">
                      <CalendarClock size={12} /> Her ayın {sub.billingDate}. günü
                    </span>
                  </div>
                </div>
                <span className="text-body font-bold text-white">
                  {fmt(sub.price)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-2 flex gap-3">
            <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
              Kapat
            </button>
            <button onClick={() => setIsAdding(true)} className="flex-[2] py-4 rounded-2xl bg-[var(--inverse-primary)] hover:bg-[var(--inverse-primary-hover)] text-white font-bold transition-colors flex items-center justify-center gap-2">
              <Plus size={20} />
              <span>Abonelik Ekle</span>
            </button>
          </div>
        </>
      ) : (
        /* Yeni Abonelik Ekleme Formu */
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Abonelik Adı</label>
            <input 
              type="text" 
              placeholder="Örn: Netflix, Spotify..." 
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Kategori</label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setCategory('entertainment')}
                className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${category === 'entertainment' ? 'border-[var(--inverse-primary)] bg-[rgba(192,193,255,0.1)] text-white' : 'border-[rgba(255,255,255,0.1)] text-[var(--on-surface-variant)] hover:border-[rgba(255,255,255,0.2)]'}`}
              >
                <PlaySquare size={16} /> Eğlence
              </button>
              <button 
                onClick={() => setCategory('health')}
                className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${category === 'health' ? 'border-[var(--inverse-primary)] bg-[rgba(192,193,255,0.1)] text-white' : 'border-[rgba(255,255,255,0.1)] text-[var(--on-surface-variant)] hover:border-[rgba(255,255,255,0.2)]'}`}
              >
                <Dumbbell size={16} /> Sağlık
              </button>
              <button 
                onClick={() => setCategory('other')}
                className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${category === 'other' ? 'border-[var(--inverse-primary)] bg-[rgba(192,193,255,0.1)] text-white' : 'border-[rgba(255,255,255,0.1)] text-[var(--on-surface-variant)] hover:border-[rgba(255,255,255,0.2)]'}`}
              >
                Diğer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Aylık Ücret</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-[var(--on-surface-variant)]">₺</span>
                <input 
                  type="number" 
                  placeholder="0,00" 
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 pl-10 pr-4 text-body font-semibold text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Kesim Günü</label>
              <div className="relative">
                <CalendarClock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={18} />
                <input 
                  type="number" 
                  min="1" max="31"
                  placeholder="1-31" 
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 pl-10 pr-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={() => setIsAdding(false)} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
              İptal
            </button>
            <button onClick={() => setIsAdding(false)} className="flex-[2] py-3 rounded-xl bg-[var(--inverse-primary)] hover:bg-[var(--inverse-primary-hover)] text-white font-bold transition-colors">
              Kaydet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
