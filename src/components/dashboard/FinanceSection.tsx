import React from "react";
import { FinanceDataDTO } from "@/models/DashboardTypes";
import { t } from "@/lib/i18n";
import { ArrowUpRight, ArrowDownRight, Wallet, CreditCard, Building2, LayoutGrid, Receipt, CalendarCheck, Plus, TrendingUp, Edit2 } from "lucide-react";

interface FinanceSectionProps {
  data: FinanceDataDTO;
  isOverview?: boolean;
  onOpenSheet?: (type: string, payload?: any) => void;
  onShowAnalysis?: () => void;
}

const AccountIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "cash": return <Wallet size={18} />;
    case "credit": return <CreditCard size={18} />;
    case "bank": return <Building2 size={18} />;
    default: return <Wallet size={18} />;
  }
};

export function FinanceSection({ data, isOverview = true, onOpenSheet, onShowAnalysis }: FinanceSectionProps) {
  const fmt = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  // Reusable components for both views
  const HeaderStats = () => (
    <div className="flex flex-col items-center justify-center relative mt-2 py-4 gap-4">
      <div className="absolute w-full h-20 rounded-full bg-[rgba(73,75,214,0.1)] blur-xl -z-10"></div>
      
      {/* Row 1: Balance */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 w-full justify-center items-center text-body">
        <div className="flex items-center gap-2">
          <span className="text-[var(--on-surface-variant)] uppercase tracking-wider text-xs">{t("dashboard.finance.totalBalance")}:</span>
          <span className="font-semibold text-lg text-white">{fmt(data.totalBalance)}</span>
        </div>
      </div>

      {/* Row 2: Income and Expense */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 w-full justify-center items-center text-body">
        <div className="flex items-center gap-2">
          <span className="text-[var(--on-surface-variant)] uppercase tracking-wider text-xs">Aylık Gelir:</span>
          <span className="font-medium text-[#4ade80]">+{fmt(data.monthlyIncome)}</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-[rgba(255,255,255,0.2)]"></div>
        <div className="flex items-center gap-2">
          <span className="text-[var(--on-surface-variant)] uppercase tracking-wider text-xs">Aylık Gider:</span>
          <span className="font-medium text-orange-400">-{fmt(data.monthlyExpense)}</span>
        </div>
      </div>
    </div>
  );

  const TransactionsList = () => {
    // Group transactions by date and calculate daily net
    const grouped = data.recentTransactions.reduce((acc, txn) => {
      // txn.date is like "Bugün, 14:30" or "12 Tem, 14:30"
      const datePart = txn.date.split(',')[0];
      if (!acc[datePart]) acc[datePart] = { txns: [], net: 0 };
      acc[datePart].txns.push(txn);
      acc[datePart].net += txn.type === 'income' ? txn.amount : -txn.amount;
      return acc;
    }, {} as Record<string, { txns: typeof data.recentTransactions, net: number }>);

    return (
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-subtitle">{t("dashboard.finance.recentTransactions")}</h3>
          <button 
            onClick={() => onOpenSheet && onOpenSheet('transaction')}
            className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).map(([date, groupData]) => (
            <div key={date} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">{date}</span>
                <span className={`text-caption font-semibold ${groupData.net > 0 ? 'text-[#4ade80]' : groupData.net < 0 ? 'text-orange-400' : 'text-[var(--on-surface-variant)]'}`}>
                  {groupData.net > 0 ? '+' : ''}{fmt(groupData.net)}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {groupData.txns.map((txn) => {
                  const isIncome = txn.type === 'income';
                  return (
                    <div key={txn.id} className="flex items-center justify-between glass-item px-5 py-3">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center ${isIncome ? 'text-[#4ade80]' : 'text-orange-400'}`}>
                          {isIncome ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-body font-medium">{txn.title}</span>
                          <span className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
                            {txn.date.split(', ')[1]}
                          </span>
                        </div>
                      </div>
                      <span className={`text-body font-bold ${isIncome ? 'text-[#4ade80]' : 'text-white'}`}>
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
    );
  };

  // The Overview Layout (1 column)
  if (isOverview) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto animate-slide-up anim-delay-100">
        <HeaderStats />
        <TransactionsList />
      </div>
    );
  }

  // Format Current Month and Year
  const rawMonthName = new Date().toLocaleString('tr-TR', { month: 'long' });
  const monthName = rawMonthName.charAt(0).toUpperCase() + rawMonthName.slice(1);
  const currentMonthYear = `${monthName} ${new Date().getFullYear()}`;

  // Detailed Layout (2 columns on lg, 1 on small)
  return (
    <div className="w-full mt-8 animate-slide-up anim-delay-100 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
      
      {/* LEFT COLUMN: Overview & Transactions */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">{currentMonthYear}</h2>
          <button 
            onClick={onShowAnalysis}
            className="px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] text-white font-medium transition-all flex items-center gap-2 text-sm"
          >
            <TrendingUp size={16} className="text-[#4ade80]" />
            Detaylı Analiz
          </button>
        </div>
        <HeaderStats />
        <TransactionsList />
        <div className="h-24 lg:hidden"></div>
      </div>

      {/* RIGHT COLUMN: Accounts & Management */}
      <div className="flex flex-col gap-8">
        
        {/* Accounts List (Vertical) */}
        <div>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-subtitle">{t("dashboard.finance.accounts")}</h3>
            <button 
              onClick={() => onOpenSheet && onOpenSheet('addAccount')}
              className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {data.accounts.map((acc) => (
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
                    onClick={() => onOpenSheet && onOpenSheet('editAccount', acc)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-full bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] transition-all text-white"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Management Panels */}
        <div>
          <h3 className="text-subtitle mb-4 px-2">Yönetim</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            
            <button onClick={() => onOpenSheet && onOpenSheet('categories')} className="flex items-center gap-4 glass-item px-5 py-4 hover:bg-[rgba(255,255,255,0.06)] transition-colors text-left">
              <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#c0c1ff]">
                <LayoutGrid size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-body font-medium">Kategori Yönetimi</span>
                <span className="text-caption text-[var(--on-surface-variant)]">Bütçe ve Limitler</span>
              </div>
            </button>

            <button onClick={() => onOpenSheet && onOpenSheet('debts')} className="flex items-center gap-4 glass-item px-5 py-4 hover:bg-[rgba(255,255,255,0.06)] transition-colors text-left">
              <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-orange-400">
                <Receipt size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-body font-medium">Borç Yönetimi</span>
                <span className="text-caption text-[var(--on-surface-variant)]">Verecekler listesi</span>
              </div>
            </button>

            <button onClick={() => onOpenSheet && onOpenSheet('subscriptions')} className="flex items-center gap-4 glass-item px-5 py-4 hover:bg-[rgba(255,255,255,0.06)] transition-colors text-left">
              <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#4ade80]">
                <CalendarCheck size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-body font-medium">Abonelikler</span>
                <span className="text-caption text-[var(--on-surface-variant)]">Aktif 3 Abonelik</span>
              </div>
            </button>

          </div>
        </div>

        <div className="h-24"></div>
      </div>
      
    </div>
  );
}
