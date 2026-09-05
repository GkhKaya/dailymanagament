import React from 'react';
import { Wallet, CreditCard, Building2, Plus, Edit2, ArrowRightLeft } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { formatCurrency } from '@/lib/i18n';

const AccountIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "cash": return <Wallet size={18} />;
    case "credit":
    case "credit_card": return <CreditCard size={18} />;
    case "bank": return <Building2 size={18} />;
    default: return <Wallet size={18} />;
  }
};

export function ManageAccountsForm({ 
  onClose, 
  onOpenAdd,
  onOpenTransfer,
  onOpenEdit,
  accounts 
}: { 
  onClose: () => void,
  onOpenAdd: () => void,
  onOpenTransfer?: () => void,
  onOpenEdit: (id: string) => void,
  accounts: { id: string; name: string; balance: number; type: string }[] 
}) {
  const { locale, isAbroad } = useTranslation();
  const isEn = isAbroad || locale === 'en';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="text-body text-[var(--on-surface-variant)]">
          {isEn ? 'Manage your existing accounts.' : 'Mevcut hesaplarınızı yönetin.'}
        </div>
        <div className="flex gap-2">
          {onOpenTransfer && <button type="button" onClick={onOpenTransfer} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white hover:bg-white/5">
            <ArrowRightLeft size={16} /> {isEn ? 'Transfer' : 'Transfer'}
          </button>}
          <button type="button" onClick={onOpenAdd} className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 font-medium text-black hover:bg-[var(--primary-hover)]">
            <Plus size={16} /> {isEn ? 'Add New' : 'Yeni Ekle'}
          </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        {accounts.length === 0 ? (
          <div className="text-center py-8 text-[var(--on-surface-variant)]">
            {isEn ? 'You have not added any accounts yet.' : 'Henüz hiç hesap eklemediniz.'}
          </div>
        ) : (
          accounts.map((acc) => (
            <div key={acc.id} className="group relative flex min-h-[72px] items-center justify-between gap-3 glass-item px-3 py-3 sm:px-5 sm:py-4">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 shrink-0 rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-[var(--on-surface-variant)]">
                  <AccountIcon type={acc.type} />
                </div>
                <span className="truncate text-sm font-medium sm:text-body">{acc.name}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <span className="text-sm font-bold sm:text-body">{formatCurrency(acc.balance, locale, isAbroad)}</span>
                <button 
                  type="button"
                  aria-label={isEn ? `Edit ${acc.name} account` : `${acc.name} hesabını düzenle`}
                  onClick={() => onOpenEdit(acc.id)}
                  className="min-h-11 min-w-11 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.2)] transition-colors text-white sm:opacity-0 sm:group-hover:opacity-100 sm:min-h-0 sm:min-w-0 sm:p-2"
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
          {isEn ? 'Close' : 'Kapat'}
        </button>
      </div>
    </div>
  );
}
