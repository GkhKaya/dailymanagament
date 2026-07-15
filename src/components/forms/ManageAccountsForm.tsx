import React from 'react';
import { Wallet, CreditCard, Building2, Plus, Edit2 } from 'lucide-react';
import { t } from '@/lib/i18n';

const AccountIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "cash": return <Wallet size={18} />;
    case "credit": return <CreditCard size={18} />;
    case "bank": return <Building2 size={18} />;
    default: return <Wallet size={18} />;
  }
};

export function ManageAccountsForm({ 
  onClose, 
  onOpenAdd,
  onOpenEdit,
  accounts 
}: { 
  onClose: () => void,
  onOpenAdd: () => void,
  onOpenEdit: (id: string) => void,
  accounts: { id: string; name: string; balance: number; type: string }[] 
}) {
  const fmt = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="text-body text-[var(--on-surface-variant)]">
          Mevcut hesaplarınızı yönetin.
        </div>
        <button 
          onClick={onOpenAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-black hover:bg-[var(--primary-hover)] transition-all font-medium text-[var(--font-body)]"
        >
          <Plus size={16} />
          Yeni Ekle
        </button>
      </div>
      
      <div className="flex flex-col gap-3">
        {accounts.length === 0 ? (
          <div className="text-center py-8 text-[var(--on-surface-variant)]">
            Henüz hiç hesap eklemediniz.
          </div>
        ) : (
          accounts.map((acc) => (
            <div key={acc.id} className="group relative flex items-center justify-between glass-item px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-[var(--on-surface-variant)]">
                  <AccountIcon type={acc.type} />
                </div>
                <span className="text-body font-medium">{acc.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-body font-bold">{fmt(acc.balance)}</span>
                <button 
                  onClick={() => onOpenEdit(acc.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-full bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] transition-all text-white"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-2">
        <button type="button" onClick={onClose} className="w-full py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
          Kapat
        </button>
      </div>
    </div>
  );
}
