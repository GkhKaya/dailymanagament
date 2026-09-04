"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ArrowLeft, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon, 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  Percent, 
  Coins, 
  Calendar, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { getStockPortfolioAction } from '@/actions/stocks';
import { StockPortfolioDTO, StockPositionDTO, StockTradeDTO } from '@/models/DashboardTypes';
import { formatStockCurrency, getPortfolioPerformance } from '@/lib/stocks-ui';
import { ExportPdfModal } from '@/components/ui/ExportPdfModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const PIE_COLORS = [
  '#8ec13b', '#3b82f6', '#a855f7', '#ec4899', '#f59e0b',
  '#06b6d4', '#10b981', '#f97316', '#6366f1', '#14b8a6',
  '#84cc16', '#e11d48'
];

interface StocksAnalysisProps {
  onBack: () => void;
}

export function StocksAnalysis({ onBack }: StocksAnalysisProps) {
  const [portfolio, setPortfolio] = useState<StockPortfolioDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assetFilter, setAssetFilter] = useState<'all' | 'stock' | 'fund'>('all');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

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

  // Filter positions
  const filteredPositions = useMemo(() => {
    if (!portfolio?.positions) return [];
    return portfolio.positions.filter(p => assetFilter === 'all' || p.assetType === assetFilter);
  }, [portfolio?.positions, assetFilter]);

  // Filter realized trades
  const filteredRealizedTrades = useMemo(() => {
    if (!portfolio?.realizedTrades) return [];
    return portfolio.realizedTrades.filter(t => assetFilter === 'all' || t.assetType === assetFilter);
  }, [portfolio?.realizedTrades, assetFilter]);

  // Totals calculations
  const totals = useMemo(() => {
    const defaultTotals = {
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

    if (!portfolio) return defaultTotals;

    if (assetFilter === 'all') {
      return portfolio.totals || defaultTotals;
    }

    const totalInvestedCost = filteredPositions.reduce((acc, p) => acc + (p.total_cost || 0), 0);
    const totalCurrentValue = filteredPositions.reduce((acc, p) => acc + (p.current_value ?? p.total_cost ?? 0), 0);
    const totalUnrealizedPnl = totalCurrentValue - totalInvestedCost;
    const totalUnrealizedPnlPercent = totalInvestedCost > 0 ? (totalUnrealizedPnl / totalInvestedCost) * 100 : 0;

    const totalRealizedPnl = filteredRealizedTrades.reduce((acc, t) => acc + (t.realized_pnl || 0), 0);
    const winningTradesCount = filteredRealizedTrades.filter(t => (t.realized_pnl || 0) > 0).length;
    const losingTradesCount = filteredRealizedTrades.filter(t => (t.realized_pnl || 0) < 0).length;
    const totalClosed = winningTradesCount + losingTradesCount;
    const winRate = totalClosed > 0 ? Math.round((winningTradesCount / totalClosed) * 100) : 0;

    const totalBuyVolume = (portfolio.allTrades || [])
      .filter(t => t.type === 'buy' && (t.assetType === assetFilter))
      .reduce((acc, t) => acc + (t.total_amount || 0), 0);

    const totalSellVolume = (portfolio.allTrades || [])
      .filter(t => t.type === 'sell' && (t.assetType === assetFilter))
      .reduce((acc, t) => acc + (t.total_amount || 0), 0);

    return {
      totalInvestedCost,
      totalCurrentValue,
      totalUnrealizedPnl,
      totalUnrealizedPnlPercent,
      totalRealizedPnl,
      totalRealizedPnlPercent: totalInvestedCost > 0 ? (totalRealizedPnl / totalInvestedCost) * 100 : 0,
      winningTradesCount,
      losingTradesCount,
      winRate,
      totalBuyVolume,
      totalSellVolume
    };
  }, [portfolio, assetFilter, filteredPositions, filteredRealizedTrades]);

  // Pie chart data: Allocation by symbol
  const pieData = useMemo(() => {
    const totalVal = filteredPositions.reduce((acc, p) => acc + (p.current_value ?? p.total_cost ?? 0), 0);
    if (totalVal <= 0) return [];

    return filteredPositions
      .map(p => {
        const val = p.current_value ?? p.total_cost ?? 0;
        const percent = totalVal > 0 ? Math.round((val / totalVal) * 1000) / 10 : 0;
        return {
          name: p.symbol,
          fullName: p.name || p.symbol,
          value: Math.round(val * 100) / 100,
          percent,
          lots: p.total_lots,
          assetType: p.assetType
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredPositions]);

  // Bar chart data: PnL by symbol
  const pnlBarData = useMemo(() => {
    return filteredPositions.map(p => {
      const pnl = p.unrealized_pnl || 0;
      const pct = p.unrealized_pnl_percent || 0;
      return {
        symbol: p.symbol,
        pnl: Math.round(pnl * 100) / 100,
        percent: Math.round(pct * 10) / 10,
        name: p.name || p.symbol,
        assetType: p.assetType
      };
    }).sort((a, b) => b.pnl - a.pnl);
  }, [filteredPositions]);

  // Realized PnL Timeline
  const realizedTimelineData = useMemo(() => {
    if (!filteredRealizedTrades.length) return [];
    // Group by trade date or last 10 realized trades
    return [...filteredRealizedTrades]
      .sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime())
      .slice(-12)
      .map(t => ({
        date: t.date.split(',')[0] || t.date,
        symbol: t.symbol,
        realizedPnl: Math.round((t.realized_pnl || 0) * 100) / 100,
        percent: t.realized_pnl_percent ? Math.round(t.realized_pnl_percent * 10) / 10 : 0
      }));
  }, [filteredRealizedTrades]);

  // Top gainers and losers
  const topGainers = useMemo(() => {
    return [...filteredPositions]
      .filter(p => (p.unrealized_pnl || 0) > 0)
      .sort((a, b) => (b.unrealized_pnl || 0) - (a.unrealized_pnl || 0))
      .slice(0, 3);
  }, [filteredPositions]);

  const topLosers = useMemo(() => {
    return [...filteredPositions]
      .filter(p => (p.unrealized_pnl || 0) < 0)
      .sort((a, b) => (a.unrealized_pnl || 0) - (b.unrealized_pnl || 0))
      .slice(0, 3);
  }, [filteredPositions]);

  const performance = getPortfolioPerformance(totals.totalCurrentValue, totals.totalInvestedCost);

  if (isLoading && !portfolio) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner />
        <p className="text-sm text-[var(--on-surface-variant)] mt-3">Borsa portföy analizi hesaplanıyor...</p>
      </div>
    );
  }

  return (
    <div 
      data-tour="stocks-analysis-view"
      className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-24 animate-slide-up"
    >
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-4 mb-1">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={onBack} 
              aria-label="Borsa sayfasına geri dön"
              className="p-2.5 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors text-white cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp size={22} className="text-[var(--primary)]" />
                Detaylı Borsa & Portföy Analizi
              </h2>
              <p className="text-xs text-[var(--on-surface-variant)] mt-0.5">
                Varlık ağırlıkları, potansiyel ve gerçekleşen getiri analizleri
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            {/* PDF Button */}
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8ec13b]/15 hover:bg-[#8ec13b]/25 border border-[#8ec13b]/20 text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
              title="Borsa PDF Raporu Al"
            >
              <Download size={15} className="text-white" />
              <span>PDF Raporu</span>
            </button>

            {/* Asset Type Filter */}
            <div className="flex bg-[rgba(255,255,255,0.05)] p-1 rounded-xl shrink-0">
              {[
                { id: 'all', label: 'Tümü' },
                { id: 'stock', label: 'Hisse' },
                { id: 'fund', label: 'Fon' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setAssetFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    assetFilter === f.id 
                      ? 'bg-[var(--surface-container)] text-white shadow-sm' 
                      : 'text-[var(--on-surface-variant)] hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── KEY PERFORMANCE METRIC CARDS ── */}
      <section aria-label="Portföy temel göstergeleri" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Toplam Portföy Değeri */}
        <div className="glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-caption text-[var(--on-surface-variant)] uppercase">Portföy Değeri</span>
            <Coins size={16} className="text-[var(--primary)] opacity-80" />
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-white">{formatStockCurrency(totals.totalCurrentValue)}</p>
            <p className="text-[11px] text-[var(--on-surface-variant)] mt-0.5">
              Yatırılan: <span className="font-semibold text-white/90">{formatStockCurrency(totals.totalInvestedCost)}</span>
            </p>
          </div>
        </div>

        {/* Potansiyel (Unrealized) Kâr/Zarar */}
        <div className="glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-caption text-[var(--on-surface-variant)] uppercase">Potansiyel K/Z</span>
            {totals.totalUnrealizedPnl >= 0 ? (
              <ArrowUpRight size={16} className="text-emerald-400" />
            ) : (
              <ArrowDownRight size={16} className="text-rose-400" />
            )}
          </div>
          <div className="mt-2">
            <p className={`text-xl sm:text-2xl font-black ${totals.totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totals.totalUnrealizedPnl >= 0 ? '+' : ''}{formatStockCurrency(totals.totalUnrealizedPnl)}
            </p>
            <p className="text-[11px] text-[var(--on-surface-variant)] mt-0.5">
              Getiri: <span className={`font-bold ${totals.totalUnrealizedPnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                %{totals.totalUnrealizedPnlPercent.toFixed(2)}
              </span>
            </p>
          </div>
        </div>

        {/* Gerçekleşen (Realized) Kâr/Zarar */}
        <div className="glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-caption text-[var(--on-surface-variant)] uppercase">Gerçekleşen K/Z</span>
            <Percent size={16} className="text-blue-400 opacity-80" />
          </div>
          <div className="mt-2">
            <p className={`text-xl sm:text-2xl font-black ${totals.totalRealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totals.totalRealizedPnl >= 0 ? '+' : ''}{formatStockCurrency(totals.totalRealizedPnl)}
            </p>
            <p className="text-[11px] text-[var(--on-surface-variant)] mt-0.5">
              Net Satış Getirisi: <span className="font-semibold text-white/90">{formatStockCurrency(totals.totalSellVolume)}</span>
            </p>
          </div>
        </div>

        {/* Al-Sat Kazanma Oranı (Win Rate) */}
        <div className="glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-caption text-[var(--on-surface-variant)] uppercase">Al-Sat Başarı Oranı</span>
            <CheckCircle2 size={16} className="text-emerald-400 opacity-80" />
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-white">%{totals.winRate}</p>
            <p className="text-[11px] text-[var(--on-surface-variant)] mt-0.5">
              <span className="text-emerald-400 font-bold">{totals.winningTradesCount} Kârlı</span> / <span className="text-rose-400 font-bold">{totals.losingTradesCount} Zararlı</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── CHARTS SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Portföy Varlık Dağılımı (Pie Chart) */}
        <div className="glass-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieIcon size={18} className="text-[var(--primary)]" />
                Portföy Varlık Ağırlıkları
              </h3>
              <p className="text-xs text-[var(--on-surface-variant)]">Açık pozisyonların portföy içerisindeki yüzdelik payı</p>
            </div>
            <span className="text-xs font-bold text-white/60 bg-white/5 px-2 py-1 rounded-lg">
              {pieData.length} Varlık
            </span>
          </div>

          {pieData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[260px] text-center text-sm text-[var(--on-surface-variant)]">
              <p>Açık pozisyon bulunamadı.</p>
            </div>
          ) : (
            <div className="h-[280px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="rgba(0,0,0,0.4)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#12161f] border border-white/15 p-3 rounded-xl shadow-xl text-xs flex flex-col gap-1">
                            <span className="font-bold text-white text-sm">{data.name}</span>
                            <span className="text-[var(--on-surface-variant)]">{data.fullName}</span>
                            <div className="flex items-center justify-between gap-4 mt-1 pt-1 border-t border-white/10">
                              <span className="text-[var(--on-surface-variant)]">Değer:</span>
                              <span className="font-bold text-white">{formatStockCurrency(data.value)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[var(--on-surface-variant)]">Portföy Payı:</span>
                              <span className="font-bold text-[var(--primary)]">%{data.percent}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[var(--on-surface-variant)]">Adet/Lot:</span>
                              <span className="font-semibold text-white">{data.lots} Lot</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 2. Pozisyon Bazında Potansiyel Kâr/Zarar (Bar Chart) */}
        <div className="glass-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 size={18} className="text-emerald-400" />
                Varlık Bazında Kâr / Zarar
              </h3>
              <p className="text-xs text-[var(--on-surface-variant)]">Pozisyonların güncel kâr ve zarar performansı (₺)</p>
            </div>
          </div>

          {pnlBarData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[260px] text-center text-sm text-[var(--on-surface-variant)]">
              <p>Karşılaştırılacak açık pozisyon bulunamadı.</p>
            </div>
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pnlBarData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="symbol" 
                    stroke="rgba(255,255,255,0.5)" 
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.5)" 
                    fontSize={11}
                    tickFormatter={(val) => `${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} ₺`}
                    tickLine={false}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#12161f] border border-white/15 p-3 rounded-xl shadow-xl text-xs flex flex-col gap-1">
                            <span className="font-bold text-white text-sm">{data.symbol}</span>
                            <span className="text-[var(--on-surface-variant)]">{data.name}</span>
                            <div className="flex items-center justify-between gap-4 mt-1 pt-1 border-t border-white/10">
                              <span className="text-[var(--on-surface-variant)]">Kâr/Zarar:</span>
                              <span className={`font-bold ${data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {data.pnl >= 0 ? '+' : ''}{formatStockCurrency(data.pnl)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[var(--on-surface-variant)]">Getiri Oranı:</span>
                              <span className={`font-bold ${data.percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                %{data.percent}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {pnlBarData.map((entry, index) => (
                      <Cell 
                        key={`bar-${index}`} 
                        fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* ── REALIZED TRADES TIMELINE OR SUMMARY ── */}
      {realizedTimelineData.length > 0 && (
        <div className="glass-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar size={18} className="text-blue-400" />
                Gerçekleşen Kâr/Zarar Çizelgesi
              </h3>
              <p className="text-xs text-[var(--on-surface-variant)]">Tamamlanan satış işlemlerinden elde edilen net getiriler</p>
            </div>
            <span className="text-xs font-bold text-white/60 bg-white/5 px-2 py-1 rounded-lg">
              Son {realizedTimelineData.length} Satış
            </span>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={realizedTimelineData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="symbol" 
                  stroke="rgba(255,255,255,0.5)" 
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.5)" 
                  fontSize={11}
                  tickFormatter={(val) => `${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} ₺`}
                  tickLine={false}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#12161f] border border-white/15 p-2.5 rounded-xl shadow-xl text-xs flex flex-col gap-1">
                          <span className="font-bold text-white">{data.symbol} - {data.date}</span>
                          <span className={`font-bold ${data.realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {data.realizedPnl >= 0 ? '+' : ''}{formatStockCurrency(data.realizedPnl)} (%{data.percent})
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="realizedPnl" radius={[4, 4, 0, 0]}>
                  {realizedTimelineData.map((entry, index) => (
                    <Cell 
                      key={`timeline-${index}`} 
                      fill={entry.realizedPnl >= 0 ? '#10b981' : '#f43f5e'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── TOP PERFORMERS & RISK BREAKDOWN ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* En Çok Kazandıranlar */}
        <div className="glass-card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
            <TrendingUp size={16} />
            <h4>En İyi Performans Gösterenler</h4>
          </div>

          {topGainers.length === 0 ? (
            <p className="text-xs text-[var(--on-surface-variant)] py-4 text-center">Henüz kârda olan pozisyon bulunmuyor.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {topGainers.map((pos) => (
                <div key={pos.symbol} className="flex items-center justify-between p-2.5 bg-white/[0.02] rounded-xl border border-white/5">
                  <div>
                    <span className="font-bold text-white text-xs">{pos.symbol}</span>
                    <span className="text-[10px] text-[var(--on-surface-variant)] block">{pos.name || pos.symbol}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 block">
                      +{formatStockCurrency(pos.unrealized_pnl || 0)}
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-semibold">
                      +%{pos.unrealized_pnl_percent?.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* En Çok Kaybettirenler */}
        <div className="glass-card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-rose-400 text-sm font-bold">
            <TrendingDown size={16} />
            <h4>Gelişime Açık / Zararda Olanlar</h4>
          </div>

          {topLosers.length === 0 ? (
            <p className="text-xs text-[var(--on-surface-variant)] py-4 text-center">Zararda olan herhangi bir pozisyon bulunmuyor!</p>
          ) : (
            <div className="flex flex-col gap-2">
              {topLosers.map((pos) => (
                <div key={pos.symbol} className="flex items-center justify-between p-2.5 bg-white/[0.02] rounded-xl border border-white/5">
                  <div>
                    <span className="font-bold text-white text-xs">{pos.symbol}</span>
                    <span className="text-[10px] text-[var(--on-surface-variant)] block">{pos.name || pos.symbol}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-400 block">
                      {formatStockCurrency(pos.unrealized_pnl || 0)}
                    </span>
                    <span className="text-[10px] text-rose-400/80 font-semibold">
                      %{pos.unrealized_pnl_percent?.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Export PDF Modal */}
      <ExportPdfModal 
        isOpen={isPdfModalOpen} 
        onClose={() => setIsPdfModalOpen(false)} 
        reportType="stocks" 
      />
    </div>
  );
}
