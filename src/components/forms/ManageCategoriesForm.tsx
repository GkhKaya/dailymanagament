import React, { useState } from 'react';
import { ShoppingCart, Car, Film, Coffee, Home, Zap, Heart, Gift, Briefcase, Plus, X, ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Cpu, Utensils, Music, Book } from 'lucide-react';

const ICONS = [
  { id: 'cart', component: <ShoppingCart size={20} /> },
  { id: 'car', component: <Car size={20} /> },
  { id: 'film', component: <Film size={20} /> },
  { id: 'coffee', component: <Coffee size={20} /> },
  { id: 'home', component: <Home size={20} /> },
  { id: 'zap', component: <Zap size={20} /> },
  { id: 'heart', component: <Heart size={20} /> },
  { id: 'gift', component: <Gift size={20} /> },
  { id: 'briefcase', component: <Briefcase size={20} /> },
  { id: 'wallet', component: <Wallet size={20} /> },
  { id: 'trending', component: <TrendingUp size={20} /> },
  { id: 'tech', component: <Cpu size={20} /> },
  { id: 'food', component: <Utensils size={20} /> },
  { id: 'music', component: <Music size={20} /> },
  { id: 'book', component: <Book size={20} /> },
];

interface Category {
  id: string;
  name: string;
  iconId: string;
  type: 'expense' | 'income';
}

export function ManageCategoriesForm({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'expense' | 'income'>('expense');
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('cart');

  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Market', iconId: 'cart', type: 'expense' },
    { id: '2', name: 'Ulaşım', iconId: 'car', type: 'expense' },
    { id: '3', name: 'Eğlence', iconId: 'film', type: 'expense' },
    { id: '4', name: 'Dışarıda Yemek', iconId: 'coffee', type: 'expense' },
    { id: '5', name: 'Maaş', iconId: 'briefcase', type: 'income' },
    { id: '6', name: 'Yatırım', iconId: 'trending', type: 'income' },
    { id: '7', name: 'Hediye', iconId: 'gift', type: 'income' },
  ]);

  const displayedCats = categories.filter(c => c.type === tab);

  const getIcon = (id: string) => ICONS.find(i => i.id === id)?.component || <ShoppingCart size={20} />;

  const handleDelete = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleAdd = () => {
    if (!newCatName.trim()) return;
    setCategories(prev => [...prev, {
      id: Date.now().toString(),
      name: newCatName,
      iconId: selectedIcon,
      type: tab
    }]);
    setNewCatName('');
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Tabs */}
      <div className="flex p-1 bg-[rgba(255,255,255,0.05)] rounded-2xl">
        <button 
          onClick={() => { setTab('expense'); setIsAdding(false); }}
          className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-xl text-body font-medium transition-all ${tab === 'expense' ? 'bg-[var(--surface-container)] shadow-sm text-white' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
        >
          <ArrowDownRight size={16} className={tab === 'expense' ? 'text-orange-400' : ''} />
          Gider
        </button>
        <button 
          onClick={() => { setTab('income'); setIsAdding(false); }}
          className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-xl text-body font-medium transition-all ${tab === 'income' ? 'bg-[var(--surface-container)] shadow-sm text-white' : 'text-[var(--on-surface-variant)] hover:text-white'}`}
        >
          <ArrowUpRight size={16} className={tab === 'income' ? 'text-[#4ade80]' : ''} />
          Gelir
        </button>
      </div>

      {!isAdding ? (
        <>
          {/* Category Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto hide-scrollbar pb-4 animate-fade-in">
            {displayedCats.map(cat => (
              <div key={cat.id} className="relative group glass-item aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl hover:bg-[rgba(255,255,255,0.08)] transition-colors">
                <button 
                  onClick={() => handleDelete(cat.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                >
                  <X size={12} />
                </button>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-[rgba(255,255,255,0.05)] ${tab === 'income' ? 'text-[#4ade80]' : 'text-orange-400'}`}>
                  {getIcon(cat.iconId)}
                </div>
                <span className="text-caption text-center px-1 truncate w-full text-[var(--on-surface-variant)] group-hover:text-white transition-colors">{cat.name}</span>
              </div>
            ))}
            
            {/* Add Button Box */}
            <button 
              onClick={() => setIsAdding(true)}
              className="aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[rgba(255,255,255,0.1)] hover:border-[var(--inverse-primary)] hover:bg-[rgba(73,75,214,0.1)] text-[var(--on-surface-variant)] hover:text-[var(--inverse-primary)] transition-all"
            >
              <Plus size={24} />
              <span className="text-caption font-medium">Ekle</span>
            </button>
          </div>
        </>
      ) : (
        /* Add Category Form */
        <div className="flex flex-col gap-4 animate-fade-in glass-item p-4">
          <h3 className="text-body font-bold text-white mb-2">Yeni {tab === 'income' ? 'Gelir' : 'Gider'} Kategorisi</h3>
          
          <input 
            type="text" 
            placeholder="Kategori Adı" 
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-3 px-4 text-body text-white focus:outline-none focus:border-[var(--inverse-primary)] transition-all"
          />

          <div className="flex flex-col gap-2 mt-2">
            <span className="text-caption text-[var(--on-surface-variant)]">İkon Seçin</span>
            <div className="grid grid-cols-5 gap-2">
              {ICONS.map(icon => (
                <button 
                  key={icon.id}
                  onClick={() => setSelectedIcon(icon.id)}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all ${selectedIcon === icon.id ? 'bg-[var(--inverse-primary)] text-white shadow-md' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.08)]'}`}
                >
                  {icon.component}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <button onClick={() => setIsAdding(false)} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
              İptal
            </button>
            <button onClick={handleAdd} className="flex-[2] py-3 rounded-xl bg-[var(--inverse-primary)] hover:bg-[var(--inverse-primary-hover)] text-white font-bold transition-colors">
              Kaydet
            </button>
          </div>
        </div>
      )}

      {!isAdding && (
        <div className="mt-2">
          <button onClick={onClose} className="w-full py-4 rounded-2xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
            Kapat
          </button>
        </div>
      )}
    </div>
  );
}
