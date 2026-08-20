"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus, 
  DollarSign, 
  PieChart, 
  ListOrdered, 
  History, 
  Edit3, 
  Trash2, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Tag, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  Sparkles,
  Trophy,
  Filter
} from "lucide-react";
import { getStockPortfolioAction, deleteStockTradeAction } from "@/actions/stocks";
import { StockPortfolioDTO, StockPositionDTO, StockTradeDTO } from "@/models/DashboardTypes";
import { AddStockTradeModal } from "@/components/forms/AddStockTradeModal";
import { UpdateStockPriceModal } from "@/components/forms/UpdateStockPriceModal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export function StocksSection() {
  const [portfolio, setPortfolio] = useState<StockPortfolioDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'positions' | 'realized' | 'trades'>('positions');
  const [searchQuery, setSearchQuery] = useState('');
  const [tradeFilter, setTradeFilter] = useState<'all' | 'buy' | 'sell'>('all');

  // Modals state
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeModalType, setTradeModalType] = useState<'buy' | 'sell'>('buy');
  const [tradeModalSymbol, setTradeModalSymbol] = useState('');
  const [editTrade, setEditTrade] = useState<StockTradeDTO | null>(null);

  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [priceModalPosition, setPriceModalPosition] = useState<StockPositionDTO | null>(null);

  const fetchPortfolio = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getStockPortfolioAction();
      if (res.success && res.data) {
        setPortfolio(res.data);
      } else {
        toast.error(res.error || "Borsa verileri alınamadı.");
      }
    } catch (err: any) {
      toast.error(err.message || "Beklenmedik bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleOpenBuy = (symbol = '') => {
    setEditTrade(null);
    setTradeModalType('buy');
    setTradeModalSymbol(symbol);
    setIsTradeModalOpen(true);
  };

  const handleOpenSell = (symbol = '') => {
    setEditTrade(null);
    setTradeModalType('sell');
    setTradeModalSymbol(symbol);
    setIsTradeModalOpen(true);
  };

  const handleEditTrade = (trade: StockTradeDTO) => {
    setEditTrade(trade);
    setTradeModalType(trade.type);
    setTradeModalSymbol(trade.symbol);
    setIsTradeModalOpen(true);
  };

  const handleDeleteTrade = async (tradeId: string, symbol: string) => {
    if (!confirm(`${symbol} işlemini silmek istediğinizden emin misiniz? Bu işlem maliyetleri ve kâr/zararı yeniden hesaplayacaktır.`)) {
      return;
    }

    try {
      const res = await deleteStockTradeAction(tradeId);
      if (res.success) {
        toast.success("İşlem silindi ve hesaplamalar güncellendi!");
        fetchPortfolio();
      } else {
        toast.error(res.error || "Silme işlemi başarısız.");
      }
    } catch (err: any) {
      toast.error(err.message || "Hata oluştu.");
    }
  };

  const handleOpenPriceModal = (position: StockPositionDTO) => {
    setPriceModalPosition(position);
    setIsPriceModalOpen(true);
  };

  if (isLoading && !portfolio) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner />
        <p className="text-sm text-[var(--on-surface-variant)] mt-3">Borsa portföyü ve kâr/zarar hesaplanıyor...</p>
      </div>
    );
  }

  const totals = portfolio?.totals || {
    totalInvestedCost: 0,
    totalCurrentValue: 0,
    totalUnrealizedPnl: 0,
    totalUnrealizedPnlPercent: 0,
    totalRealizedPnl: 0,
    totalRealizedPnlPercent: 0,
    winningTradesCount: 0,
    losingTradesCount: 0,
    winRate: 0,
    totalBuyVolume: 0,
    totalSellVolume: 0,
  };

  const openPositions = (portfolio?.positions || []).filter(p => 
    !searchQuery || p.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const realizedTrades = (portfolio?.realizedTrades || []).filter(t => 
    !searchQuery || t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || (t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const allTrades = (portfolio?.allTrades || []).filter(t => {
    const matchesSearch = !searchQuery || t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || (t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = tradeFilter === 'all' || t.type === tradeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-fade-in">
      
      {/* ── HEADER BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5 sm:gap-3">
            <span className="p-1.5 sm:p-2 rounded-2xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] shrink-0">
              <TrendingUp size={22} className="sm:w-6 sm:h-6" />
            </span>
            Borsa & Portföy Takibi
          </h1>
          <p className="text-[11px] sm:text-sm text-[var(--on-surface-variant)] mt-0.5 sm:mt-1">
            Hisse alım-satım emirleriniz, kademeli maliyet ve anlık kâr/zarar defteri
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleOpenBuy()}
            className="px-3.5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
          >
            <Plus size={16} /> Alış Emri Gir
          </button>
          <button
            type="button"
            onClick={() => handleOpenSell()}
            className="px-3.5 py-2.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
          >
            <Minus size={16} /> Satış Yap
          </button>
        </div>
      </div>

      {/* ── TOP STATS OVERVIEW CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* 1. Realized Profit / Loss (Gerçekleşen Kâr/Zarar) */}
        <div className={`glass-card p-3.5 sm:p-5 rounded-3xl border flex flex-col justify-between transition-all ${
          totals.totalRealizedPnl >= 0
            ? 'bg-emerald-500/5 border-emerald-500/25 shadow-[0_8px_30px_rgba(16,185,129,0.08)]'
            : 'bg-rose-500/5 border-rose-500/25 shadow-[0_8px_30px_rgba(244,63,94,0.08)]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
              Net Kâr / Zarar
            </span>
            <span className={`p-1 sm:p-1.5 rounded-xl ${
              totals.totalRealizedPnl >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {totals.totalRealizedPnl >= 0 ? <ArrowUpRight size={14} className="sm:w-4 sm:h-4" /> : <ArrowDownRight size={14} className="sm:w-4 sm:h-4" />}
            </span>
          </div>

          <div className="my-1.5 sm:my-2">
            <div className={`text-lg sm:text-3xl font-black truncate ${
              totals.totalRealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {totals.totalRealizedPnl >= 0 ? '+' : ''}
              {totals.totalRealizedPnl.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
            </div>
            <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
              <span className={`text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${
                totals.totalRealizedPnlPercent >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {totals.totalRealizedPnlPercent >= 0 ? '+' : ''}%{totals.totalRealizedPnlPercent.toFixed(2)} Getiri
              </span>
            </div>
          </div>

          <div className="text-[10px] sm:text-[11px] text-[var(--on-surface-variant)] pt-1.5 sm:pt-2 border-t border-white/5 flex items-center justify-between">
            <span>Kârlı: <strong className="text-emerald-400">{totals.winningTradesCount}</strong></span>
            <span>Zararlı: <strong className="text-rose-400">{totals.losingTradesCount}</strong></span>
          </div>
        </div>

        {/* 2. Open Positions Total Cost (Açık Yatırım Maliyeti) */}
        <div className="glass-card p-3.5 sm:p-5 rounded-3xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
              Açık Portföy
            </span>
            <span className="p-1 sm:p-1.5 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
              <DollarSign size={14} className="sm:w-4 sm:h-4" />
            </span>
          </div>

          <div className="my-1.5 sm:my-2">
            <div className="text-lg sm:text-3xl font-black text-white truncate">
              {totals.totalInvestedCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
            </div>
            <p className="text-[10px] sm:text-xs text-[var(--on-surface-variant)] mt-0.5 sm:mt-1 truncate">
              {portfolio?.positions.length || 0} açık hisse
            </p>
          </div>

          <div className="text-[10px] sm:text-[11px] text-[var(--on-surface-variant)] pt-1.5 sm:pt-2 border-t border-white/5 flex items-center justify-between">
            <span>Alış: <strong>{totals.totalBuyVolume.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺</strong></span>
          </div>
        </div>

        {/* 3. Win Rate (Başarı Oranı) */}
        <div className="glass-card p-3.5 sm:p-5 rounded-3xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
              Başarı (Win Rate)
            </span>
            <span className="p-1 sm:p-1.5 rounded-xl bg-amber-500/15 text-amber-400">
              <Trophy size={14} className="sm:w-4 sm:h-4" />
            </span>
          </div>

          <div className="my-1.5 sm:my-2">
            <div className="text-lg sm:text-3xl font-black text-amber-300">
              %{totals.winRate.toFixed(1)}
            </div>
            <div className="w-full bg-black/40 h-1.5 sm:h-2 rounded-full mt-1.5 sm:mt-2 overflow-hidden border border-white/5">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, totals.winRate))}%` }}
              />
            </div>
          </div>

          <div className="text-[10px] sm:text-[11px] text-[var(--on-surface-variant)] pt-1.5 sm:pt-2 border-t border-white/5 flex items-center justify-between">
            <span>{totals.winningTradesCount} Kâr / {totals.losingTradesCount} Zarar</span>
          </div>
        </div>

        {/* 4. Top Winner Stock */}
        <div className="glass-card p-3.5 sm:p-5 rounded-3xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
              Lider Hisse
            </span>
            <span className="p-1 sm:p-1.5 rounded-xl bg-purple-500/15 text-purple-400">
              <Sparkles size={14} className="sm:w-4 sm:h-4" />
            </span>
          </div>

          <div className="my-1.5 sm:my-2">
            {totals.topProfitableSymbol ? (
              <>
                <div className="text-lg sm:text-3xl font-black text-emerald-400 tracking-wider truncate">
                  {totals.topProfitableSymbol.symbol}
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-emerald-300 mt-0.5 sm:mt-1 truncate">
                  +{totals.topProfitableSymbol.pnl.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺ Kâr
                </p>
              </>
            ) : (
              <>
                <div className="text-base sm:text-xl font-bold text-white/50">Satış Yok</div>
                <p className="text-[10px] sm:text-xs text-[var(--on-surface-variant)] mt-0.5 sm:mt-1">İlk satış bekleniyor</p>
              </>
            )}
          </div>

          <div className="text-[10px] sm:text-[11px] text-[var(--on-surface-variant)] pt-1.5 sm:pt-2 border-t border-white/5 truncate">
            Satış: <strong>{totals.totalSellVolume.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺</strong>
          </div>
        </div>
      </div>

      {/* ── TABS & SEARCH BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        
        {/* Navigation Tabs */}
        <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5 overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('positions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'positions'
                ? 'bg-[var(--primary)] text-black shadow-sm'
                : 'text-[var(--on-surface-variant)] hover:text-white'
            }`}
          >
            <PieChart size={14} /> Açık Portföy ({portfolio?.positions.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('realized')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'realized'
                ? 'bg-[var(--primary)] text-black shadow-sm'
                : 'text-[var(--on-surface-variant)] hover:text-white'
            }`}
          >
            <TrendingUp size={14} /> Gerçekleşen Kâr/Zarar ({portfolio?.realizedTrades.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trades')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'trades'
                ? 'bg-[var(--primary)] text-black shadow-sm'
                : 'text-[var(--on-surface-variant)] hover:text-white'
            }`}
          >
            <ListOrdered size={14} /> Emir Defteri ({portfolio?.allTrades.length || 0})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex items-center min-w-[220px]">
          <Search size={14} className="absolute left-3.5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hisse sembolü ara (THYAO...)"
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {/* ── TAB 1: OPEN POSITIONS (PORTFÖYÜM) ── */}
      {activeTab === 'positions' && (
        <div className="flex flex-col gap-3">
          {openPositions.length === 0 ? (
            <div className="glass-card p-10 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)]">
                <PieChart size={28} />
              </div>
              <h3 className="text-base font-bold text-white">Açık Pozisyon Bulunmuyor</h3>
              <p className="text-xs text-[var(--on-surface-variant)] max-w-md">
                Portföyünüzde henüz hisse bulunmuyor. İlk hisse alış emrinizi girerek maliyet ve kâr/zarar takibine başlayın.
              </p>
              <button
                type="button"
                onClick={() => handleOpenBuy()}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-black font-bold text-xs flex items-center gap-2 hover:opacity-90 shadow-md"
              >
                <Plus size={15} /> İlk Hisse Alışını Ekle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openPositions.map((pos) => (
                <div 
                  key={pos.symbol}
                  className="glass-card p-5 rounded-3xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-4 group"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-2xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 flex items-center justify-center text-white font-black text-sm tracking-wider">
                        {pos.symbol.slice(0, 4)}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                          {pos.symbol}
                        </h4>
                        <p className="text-[11px] text-[var(--on-surface-variant)] truncate max-w-[150px]">
                          {pos.name || "Borsa İstanbul"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-white">{pos.total_lots}</span>
                      <span className="text-[10px] text-[var(--on-surface-variant)] block">Lot</span>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-black/40 rounded-2xl border border-white/5 text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider block">Ort. Maliyet</span>
                      <span className="font-bold text-white">
                        {pos.average_cost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider block">Toplam Maliyet</span>
                      <span className="font-bold text-white">
                        {pos.total_cost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                      </span>
                    </div>

                    {/* Current Price & Potential PnL */}
                    <div className="col-span-2 pt-2 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[var(--on-surface-variant)] uppercase">Güncel:</span>
                        {pos.current_price && pos.current_price > 0 ? (
                          <span className="font-bold text-white">{pos.current_price.toFixed(2)} ₺</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenPriceModal(pos)}
                            className="text-[10px] text-[var(--primary)] hover:underline font-semibold"
                          >
                            + Fiyat Gir
                          </button>
                        )}
                      </div>

                      {pos.current_price && pos.current_price > 0 && (
                        <div className="text-right">
                          <span className={`text-[11px] font-extrabold ${
                            (pos.unrealized_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {(pos.unrealized_pnl || 0) >= 0 ? '+' : ''}
                            {(pos.unrealized_pnl || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                            {' '}({(pos.unrealized_pnl_percent || 0) >= 0 ? '+' : ''}%{(pos.unrealized_pnl_percent || 0).toFixed(1)})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenBuy(pos.symbol)}
                      className="flex-1 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} /> Ekle (Alış)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenSell(pos.symbol)}
                      className="flex-1 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Minus size={14} /> Satış Yap
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenPriceModal(pos)}
                      title="Güncel Fiyat Güncelle"
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: REALIZED PROFIT / LOSS LOG (GERÇEKLEŞEN KÂR/ZARAR DEFTERİ) ── */}
      {activeTab === 'realized' && (
        <div className="flex flex-col gap-3">
          {realizedTrades.length === 0 ? (
            <div className="glass-card p-10 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <TrendingUp size={28} />
              </div>
              <h3 className="text-base font-bold text-white">Henüz Satış Yapılmadı</h3>
              <p className="text-xs text-[var(--on-surface-variant)] max-w-md">
                Elinizdeki hisselerden satış yaptığınızda, maliyetleriniz ve net gerçekleşen kâr/zararınız burada otomatik hesaplanarak listelenecektir.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {realizedTrades.map((trade) => {
                const isProfit = (trade.realized_pnl || 0) >= 0;
                return (
                  <div 
                    key={trade.id}
                    className={`glass-card p-4 sm:p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isProfit ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'
                    }`}
                  >
                    {/* Left: Stock & Lots */}
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border ${
                        isProfit ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}>
                        {trade.symbol.slice(0, 4)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">{trade.symbol}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            SATIŞ
                          </span>
                          <span className="text-xs text-[var(--on-surface-variant)]">{trade.date}</span>
                        </div>
                        <p className="text-xs text-[var(--on-surface-variant)] mt-0.5">
                          <strong>{trade.lots} Lot</strong> satıldı &bull; Satış: <strong>{trade.price.toFixed(2)} ₺</strong> (Alış Maliyeti: {trade.cost_basis?.toFixed(2)} ₺)
                        </p>
                        {trade.notes && (
                          <p className="text-[11px] text-white/50 italic mt-0.5">Not: {trade.notes}</p>
                        )}
                      </div>
                    </div>

                    {/* Right: Net Realized Profit/Loss Badge & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider block">
                          {isProfit ? 'Net Kâr' : 'Net Zarar'}
                        </span>
                        <div className={`text-lg sm:text-xl font-black ${
                          isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isProfit ? '+' : ''}
                          {(trade.realized_pnl || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                        </div>
                        <span className={`text-[11px] font-bold ${
                          isProfit ? 'text-emerald-300' : 'text-rose-300'
                        }`}>
                          {isProfit ? '+' : ''}%{(trade.realized_pnl_percent || 0).toFixed(2)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditTrade(trade)}
                          title="Düzenle"
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTrade(trade.id, trade.symbol)}
                          title="Sil"
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: ALL ORDERS (EMİR DEFTERİ) ── */}
      {activeTab === 'trades' && (
        <div className="flex flex-col gap-3">
          {/* Sub Filters */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5 p-1 bg-black/30 rounded-xl border border-white/5">
              {(['all', 'buy', 'sell'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setTradeFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    tradeFilter === f ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'Tümü' : f === 'buy' ? 'Sadece Alışlar' : 'Sadece Satışlar'}
                </button>
              ))}
            </div>
            <span className="text-xs text-[var(--on-surface-variant)]">{allTrades.length} İşlem</span>
          </div>

          {allTrades.length === 0 ? (
            <div className="glass-card p-10 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center gap-2">
              <ListOrdered size={28} className="text-white/40" />
              <p className="text-xs text-[var(--on-surface-variant)]">Kayıtlı işlem bulunamadı.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {allTrades.map((trade) => {
                const isBuy = trade.type === 'buy';
                return (
                  <div
                    key={trade.id}
                    className="glass-card p-3.5 sm:p-4 rounded-2xl border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isBuy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {isBuy ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{trade.symbol}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            isBuy ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {isBuy ? 'ALIŞ' : 'SATIŞ'}
                          </span>
                          <span className="text-[11px] text-[var(--on-surface-variant)]">{trade.date}</span>
                        </div>
                        <p className="text-xs text-[var(--on-surface-variant)]">
                          {trade.lots} Lot &times; {trade.price.toFixed(2)} ₺ {trade.notes ? `(${trade.notes})` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-extrabold text-sm text-white block">
                          {trade.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                        </span>
                        {!isBuy && trade.realized_pnl !== undefined && (
                          <span className={`text-[10px] font-bold ${
                            trade.realized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {trade.realized_pnl >= 0 ? '+' : ''}{trade.realized_pnl.toFixed(2)} ₺
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditTrade(trade)}
                          className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTrade(trade.id, trade.symbol)}
                          className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODALS ── */}
      <AddStockTradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        onSuccess={fetchPortfolio}
        initialType={tradeModalType}
        initialSymbol={tradeModalSymbol}
        editTrade={editTrade}
        positions={portfolio?.positions || []}
      />

      <UpdateStockPriceModal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        onSuccess={fetchPortfolio}
        position={priceModalPosition}
      />
    </div>
  );
}
