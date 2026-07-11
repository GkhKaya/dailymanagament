import React from 'react';
import { Calendar } from 'lucide-react';
import { useAddTransactionViewModel } from '@/viewmodels/useAddTransactionViewModel';
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
          className={`flex-1 py-2.5 text-center rounded-xl text-body font-medium transition-all ${type === 'expense' ? 'bg-[var(--inverse-primary)] shadow-sm text-white' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
        >
          Gider
        </button>
        <button 
          type="button"
          onClick={() => { setType('income'); setCategoryId(''); }}
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

        {/* Kategori */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Kategori</label>
          <CustomSelect 
            required
            value={categoryId}
            onChange={setCategoryId}
            placeholder="Kategori seçiniz..."
            options={categories.filter(c => c.type === type).map(c => ({ value: c.id, label: c.name }))}
          />
        </div>

        {/* Açıklama */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Açıklama</label>
          <input 
            type="text" 
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="İşlem açıklaması girin..." 
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
          />
        </div>
      </div>

      <div className="mt-2 flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
          İptal
        </button>
        <button type="submit" disabled={isLoading} className={`flex-[2] py-3 rounded-xl text-white font-bold transition-colors flex items-center justify-center ${type === 'income' ? 'bg-[#4ade80] hover:bg-[#3bca69] text-black' : 'bg-[var(--primary)] hover:bg-[#3d3fb3]'}`}>
          {isLoading ? <LoadingSpinner size="sm" /> : (type === 'income' ? 'Gelir Ekle' : 'Gider Ekle')}
        </button>
      </div>
    </form>
  );
}
