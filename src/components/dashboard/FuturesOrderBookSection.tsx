'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  Search, 
  RefreshCw, 
  SlidersHorizontal, 
  Layers, 
  Percent, 
  DollarSign, 
  Calendar 
} from 'lucide-react';
import { 
  getFuturesDashboardAction, 
  deleteFuturesTradeAction, 
  FuturesTradeDTO, 
  FuturesDashboardDTO 
} from '@/actions/futures';
import { AddFuturesTradeModal } from '@/components/forms/AddFuturesTradeModal';
import { CloseFuturesPositionModal } from '@/components/forms/CloseFuturesPositionModal';
import { TradingAccountSelector } from '@/components/stocks/TradingAccountSelector';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTranslation } from '@/hooks/useTranslation';
import toast from 'react-hot-toast';

interface FuturesOrderBookSectionProps {
  selectedAccount?: string;
  onSelectAccount?: (account: string) => void;
  availableAccounts?: string[];
  onAccountsUpdated?: (accounts: string[]) => void;
}

export function FuturesOrderBookSection({
  selectedAccount: parentAccount,
  onSelectAccount: parentSetAccount,
  availableAccounts: parentAccounts,
  onAccountsUpdated: parentOnAccountsUpdated
}: FuturesOrderBookSectionProps = {}) {
  const { locale, isAbroad: userAbroad } = useTranslation();
  const isEn = userAbroad || locale === 'en';

  const [data, setData] = useState<FuturesDashboardDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [internalAccount, setInternalAccount] = useState<string>('all');
  const [internalAccounts, setInternalAccounts] = useState<string[]>(['Ana Hesap', 'Demo Hesabı']);

  const activeAccount = parentAccount !== undefined ? parentAccount : internalAccount;
  const setActiveAccount = parentSetAccount || setInternalAccount;
  const accountsList = parentAccounts && parentAccounts.length > 0 ? parentAccounts : internalAccounts;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [sideFilter, setSideFilter] = useState<'all' | 'long' | 'short'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTrade, setEditTrade] = useState<FuturesTradeDTO | null>(null);
  const [closeTrade, setCloseTrade] = useState<FuturesTradeDTO | null>(null);

  const fetchDashboard = useCallback(async (accountToFetch = activeAccount) => {
    setIsLoading(true);
    try {
      const res = await getFuturesDashboardAction({ account: accountToFetch });
      if (res.success && res.data) {
        setData(res.data);
        if (res.data.accounts && res.data.accounts.length > 0) {
          setInternalAccounts(res.data.accounts);
          if (parentOnAccountsUpdated) {
            parentOnAccountsUpdated(res.data.accounts);
          }
        }
      } else {
        toast.error(res.error || (isEn ? "Could not load futures trades." : "Vadeli işlemler yüklenemedi."));
      }
    } catch (err: any) {
      toast.error(err.message || (isEn ? "An unexpected error occurred." : "Beklenmedik bir hata oluştu."));
    } finally {
      setIsLoading(false);
    }
  }, [activeAccount, isEn, parentOnAccountsUpdated]);

  useEffect(() => {
    fetchDashboard(activeAccount);
  }, [fetchDashboard, activeAccount]);

  const handleDelete = async (tradeId: string, symbol: string) => {
    if (!window.confirm(isEn ? `Delete ${symbol} trade?` : `${symbol} işlemini silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const res = await deleteFuturesTradeAction(tradeId);
      if (res.success) {
        toast.success(isEn ? "Trade deleted." : "İşlem silindi.");
        fetchDashboard();
      } else {
        toast.error(res.error || (isEn ? "Failed to delete trade." : "İşlem silinemedi."));
      }
    } catch {
      toast.error(isEn ? "Connection error." : "Bağlantı hatası.");
    }
  };

  // Filtered trades
  const filteredTrades = useMemo(() => {
    if (!data?.trades) return [];

    return data.trades.filter((t) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toUpperCase();
        const matchesSymbol = t.symbol.toUpperCase().includes(q);
        const matchesNotes = t.notes ? t.notes.toUpperCase().includes(q) : false;
        if (!matchesSymbol && !matchesNotes) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && t.status !== statusFilter) {
        return false;
      }

      // Side filter
      if (sideFilter !== 'all' && t.side !== sideFilter) {
        return false;
      }

      return true;
    });
  }, [data?.trades, searchQuery, statusFilter, sideFilter]);

  // Group trades by day for daily trade journal ("günlük tutmak")
  const groupedTrades = useMemo(() => {
    const map: Record<string, { dateLabel: string; trades: FuturesTradeDTO[]; dailyPnl: number; closedCount: number }> = {};

    for (const t of filteredTrades) {
      const d = new Date(t.entry_date);
      const key = d.toISOString().slice(0, 10);
      if (!map[key]) {
        const isToday = new Date().toISOString().slice(0, 10) === key;
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const isYesterday = yesterday === key;
        let dateLabel = d.toLocaleDateString(isEn ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        if (isToday) dateLabel = `${isEn ? 'TODAY' : 'BUGÜN'} · ${dateLabel}`;
        else if (isYesterday) dateLabel = `${isEn ? 'YESTERDAY' : 'DÜN'} · ${dateLabel}`;

        map[key] = {
          dateLabel,
          trades: [],
          dailyPnl: 0,
          closedCount: 0
        };
      }
      map[key].trades.push(t);
      if (t.status === 'closed') {
        map[key].dailyPnl += t.pnl || 0;
        map[key].closedCount += 1;
      }
    }
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredTrades, isEn]);

  const summary = data?.summary || {
    totalRealizedPnl: 0,
    openPositionsCount: 0,
    totalActiveMargin: 0,
    closedTradesCount: 0,
    winningTradesCount: 0,
    losingTradesCount: 0,
    winRate: 0,
    longCount: 0,
    shortCount: 0
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Net Realized PnL */}
        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
              {isEn ? "NET REALIZED PNL" : "TOPLAM GERÇEKLEŞEN K/Z"}
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              summary.totalRealizedPnl >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {summary.totalRealizedPnl >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-bold font-mono ${
              summary.totalRealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {summary.totalRealizedPnl >= 0 ? `+$${summary.totalRealizedPnl}` : `-$${Math.abs(summary.totalRealizedPnl)}`}
            </div>
            <span className="text-[11px] text-white/40 mt-0.5 block">
              {summary.closedTradesCount} {isEn ? "closed trades" : "kapanan işlem"}
            </span>
          </div>
        </div>

        {/* Open Positions & Margin */}
        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
              {isEn ? "ACTIVE POSITIONS" : "AÇIK POZİSYONLAR"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Layers size={15} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-white">
              {summary.openPositionsCount}
            </div>
            <span className="text-[11px] text-white/40 mt-0.5 block font-mono">
              ${summary.totalActiveMargin} {isEn ? "in margin" : "bağlı teminat"}
            </span>
          </div>
        </div>

        {/* Win Rate */}
        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
              {isEn ? "WIN RATE" : "KAZANMA ORANI"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#8ec13b]/20 text-[#8ec13b] flex items-center justify-center">
              <Percent size={15} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-[#8ec13b]">
              %{summary.winRate}
            </div>
            <span className="text-[11px] text-white/40 mt-0.5 block">
              {summary.winningTradesCount} {isEn ? "wins" : "kazanç"} / {summary.losingTradesCount} {isEn ? "losses" : "kayıp"}
            </span>
          </div>
        </div>

        {/* Long vs Short Ratio */}
        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
              {isEn ? "DIRECTION SPLIT" : "İŞLEM DAĞILIMI"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <SlidersHorizontal size={15} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-sm font-bold text-emerald-400 font-mono">{summary.longCount}L</span>
              <span className="text-white/30 mx-1">/</span>
              <span className="text-sm font-bold text-rose-400 font-mono">{summary.shortCount}S</span>
            </div>
            <span className="text-[11px] text-white/40">
              {data?.trades.length || 0} {isEn ? "total" : "toplam"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Filter Toolbar & Action Buttons ── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
        {/* Left: Status Filter Tabs & Direction */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {isEn ? "All" : "Tümü"} ({data?.trades.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('open')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              statusFilter === 'open'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>{isEn ? "Open Positions" : "Açık Pozisyonlar"} ({summary.openPositionsCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('closed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'closed'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {isEn ? "Closed Trades" : "Kapananlar"} ({summary.closedTradesCount})
          </button>

          {/* Direction Filter Toggle */}
          <div className="h-4 w-px bg-white/10 mx-1" />
          <button
            type="button"
            onClick={() => setSideFilter(sideFilter === 'long' ? 'all' : 'long')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              sideFilter === 'long'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-white/50 hover:text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            LONG
          </button>
          <button
            type="button"
            onClick={() => setSideFilter(sideFilter === 'short' ? 'all' : 'short')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              sideFilter === 'short'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-white/50 hover:text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            SHORT
          </button>
        </div>

        {/* Right Side: Account Selector, Search & Add Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Account Selector in Futures Order Book */}
          <TradingAccountSelector
            accounts={accountsList}
            selectedAccount={activeAccount}
            onSelectAccount={setActiveAccount}
            onAccountsUpdated={(newAccs) => {
              setInternalAccounts(newAccs);
              if (parentOnAccountsUpdated) parentOnAccountsUpdated(newAccs);
            }}
            isEn={isEn}
          />

          <div className="relative flex-1 sm:w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder={isEn ? "Search pair/notes..." : "Parite veya not ara..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#8ec13b] transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => { setEditTrade(null); setIsAddModalOpen(true); }}
            className="px-3.5 py-1.5 rounded-xl bg-[#8ec13b] hover:bg-[#79aa32] text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>{isEn ? "New Trade" : "Yeni İşlem"}</span>
          </button>
        </div>
      </div>

      {/* ── Trades Order Book List ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : filteredTrades.length === 0 ? (
        /* Empty State */
        <div className="p-8 sm:p-12 rounded-2xl bg-white/[0.01] border border-dashed border-white/10 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
            <Layers size={24} />
          </div>
          <div className="flex flex-col gap-1 max-w-sm">
            <h4 className="text-sm font-bold text-white">
              {isEn ? "No futures trades found" : "Vadeli işlem kaydı bulunamadı"}
            </h4>
            <p className="text-xs text-[var(--on-surface-variant)] leading-relaxed">
              {activeAccount !== 'all' 
                ? (isEn ? `No recorded trades found for ${activeAccount}.` : `"${activeAccount}" hesabı için henüz işlem kaydı bulunmuyor.`)
                : (isEn 
                    ? "Start tracking your leveraged Long and Short positions, target prices, and trade journal notes." 
                    : "Kaldıraçlı Long ve Short işlemlerinizi, kâr/zarar hedeflerinizi ve analiz notlarınızı buradan takip edebilirsiniz.")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setEditTrade(null); setIsAddModalOpen(true); }}
            className="mt-2 px-4 py-2 rounded-xl bg-[#8ec13b] hover:bg-[#79aa32] text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>{isEn ? "Open First Position" : "İlk Pozisyonu Ekle"}</span>
          </button>
        </div>
      ) : (
        /* Daily Grouped Trades Journal View ("günlük tutmak") */
        <div className="flex flex-col gap-6">
          {groupedTrades.map(([dateKey, group]) => (
            <div key={dateKey} className="flex flex-col gap-3">
              {/* Daily Header */}
              <div className="flex items-center justify-between px-1.5 pt-1 border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#8ec13b]" />
                  <span className="text-xs font-bold text-white tracking-wide uppercase">
                    {group.dateLabel}
                  </span>
                  <span className="text-[11px] text-white/40">
                    ({group.trades.length} {isEn ? "trades" : "işlem"})
                  </span>
                </div>
                {group.closedCount > 0 && (
                  <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border ${
                    group.dailyPnl >= 0 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                  }`}>
                    {isEn ? "Daily: " : "Günlük Net: "}{group.dailyPnl >= 0 ? `+$${group.dailyPnl.toFixed(2)}` : `-$${Math.abs(group.dailyPnl).toFixed(2)}`}
                  </span>
                )}
              </div>

              {/* Trade Cards Grid for this day */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {group.trades.map((t) => {
                  const isLong = t.side === 'long';
                  const isOpen = t.status === 'open';
                  const isClosed = t.status === 'closed';
                  const isDemoTrade = t.account && t.account.toLowerCase().includes('demo');

                  return (
                    <div
                      key={t.id}
                      className="glass-card p-4 rounded-2xl flex flex-col justify-between gap-3 border border-white/[0.06] hover:border-white/15 transition-all group/card"
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Direction Badge */}
                          <div className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 ${
                            isLong 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {isLong ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            <span>{t.side.toUpperCase()}</span>
                            <span className="opacity-80">· {t.leverage}x</span>
                          </div>

                          {/* Symbol, Market & Account */}
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-white tracking-tight truncate font-mono">
                                {t.symbol}
                              </span>
                              {isDemoTrade && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  DEMO
                                </span>
                              )}
                              {t.account && !isDemoTrade && t.account !== 'Ana Hesap' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  {t.account}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-white/40 uppercase tracking-wider">
                              {t.market} · {t.account || 'Ana Hesap'}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge & Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                            isOpen
                              ? 'bg-blue-500/15 text-blue-300 border-blue-500/30 flex items-center gap-1'
                              : 'bg-white/5 text-white/50 border-white/10'
                          }`}>
                            {isOpen && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                            {isOpen ? (isEn ? "Open" : "Açık") : (isEn ? "Closed" : "Kapandı")}
                          </span>

                          <button
                            type="button"
                            onClick={() => { setEditTrade(t); setIsAddModalOpen(true); }}
                            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title={isEn ? "Edit" : "Düzenle"}
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id, t.symbol)}
                            className="p-1 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title={isEn ? "Delete" : "Sil"}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                        <div>
                          <span className="text-[10px] text-white/40 uppercase block">{isEn ? "Entry" : "Giriş"}</span>
                          <span className="text-xs font-bold text-white font-mono">{t.entry_price}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-white/40 uppercase block">
                            {isOpen ? (isEn ? "Margin" : "Teminat") : (isEn ? "Exit" : "Çıkış")}
                          </span>
                          <span className="text-xs font-bold text-white font-mono">
                            {isOpen ? `$${t.margin}` : (t.exit_price || '--')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-white/40 uppercase block">{isEn ? "Size" : "Büyüklük"}</span>
                          <span className="text-xs font-bold text-white font-mono">${t.size}</span>
                        </div>
                      </div>

                      {/* SL / TP & Realized PnL */}
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <div className="flex items-center gap-2 text-[10px]">
                          {t.stop_loss && (
                            <span className="text-rose-400 font-mono">SL: {t.stop_loss}</span>
                          )}
                          {t.take_profit && (
                            <span className="text-emerald-400 font-mono">TP: {t.take_profit}</span>
                          )}
                          {!t.stop_loss && !t.take_profit && (
                            <span className="text-white/30">{new Date(t.entry_date).toLocaleTimeString(isEn ? 'en-US' : 'tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                        </div>

                        {/* PnL if closed */}
                        {isClosed && (
                          <div className={`font-mono font-bold text-xs flex items-baseline gap-1 ${
                            t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            <span>{t.pnl >= 0 ? `+$${t.pnl}` : `-$${Math.abs(t.pnl)}`}</span>
                            <span className="text-[10px] opacity-75">
                              ({t.pnl_percent >= 0 ? `+${t.pnl_percent}%` : `${t.pnl_percent}%`})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* ── Trade Notes & Strategy Journal (Requested by user) ── */}
                      {t.notes ? (
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2">
                          <FileText size={13} className="text-[#8ec13b] shrink-0 mt-0.5" />
                          <p className="text-[11px] text-white/80 leading-relaxed line-clamp-3 break-words whitespace-pre-wrap flex-1">
                            {t.notes}
                          </p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setEditTrade(t); setIsAddModalOpen(true); }}
                          className="py-1.5 px-2 rounded-lg border border-dashed border-white/10 text-white/40 hover:text-white/80 hover:border-white/20 text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus size={11} />
                          <span>{isEn ? "Add trade notes / strategy" : "İşleme not ekle"}</span>
                        </button>
                      )}

                      {/* Close Position Button if Open */}
                      {isOpen && (
                        <button
                          type="button"
                          onClick={() => setCloseTrade(t)}
                          className="w-full py-2 rounded-xl bg-white/5 hover:bg-emerald-500 hover:text-black text-white/90 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/10 hover:border-emerald-500 shadow-sm mt-1"
                        >
                          <CheckCircle2 size={13} />
                          <span>{isEn ? "Close Position" : "Pozisyonu Kapat"}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddFuturesTradeModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditTrade(null); }}
        onSuccess={fetchDashboard}
        editTrade={editTrade}
        isEn={isEn}
      />

      {/* Close Position Modal */}
      <CloseFuturesPositionModal
        isOpen={!!closeTrade}
        onClose={() => setCloseTrade(null)}
        onSuccess={fetchDashboard}
        trade={closeTrade}
        isEn={isEn}
      />
    </div>
  );
}
