import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

export function AddTransactionForm({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  // Format today's date to YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex p-1 bg-[rgba(255,255,255,0.05)] rounded-2xl">
        <button 
          onClick={() => setType('expense')}
          className={`flex-1 py-2.5 text-center rounded-xl text-body font-medium transition-all ${type === 'expense' ? 'bg-[var(--inverse-primary)] shadow-sm text-white' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
        >
          Gider
        </button>
        <button 
          onClick={() => setType('income')}
          className={`flex-1 py-2.5 text-center rounded-xl text-body font-medium transition-all ${type === 'income' ? 'bg-[var(--inverse-primary)] shadow-sm text-white' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
        >
          Gelir
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Tutar & Tarih */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Tutar</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-[var(--on-surface-variant)]">₺</span>
              <input 
                type="number" 
                placeholder="0,00" 
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 pl-10 pr-4 text-xl font-semibold text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Tarih</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={18} />
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 pl-10 pr-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Kategori */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Kategori</label>
          <select className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all appearance-none">
            {type === 'expense' ? (
              <>
                <option value="market">Market & Gıda</option>
                <option value="transport">Ulaşım</option>
                <option value="entertainment">Eğlence</option>
                <option value="bills">Faturalar</option>
                <option value="health">Sağlık</option>
              </>
            ) : (
              <>
                <option value="salary">Maaş</option>
                <option value="freelance">Freelance İş</option>
                <option value="investment">Yatırım Getirisi</option>
                <option value="gift">Hediye / Ödül</option>
              </>
            )}
          </select>
        </div>

        {/* Açıklama */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Açıklama</label>
          <input 
            type="text" 
            placeholder="İşlem açıklaması girin..." 
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
          />
        </div>
      </div>

      <div className="mt-2 flex gap-3">
        <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
          İptal
        </button>
        <button onClick={onClose} className={`flex-[2] py-4 rounded-2xl text-white font-bold transition-colors ${type === 'income' ? 'bg-[#4ade80] hover:bg-[#3bca69] text-black' : 'bg-[var(--primary)] hover:bg-[#3d3fb3]'}`}>
          {type === 'income' ? 'Gelir Ekle' : 'Gider Ekle'}
        </button>
      </div>
    </div>
  );
}
