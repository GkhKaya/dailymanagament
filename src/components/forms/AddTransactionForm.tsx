import React, { useState } from 'react';
import { Calendar, ShoppingCart, Car, Film, Coffee, Home, Zap, Heart, Gift, Briefcase, Wallet, TrendingUp, Cpu, Utensils, Music, Book } from 'lucide-react';
import { useAddTransactionViewModel } from '@/viewmodels/useAddTransactionViewModel';

const ICONS = [
  { id: 'cart', component: <ShoppingCart size={24} /> },
  { id: 'car', component: <Car size={24} /> },
  { id: 'film', component: <Film size={24} /> },
  { id: 'coffee', component: <Coffee size={24} /> },
  { id: 'home', component: <Home size={24} /> },
  { id: 'zap', component: <Zap size={24} /> },
  { id: 'heart', component: <Heart size={24} /> },
  { id: 'gift', component: <Gift size={24} /> },
  { id: 'briefcase', component: <Briefcase size={24} /> },
  { id: 'wallet', component: <Wallet size={24} /> },
  { id: 'trending', component: <TrendingUp size={24} /> },
  { id: 'tech', component: <Cpu size={24} /> },
  { id: 'food', component: <Utensils size={24} /> },
  { id: 'music', component: <Music size={24} /> },
  { id: 'book', component: <Book size={24} /> },
];

const getIcon = (id: string) => ICONS.find(i => i.id === id)?.component || <ShoppingCart size={24} />;
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { CustomSelect } from '@/components/ui/CustomSelect';

export function AddTransactionForm({ 
  onClose,
  onSuccess,
  categories, 
  accounts 
}: { 
  onClose: () => void,
  onSuccess: () => void,
  categories: { id: string; name: string; type: string }[],
  accounts: { id: string; name: string }[]
}) {
  const {
    type, setType,
    amount, setAmount,
    date, setDate,
    categoryId, setCategoryId,
    accountId, setAccountId,
    description, setDescription,
    isLoading, error, handleSubmit
  } = useAddTransactionViewModel(onSuccess);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/20 text-red-200 text-sm border border-red-500/30">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex p-1 bg-[rgba(255,255,255,0.05)] rounded-2xl">
        <button 
          type="button"
          onClick={() => { setType('expense'); setCategoryId(''); }}
          className={`flex-1 py-2.5 text-center rounded-xl text-body font-medium transition-all ${type === 'expense' ? 'bg-[var(--primary)] shadow-sm text-black' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
        >
          Gider
        </button>
        <button 
          type="button"
          onClick={() => { setType('income'); setCategoryId(''); }}
          className={`flex-1 py-2.5 text-center rounded-xl text-body font-medium transition-all ${type === 'income' ? 'bg-[var(--primary)] shadow-sm text-black' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
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
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" 
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
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 pl-10 pr-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Hesap */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Hesap</label>
          <CustomSelect 
            required
            value={accountId}
            onChange={setAccountId}
            placeholder="Hesap seçiniz..."
            options={accounts.map(acc => ({ value: acc.id, label: acc.name }))}
          />
        </div>

        {/* Kategori Seçimi (Grid / Dropdown) */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Kategori</label>
          
          <button 
            type="button"
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className="w-full flex items-center justify-between bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 px-4 text-body text-white hover:bg-[rgba(255,255,255,0.05)] transition-all focus:outline-none focus:border-[var(--inverse-primary)]"
          >
            {categoryId ? (
              <div className="flex items-center gap-2">
                <div className={`${type === 'income' ? 'text-[#4ade80]' : 'text-orange-400'}`}>
                  {getIcon((categories.find(c => c.id === categoryId) as any)?.icon || 'cart')}
                </div>
                <span>{categories.find(c => c.id === categoryId)?.name}</span>
              </div>
            ) : (
              <span className="text-[var(--on-surface-variant)]">Kategori seçiniz...</span>
            )}
            <div className={`transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--on-surface-variant)]"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </button>

          {isCategoryOpen && (
            <div className="grid grid-cols-4 gap-3 max-h-[200px] overflow-y-auto hide-scrollbar mt-2 p-2 bg-[rgba(0,0,0,0.2)] rounded-xl border border-[rgba(255,255,255,0.05)]">
              {categories.filter(c => c.type === type).map(c => {
                const isSelected = categoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setCategoryId(c.id); setIsCategoryOpen(false); }}
                    className={`aspect-square flex flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all ${
                      isSelected 
                        ? 'border-[var(--inverse-primary)] bg-[rgba(73,75,214,0.1)] text-[var(--primary)] shadow-md shadow-[var(--primary)]/20' 
                        : 'border-transparent bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.08)]'
                    }`}
                  >
                    <div className={`${type === 'income' ? 'text-[#4ade80]' : 'text-orange-400'}`}>
                      {getIcon((c as any).icon || 'cart')}
                    </div>
                    <span className={`text-[10px] text-center px-1 truncate w-full ${isSelected ? 'font-bold text-white' : 'font-medium group-hover:text-white'}`}>
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Açıklama */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Açıklama (İsteğe Bağlı)</label>
          <input 
            type="text" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Örn: Market alışverişi"
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
          />
        </div>
      </div>

      <div className="mt-2 flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
          İptal
        </button>
        <button type="submit" disabled={isLoading} className={`flex-[2] py-3 rounded-xl text-black font-bold transition-colors flex items-center justify-center ${type === 'income' ? 'bg-[#4ade80] hover:bg-[#3bca69] text-black' : 'bg-[var(--primary)] hover:bg-[#3d3fb3]'}`}>
          {isLoading ? <LoadingSpinner size="sm" /> : (type === 'income' ? 'Gelir Ekle' : 'Gider Ekle')}
        </button>
      </div>
    </form>
  );
}
