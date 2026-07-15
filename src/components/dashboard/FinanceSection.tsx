import React from "react";
import { FinanceDataDTO } from "@/models/DashboardTypes";
import { t } from "@/lib/i18n";
import { Plus, Home, ShoppingCart, DollarSign, Wifi, CreditCard, Building2, Wallet, Activity, Tag, Repeat } from "lucide-react";

interface FinanceSectionProps {
  data: FinanceDataDTO;
  isOverview?: boolean;
  onOpenSheet?: (type: string, payload?: unknown) => void;
  onShowAnalysis?: () => void;
}

const TxnIcon = ({ title }: { title: string }) => {
  const tLow = title.toLowerCase();
  if (tLow.includes("kira") || tLow.includes("konut")) return <Home size={18} />;
  if (tLow.includes("market") || tLow.includes("gıda")) return <ShoppingCart size={18} />;
  if (tLow.includes("maaş") || tLow.includes("gelir")) return <DollarSign size={18} />;
  if (tLow.includes("fatura") || tLow.includes("internet")) return <Wifi size={18} />;
  return <CreditCard size={18} />;
};

export function FinanceSection({ data, isOverview = true, onOpenSheet, onShowAnalysis }: FinanceSectionProps) {
  const fmt = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(val);

  // Group transactions by date
  const grouped = data.recentTransactions.reduce((acc, txn) => {
    const datePart = txn.date.split(',')[0].toUpperCase();
    if (!acc[datePart]) acc[datePart] = { txns: [], net: 0 };
    acc[datePart].txns.push(txn);
    acc[datePart].net += txn.type === 'income' ? txn.amount : -txn.amount;
    return acc;
  }, {} as Record<string, { txns: typeof data.recentTransactions, net: number }>);

  return (
    <div className={`flex flex-col gap-[var(--space-6)] w-full max-w-2xl mx-auto animate-slide-up`}>
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-hero text-white tracking-tight">Finansal Durum</h2>
        {!isOverview && (
          <button onClick={onShowAnalysis} className="ml-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors text-[var(--primary)]">
            <Activity size={18} />
          </button>
        )}
      </div>

      {/* Metrics & Management */}
      <div className="flex flex-col md:flex-row gap-[var(--space-2)]">
        {/* Left Side: Main Metric Cards */}
        <div className="flex flex-col gap-[var(--space-2)] flex-1">
          {/* TOPLAM BAKIYE */}
          <div className="glass-card p-[var(--space-4)] flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <span className="text-caption text-[var(--primary)]">TOPLAM BAKİYE</span>
              <div className="flex items-baseline gap-1">
                <span className="text-metric text-white">{fmt(data.totalBalance)}</span>
              </div>
            </div>
          </div>

          {/* GELIR / GIDER */}
          <div className="grid grid-cols-2 gap-[var(--space-2)]">
            <div className="glass-card p-[var(--space-3)] flex items-center justify-between">
              <span className="text-caption text-[var(--on-surface-variant)]">GELİR</span>
              <span className="text-headline text-[var(--color-income)]">+{fmt(data.monthlyIncome)}</span>
            </div>
            <div className="glass-card p-[var(--space-3)] flex items-center justify-between">
              <span className="text-caption text-[var(--on-surface-variant)]">GİDER</span>
              <span className="text-headline text-[var(--color-expense)]">-{fmt(data.monthlyExpense)}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Management Buttons */}
        {!isOverview && (
          <div className="flex flex-col gap-2 w-full md:w-48">
            <button onClick={() => onOpenSheet && onOpenSheet('manageAccounts')} className="glass-card p-3 flex items-center justify-between hover:bg-white/5 transition-colors text-sm font-medium text-white flex-1">
              Hesaplar <Wallet size={16} className="text-[var(--on-surface-variant)]" />
            </button>
            <button onClick={() => onOpenSheet && onOpenSheet('categories')} className="glass-card p-3 flex items-center justify-between hover:bg-white/5 transition-colors text-sm font-medium text-white flex-1">
              Kategoriler <Tag size={16} className="text-[var(--on-surface-variant)]" />
            </button>
            <button onClick={() => onOpenSheet && onOpenSheet('debts')} className="glass-card p-3 flex items-center justify-between hover:bg-white/5 transition-colors text-sm font-medium text-white flex-1">
              Borçlar <CreditCard size={16} className="text-[var(--on-surface-variant)]" />
            </button>
            <button onClick={() => onOpenSheet && onOpenSheet('subscriptions')} className="glass-card p-3 flex items-center justify-between hover:bg-white/5 transition-colors text-sm font-medium text-white flex-1">
              Abonelikler <Repeat size={16} className="text-[var(--on-surface-variant)]" />
            </button>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="mt-[var(--space-4)]">
        <div className="flex items-center justify-between mb-[var(--space-3)]">
          <div className="flex items-center gap-[var(--space-2)]">
            <h3 className="text-caption text-[var(--on-surface-variant)]">İŞLEM GEÇMİŞİ</h3>
            <button 
              onClick={() => onOpenSheet && onOpenSheet('transaction')}
              className="w-5 h-5 rounded-full border border-[var(--primary)] text-[var(--primary)] flex items-center justify-center hover:bg-[var(--primary)] hover:text-black transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
          <span className="text-caption text-[var(--on-surface-variant)] uppercase">TEMMUZ 2024</span>
        </div>
        
        <div className="flex flex-col gap-[var(--space-4)]">
          {Object.entries(grouped).map(([date, groupData]) => (
            <div key={date} className="flex flex-col gap-[var(--space-2)]">
              <div className="flex items-center justify-between px-1">
                <span className="text-caption text-[var(--on-surface-variant)]">{date}</span>
                <span className={`text-caption ${groupData.net > 0 ? 'text-[var(--color-income)]' : 'text-[var(--on-surface-variant)]'}`}>
                  GÜNLÜK: {groupData.net > 0 ? '+' : ''}{fmt(groupData.net)}
                </span>
              </div>
              <div className="flex flex-col gap-[var(--space-1)]">
                {groupData.txns.map((txn) => {
                  const isIncome = txn.type === 'income';
                  return (
                    <div key={txn.id} className="flex items-center justify-between px-2 py-[var(--space-2)] hover:bg-[rgba(255,255,255,0.02)] rounded-[var(--radius-card)] transition-colors">
                      <div className="flex items-center gap-[var(--space-3)]">
                        <div className="w-12 h-12 rounded-[var(--radius-input)] bg-[var(--surface-container)] flex items-center justify-center text-[var(--on-surface-variant)]">
                          <TxnIcon title={txn.title} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-body font-bold text-white">{txn.title}</span>
                          <span className="text-caption text-[var(--on-surface-variant)] tracking-normal mt-0.5 capitalize">
                            {txn.category || "Diğer"}
                          </span>
                        </div>
                      </div>
                      <span className={`text-headline ${isIncome ? 'text-[var(--color-income)]' : 'text-[var(--color-expense)]'}`}>
                        {isIncome ? '+' : '-'}{fmt(txn.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>

      {!isOverview && <div className="h-24"></div>}
    </div>
  );
}
