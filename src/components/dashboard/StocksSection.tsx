"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus, 
  PieChart, 
  ListOrdered, 
  Edit3, 
  Trash2, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreHorizontal,
  Download,
  X,
  Activity,
  RefreshCw
} from "lucide-react";
import { getStockPortfolioAction, deleteStockTradeAction, deleteStockPositionAction, syncStockMarketPricesAction } from "@/actions/stocks";
import { StockPortfolioDTO, StockPositionDTO, StockTradeDTO } from "@/models/DashboardTypes";
import { AddStockTradeModal } from "@/components/forms/AddStockTradeModal";
import { UpdateStockPriceModal } from "@/components/forms/UpdateStockPriceModal";
import { EditStockSymbolModal } from "@/components/forms/EditStockSymbolModal";
import { StockPositionOrdersModal } from "@/components/forms/StockPositionOrdersModal";
import { ExportPdfModal } from "@/components/ui/ExportPdfModal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { filterRealizedTrades, formatStockCurrency, getPortfolioPerformance, summarizeRealizedTrades } from "@/lib/stocks-ui";
import toast from "react-hot-toast";

export function StocksSection({ onShowAnalysis }: { onShowAnalysis?: () => void } = {}) {
  const [portfolio, setPortfolio] = useState<StockPortfolioDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingPrices, setIsSyncingPrices] = useState(false);
  const [activeTab, setActiveTab] = useState<'positions' | 'realized' | 'trades'>('positions');
  const [searchQuery, setSearchQuery] = useState('');
  const [tradeFilter, setTradeFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [assetFilter, setAssetFilter] = useState<'all' | 'stock' | 'fund'>('all');
  const [realizedPeriod, setRealizedPeriod] = useState<'all' | 'week' | 'month'>('all');

  // Modals state
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeModalType, setTradeModalType] = useState<'buy' | 'sell'>('buy');
  const [tradeModalSymbol, setTradeModalSymbol] = useState('');
  const [editTrade, setEditTrade] = useState<StockTradeDTO | null>(null);

  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [priceModalPosition, setPriceModalPosition] = useState<StockPositionDTO | null>(null);

  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [ordersModalPosition, setOrdersModalPosition] = useState<StockPositionDTO | null>(null);

  const [isEditSymbolModalOpen, setIsEditSymbolModalOpen] = useState(false);
  const [editSymbolModalData, setEditSymbolModalData] = useState<{ symbol: string; name?: string; assetType: 'stock' | 'fund' } | null>(null);

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

  const handleSyncPrices = async () => {
    setIsSyncingPrices(true);
    try {
      const res = await syncStockMarketPricesAction();
      if (res.success) {
        toast.success(`Piyasa fiyatları güncellendi! (${res.updatedCount || 0} varlık)`);
        await fetchPortfolio();
      } else {
        toast.error(res.error || "Piyasa fiyatları güncellenemedi.");
      }
    } catch {
      toast.error("Piyasa fiyatları güncellenirken hata oluştu.");
    } finally {
      setIsSyncingPrices(false);
    }
  };

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
    setIsOrdersModalOpen(false);
    setOrdersModalPosition(null);
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

  const handleOpenOrdersModal = (position: StockPositionDTO) => {
    setOrdersModalPosition(position);
    setIsOrdersModalOpen(true);
  };

  const handleOpenEditSymbol = (symbol: string, name?: string, assetType: 'stock' | 'fund' = 'stock') => {
    setEditSymbolModalData({ symbol, name, assetType });
    setIsEditSymbolModalOpen(true);
  };

  const handleDeletePosition = async (symbol: string) => {
    if (!confirm(`${symbol} hissesine ait tüm alış/satış geçmişi ve portföy kaydı tamamen silinecektir. Emin misiniz?`)) {
      return;
    }

    try {
      const res = await deleteStockPositionAction(symbol);
      if (res.success) {
        toast.success(`${symbol} hissesi ve tüm kayıtları başarıyla silindi.`);
        fetchPortfolio();
      } else {
        toast.error(res.error || "Silme işlemi başarısız.");
      }
    } catch (err: any) {
      toast.error(err.message || "Hata oluştu.");
    }
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
  const performance = getPortfolioPerformance(totals.totalCurrentValue, totals.totalInvestedCost);
  const performanceLabel = performance.trend === "gain" ? "Artış" : performance.trend === "loss" ? "Düşüş" : "Değişim yok";
  const performanceColor = performance.trend === "gain" ? "text-emerald-400" : performance.trend === "loss" ? "text-rose-400" : "text-[var(--on-surface-variant)]";
  const performanceSurface = performance.trend === "gain" ? "border-emerald-500/25 bg-emerald-500/5" : performance.trend === "loss" ? "border-rose-500/25 bg-rose-500/5" : "border-[var(--outline)]";

  const openPositions = (portfolio?.positions || []).filter(p => {
    const matchesSearch = !searchQuery || p.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch && (assetFilter === 'all' || p.assetType === assetFilter);
  });

  const realizedTrades = filterRealizedTrades(
    (portfolio?.realizedTrades || []).filter(t =>
      !searchQuery || t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || (t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    assetFilter,
    realizedPeriod,
  );
  const realizedSummary = summarizeRealizedTrades(realizedTrades);

  const allTrades = (portfolio?.allTrades || []).filter(t => {
    const matchesSearch = !searchQuery || t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || (t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = tradeFilter === 'all' || t.type === tradeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col gap-[var(--space-4)] w-full max-w-[1600px] mx-auto animate-fade-in">
      
      {/* ── HEADER BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center justify-between gap-3 w-full sm:w-auto">
          <div>
            <h2 className="text-hero text-white tracking-tight flex items-center gap-3">
              <span className="w-11 h-11 rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] shrink-0 flex items-center justify-center">
                <TrendingUp size={20} />
              </span>
              Borsa
            </h2>
            <p className="text-body text-[var(--on-surface-variant)] mt-2">
              Portföyün bugün nasıl?
            </p>
          </div>
          <div className="flex items-center gap-1 sm:hidden">
            <button 
              type="button" 
              disabled={isSyncingPrices}
              onClick={handleSyncPrices} 
              aria-label="Piyasa fiyatlarını yenile" 
              title="Piyasa Fiyatlarını Yenile" 
              className="min-h-11 min-w-11 flex items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 transition-colors hover:bg-emerald-500/25 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={16} className={isSyncingPrices ? "animate-spin" : ""} />
            </button>
            <button 
              type="button" 
              data-tour="stocks-pdf-btn"
              onClick={() => setIsPdfModalOpen(true)} 
              aria-label="Borsa raporunu PDF olarak indir" 
              title="PDF Raporu İndir" 
              className="min-h-11 min-w-11 flex items-center justify-center rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/20 text-white transition-colors hover:bg-[var(--primary)]/25 cursor-pointer"
            >
              <Download size={18} className="text-white" />
            </button>
            {onShowAnalysis && (
              <button
                type="button"
                data-tour="stocks-analysis-btn"
                onClick={onShowAnalysis}
                aria-label="Detaylı borsa analizi"
                title="Detaylı Analiz"
                className="min-h-11 min-w-11 flex items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors text-[var(--primary)] cursor-pointer"
              >
                <Activity size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            disabled={isSyncingPrices}
            onClick={handleSyncPrices}
            aria-label="Piyasa fiyatlarını yenile"
            title="Piyasa Fiyatlarını Güncelle"
            className="hidden sm:flex min-h-11 px-3.5 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs font-bold transition-colors hover:bg-emerald-500/25 cursor-pointer disabled:opacity-50 mr-1 gap-1.5"
          >
            <RefreshCw size={14} className={isSyncingPrices ? "animate-spin" : ""} />
            <span>{isSyncingPrices ? "Güncelleniyor..." : "Fiyatları Yenile"}</span>
          </button>
          <button
            type="button"
            data-tour="stocks-pdf-btn"
            onClick={() => setIsPdfModalOpen(true)}
            aria-label="Borsa raporunu PDF olarak indir"
            title="PDF Raporu İndir"
            className="hidden sm:flex min-h-11 min-w-11 items-center justify-center rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/20 text-white transition-colors hover:bg-[var(--primary)]/25 cursor-pointer mr-1"
          >
            <Download size={16} className="text-white" />
          </button>
          {onShowAnalysis && (
            <button
              type="button"
              data-tour="stocks-analysis-btn"
              onClick={onShowAnalysis}
              aria-label="Detaylı borsa analizi"
              title="Detaylı Analiz"
              className="hidden sm:flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors text-[var(--primary)] cursor-pointer mr-1"
            >
              <Activity size={18} />
            </button>
          )}
          <button
            type="button"
            data-tour="stocks-buy"
            onClick={() => handleOpenBuy()}
            className="min-h-11 px-4 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Alış Emri Gir
          </button>
          <button
            type="button"
            data-tour="stocks-sell"
            onClick={() => handleOpenSell()}
            className="min-h-11 px-4 rounded-full bg-transparent hover:bg-white/5 border border-[var(--outline)] text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Minus size={16} /> Satış Yap
          </button>
        </div>
      </div>

      <section data-tour="stocks-summary" aria-label="Portföy özeti" className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className={`glass-card col-span-2 p-4 border ${performanceSurface}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-caption text-[var(--on-surface-variant)]">PORTFÖY DEĞERİ</p>
              <p className="text-title text-white mt-1">{formatStockCurrency(totals.totalCurrentValue)}</p>
            </div>
            <div className={`text-right ${performanceColor}`}>
              <p className="text-body font-bold flex items-center justify-end gap-1.5">{performance.trend === "loss" ? <ArrowDownRight size={16} aria-hidden="true" /> : <ArrowUpRight size={16} aria-hidden="true" />}{performance.pnl >= 0 ? "+" : ""}{formatStockCurrency(performance.pnl)}</p>
              <p className="text-xs font-semibold mt-0.5">{performanceLabel} · %{performance.percent.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-3">
          <p className="text-caption text-[var(--on-surface-variant)]">YATIRILAN</p>
          <p className="text-body font-bold text-white mt-1 truncate">{formatStockCurrency(totals.totalInvestedCost)}</p>
          <p className="text-[11px] text-[var(--on-surface-variant)] mt-1">{portfolio?.positions.length || 0} varlık</p>
        </div>
        <div className="glass-card p-3">
          <p className="text-caption text-[var(--on-surface-variant)]">GERÇEKLEŞEN</p>
          <p className={`text-body font-bold mt-1 truncate ${totals.totalRealizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{totals.totalRealizedPnl >= 0 ? "+" : ""}{formatStockCurrency(totals.totalRealizedPnl)}</p>
          <p className="text-[11px] text-[var(--on-surface-variant)] mt-1">Satış sonucu</p>
        </div>
      </section>

      {/* ── TABS & SEARCH BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Navigation Tabs */}
        <div data-tour="stocks-tabs" className="grid grid-cols-3 p-1 bg-[var(--surface-container-low)] rounded-[var(--radius-card)] border border-[var(--outline)] w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('positions')}
            className={`min-h-11 px-2 rounded-[var(--radius-input)] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'positions'
                ? 'bg-[var(--primary)] text-black shadow-sm'
                : 'text-[var(--on-surface-variant)] hover:text-white'
            }`}
          >
            <PieChart size={14} aria-hidden="true" /> <span className="sm:hidden">Portföy</span><span className="hidden sm:inline">Açık Portföy</span> ({portfolio?.positions.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('realized')}
            className={`min-h-11 px-2 rounded-[var(--radius-input)] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'realized'
                ? 'bg-[var(--primary)] text-black shadow-sm'
                : 'text-[var(--on-surface-variant)] hover:text-white'
            }`}
          >
            <TrendingUp size={14} aria-hidden="true" /> <span className="sm:hidden">Kâr/Zarar</span><span className="hidden sm:inline">Gerçekleşen Kâr/Zarar</span> ({portfolio?.realizedTrades.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trades')}
            className={`min-h-11 px-2 rounded-[var(--radius-input)] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'trades'
                ? 'bg-[var(--primary)] text-black shadow-sm'
                : 'text-[var(--on-surface-variant)] hover:text-white'
            }`}
          >
            <ListOrdered size={14} aria-hidden="true" /> <span className="sm:hidden">İşlemler</span><span className="hidden sm:inline">Emir Defteri</span> ({portfolio?.allTrades.length || 0})
          </button>
        </div>

        {/* Search Input */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--surface-container-low)] rounded-[var(--radius-input)] border border-[var(--outline)]">
            {([['all', 'Tümü'], ['stock', 'Hisse'], ['fund', 'Fon']] as const).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setAssetFilter(value)} aria-pressed={assetFilter === value} className={`min-h-9 px-3 rounded-md text-xs font-bold transition-colors ${assetFilter === value ? value === 'fund' ? 'bg-purple-500/20 text-purple-300' : 'bg-[var(--primary)] text-black' : 'text-[var(--on-surface-variant)] hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative flex items-center w-full sm:w-64">
            <Search size={14} className="absolute left-3.5 text-white/40 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hisse sembolü veya fon ara..."
              aria-label="Hisse sembolü ara"
              className="min-h-11 w-full bg-[var(--surface-container-low)] border border-[var(--outline)] rounded-[var(--radius-input)] py-2 pl-9 pr-8 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[var(--primary)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Aramayı temizle"
                className="absolute right-2 p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
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
                Portföyünüzde henüz hisse veya fon bulunmuyor. İlk alış emrinizi girerek maliyet ve kâr/zarar takibine başlayın.
              </p>
              <button
                type="button"
                onClick={() => handleOpenBuy()}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-black font-bold text-xs flex items-center gap-2 hover:opacity-90 shadow-md cursor-pointer"
              >
                <Plus size={15} /> İlk Alış Emrini Ekle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {openPositions.map((pos) => (
                <div 
                  key={pos.symbol}
                  className="glass-card p-4 flex flex-col justify-between gap-4 relative"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-white font-black text-sm tracking-wider shrink-0 ${pos.assetType === 'fund' ? 'bg-purple-500/15 border-purple-500/30' : 'bg-[var(--primary)]/15 border-[var(--primary)]/30'}`}>
                        {pos.symbol.slice(0, 4)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-base font-bold text-white tracking-wide">{pos.symbol}</h4>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${pos.assetType === 'fund' ? 'bg-purple-500/15 text-purple-300' : 'bg-[var(--primary)]/15 text-[var(--primary)]'}`}>
                            {pos.assetType === 'fund' ? 'FON' : 'HİSSE'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--on-surface-variant)] truncate">
                          {pos.name || (pos.assetType === 'fund' ? 'Yatırım Fonu' : 'Borsa İstanbul')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="text-right mr-1">
                        <span className="text-base font-black text-white">{pos.total_lots}</span>
                        <span className="text-[10px] text-[var(--on-surface-variant)] block">Lot</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenEditSymbol(pos.symbol, pos.name, pos.assetType)}
                        aria-label={`${pos.symbol} adını düzenle`}
                        title="İsim Düzenle"
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePosition(pos.symbol)}
                        aria-label={`${pos.symbol} hissesini sil`}
                        title="Hisseyi Tamamen Sil"
                        className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-[var(--surface-container)] rounded-[var(--radius-input)] border border-[var(--outline)] text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider block">Ort. Maliyet</span>
                      <span className="font-bold text-white">
                        {formatStockCurrency(pos.average_cost)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider block">Toplam Maliyet</span>
                      <span className="font-bold text-white">
                        {formatStockCurrency(pos.total_cost)}
                      </span>
                    </div>

                    {/* Current Price & Day Change */}
                    <div className="col-span-2 pt-2 border-t border-white/5 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[var(--on-surface-variant)] uppercase">Son / Kapanış:</span>
                          {pos.current_price && pos.current_price > 0 ? (
                            <span className="font-bold text-white text-sm">{formatStockCurrency(pos.current_price)}</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenPriceModal(pos)}
                              className="min-h-9 px-2 text-xs text-[var(--primary)] hover:underline font-semibold cursor-pointer"
                            >
                              + Fiyat Gir
                            </button>
                          )}
                        </div>

                        {typeof pos.day_change_percent === 'number' && pos.day_change_percent !== 0 && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                            pos.day_change_percent > 0
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            {pos.day_change_percent > 0 ? '▲ +' : '▼ '}
                            {pos.day_change_percent.toFixed(2)}%
                          </span>
                        )}
                      </div>

                      {/* Open & Close Prices */}
                      {((pos.open_price ?? 0) > 0 || (pos.close_price ?? 0) > 0) && (
                        <div className="flex items-center justify-between text-[10px] text-[var(--on-surface-variant)] pt-1 border-t border-white/5">
                          <span>Açılış: <b className="text-white/80">{pos.open_price ? formatStockCurrency(pos.open_price) : '-'}</b></span>
                          <span>Önceki Kapanış: <b className="text-white/80">{pos.close_price ? formatStockCurrency(pos.close_price) : '-'}</b></span>
                        </div>
                      )}

                      {pos.current_price && pos.current_price > 0 && (
                        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
                          <span className="text-[10px] text-[var(--on-surface-variant)]">Toplam K/Z:</span>
                          <span className={`text-xs font-extrabold ${
                            (pos.unrealized_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {(pos.unrealized_pnl || 0) >= 0 ? '+' : ''}
                            {formatStockCurrency(pos.unrealized_pnl || 0)}
                            {' '}({(pos.unrealized_pnl_percent || 0) >= 0 ? '+' : ''}%{(pos.unrealized_pnl_percent || 0).toFixed(1)})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions: 2x2 clean grid */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenBuy(pos.symbol)}
                      className="min-h-11 px-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Plus size={15} /> Ekle (Alış)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenSell(pos.symbol)}
                      className="min-h-11 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Minus size={15} /> Satış Yap
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenPriceModal(pos)}
                      aria-label={`${pos.symbol} güncel fiyatını düzenle`}
                      className="min-h-11 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-[var(--outline)] text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Edit3 size={13} className="text-[var(--primary)]" />
                      <span>Fiyat Gir</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenOrdersModal(pos)}
                      aria-label={`${pos.symbol} emir ve maliyetlerini düzenle`}
                      className="min-h-11 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-[var(--outline)] text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <ListOrdered size={13} className="text-blue-400" />
                      <span>Maliyet/Emirler</span>
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
          <div className="glass-card p-4 rounded-3xl border border-white/10 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--on-surface-variant)]">Filtrelenmiş net durum</p>
                <p className={`text-2xl font-black ${realizedSummary.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {realizedSummary.netPnl >= 0 ? '+' : ''}{formatStockCurrency(realizedSummary.netPnl)}
                </p>
              </div>
              <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
                {([['all', 'Tümü'], ['week', 'Haftalık'], ['month', 'Aylık']] as const).map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setRealizedPeriod(value)} className={`min-h-9 px-3 rounded-md text-xs font-bold ${realizedPeriod === value ? 'bg-[var(--primary)] text-black' : 'text-white/60 hover:text-white'}`}>{label}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-4 text-xs text-[var(--on-surface-variant)]">
              <span>Kârlı: <strong className="text-emerald-400">{realizedSummary.winningCount}</strong></span>
              <span>Zararlı: <strong className="text-rose-400">{realizedSummary.losingCount}</strong></span>
              <span>İşlem: <strong className="text-white">{realizedTrades.length}</strong></span>
            </div>
          </div>
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
                          <span className="text-xs text-[var(--on-surface-variant)]">{trade.date} · {trade.holding_days ?? 0} gün</span>
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
        knownStocks={portfolio?.knownStocks || []}
      />

      <UpdateStockPriceModal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        onSuccess={fetchPortfolio}
        position={priceModalPosition}
      />

      {ordersModalPosition && (
        <StockPositionOrdersModal
          isOpen={isOrdersModalOpen}
          onClose={() => {
            setIsOrdersModalOpen(false);
            setOrdersModalPosition(null);
          }}
          onSuccess={fetchPortfolio}
          position={ordersModalPosition}
          trades={portfolio?.allTrades || []}
          onEditTrade={(trade) => {
            setIsOrdersModalOpen(false);
            handleEditTrade(trade);
          }}
          onAddTrade={(type, symbol) => {
            setIsOrdersModalOpen(false);
            if (type === 'buy') handleOpenBuy(symbol);
            else handleOpenSell(symbol);
          }}
          onEditSymbolName={(symbol, currentName) => {
            handleOpenEditSymbol(symbol, currentName, ordersModalPosition.assetType);
          }}
        />
      )}

      {editSymbolModalData && (
        <EditStockSymbolModal
          isOpen={isEditSymbolModalOpen}
          onClose={() => {
            setIsEditSymbolModalOpen(false);
            setEditSymbolModalData(null);
          }}
          onSuccess={fetchPortfolio}
          symbol={editSymbolModalData.symbol}
          currentName={editSymbolModalData.name}
          currentAssetType={editSymbolModalData.assetType}
        />
      )}

      <ExportPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        reportType="stocks"
      />
    </div>
  );
}
