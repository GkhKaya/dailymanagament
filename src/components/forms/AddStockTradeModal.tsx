"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, TrendingUp, TrendingDown, DollarSign, Calendar, FileText, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { addStockTradeAction, updateStockTradeAction, fetchMarketQuoteAction } from "@/actions/stocks";
import { StockPositionDTO, StockTradeDTO, KnownStockDTO } from "@/models/DashboardTypes";
import toast from "react-hot-toast";

interface AddStockTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialType?: 'buy' | 'sell';
  initialSymbol?: string;
  editTrade?: StockTradeDTO | null;
  positions?: StockPositionDTO[];
  knownStocks?: KnownStockDTO[];
}

export function AddStockTradeModal({
  isOpen,
  onClose,
  onSuccess,
  initialType = 'buy',
  initialSymbol = '',
  editTrade = null,
  positions = [],
  knownStocks = [],
}: AddStockTradeModalProps) {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>(editTrade?.type || initialType);
  const [assetType, setAssetType] = useState<'stock' | 'fund'>(editTrade?.assetType || 'stock');
  const [symbol, setSymbol] = useState(editTrade?.symbol || initialSymbol || '');
  const [name, setName] = useState(editTrade?.name || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lots, setLots] = useState<string>(editTrade ? String(editTrade.lots) : '');
  const [price, setPrice] = useState<string>(editTrade ? String(editTrade.price) : '');
  const [date, setDate] = useState<string>(
    editTrade?.rawDate ? editTrade.rawDate.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState(editTrade?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [marketQuote, setMarketQuote] = useState<{
    currentPrice: number;
    openPrice: number;
    closePrice: number;
    dayChangePercent: number;
  } | null>(null);

  const fetchMarketPrice = async (targetSymbol: string, targetAssetType: 'stock' | 'fund') => {
    const clean = targetSymbol.trim().toUpperCase();
    if (!clean) return;
    setIsFetchingQuote(true);
    try {
      const res = await fetchMarketQuoteAction(clean, targetAssetType);
      if (res.success && res.data) {
        setMarketQuote({
          currentPrice: res.data.currentPrice,
          openPrice: res.data.openPrice,
          closePrice: res.data.closePrice,
          dayChangePercent: res.data.dayChangePercent,
        });
        if (!price || parseFloat(price) <= 0) {
          setPrice(String(res.data.currentPrice));
        }
        if (!name && res.data.name) {
          setName(res.data.name);
        }
        if (res.data.assetType) {
          setAssetType(res.data.assetType);
        }
      }
    } catch (err) {
      console.error("fetchMarketPrice error:", err);
    } finally {
      setIsFetchingQuote(false);
    }
  };

  useEffect(() => {
    if (editTrade) {
      setTradeType(editTrade.type);
      setAssetType(editTrade.assetType || 'stock');
      setSymbol(editTrade.symbol);
      setName(editTrade.name || '');
      setLots(String(editTrade.lots));
      setPrice(String(editTrade.price));
      setDate(editTrade.rawDate ? editTrade.rawDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setNotes(editTrade.notes || '');
      setMarketQuote(null);
    } else {
      setTradeType(initialType);
      setAssetType('stock');
      setMarketQuote(null);
      if (initialSymbol) {
        setSymbol(initialSymbol);
        const match = knownStocks.find(k => k.symbol.toUpperCase() === initialSymbol.toUpperCase());
        if (match && match.name) setName(match.name);
        fetchMarketPrice(initialSymbol, 'stock');
      }
    }
  }, [isOpen, editTrade, initialType, initialSymbol]);

  if (!isOpen) return null;

  const cleanSymbol = symbol.trim().toUpperCase();
  const matchedPos = positions.find((p) => p.symbol.toUpperCase() === cleanSymbol);

  const filteredSuggestions = knownStocks.filter(k => {
    if (!cleanSymbol) return false;
    return k.symbol.toUpperCase().includes(cleanSymbol) || k.name.toLowerCase().includes(symbol.toLowerCase());
  }).slice(0, 8);

  const handleSelectSuggestion = (k: KnownStockDTO) => {
    setSymbol(k.symbol);
    setName(k.name);
    setShowSuggestions(false);
    fetchMarketPrice(k.symbol, assetType);
  };

  const numLots = parseFloat(lots) || 0;
  const numPrice = parseFloat(price) || 0;
  const totalAmount = Math.round(numLots * numPrice * 100) / 100;

  // Live Math Calculations
  let newAvgCostPreview: number | null = null;
  let realizedPnlPreview: number | null = null;
  let realizedPnlPercentPreview: number | null = null;

  if (tradeType === 'buy' && numLots > 0 && numPrice > 0) {
    if (matchedPos && matchedPos.total_lots > 0) {
      const prevTotalCost = matchedPos.total_cost;
      const newTotalCost = prevTotalCost + (numLots * numPrice);
      const newTotalLots = matchedPos.total_lots + numLots;
      newAvgCostPreview = Math.round((newTotalCost / newTotalLots) * 10000) / 10000;
    } else {
      newAvgCostPreview = numPrice;
    }
  } else if (tradeType === 'sell' && numLots > 0 && numPrice > 0) {
    const avgCost = matchedPos ? matchedPos.average_cost : (editTrade?.cost_basis || 0);
    if (avgCost > 0) {
      const costForSold = numLots * avgCost;
      realizedPnlPreview = Math.round((totalAmount - costForSold) * 100) / 100;
      realizedPnlPercentPreview = Math.round(((numPrice - avgCost) / avgCost) * 10000) / 100;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cleanSymbol) {
      toast.error("Lütfen hisse sembolü girin (örn: THYAO).");
      return;
    }

    if (numLots <= 0) {
      toast.error("Lütfen geçerli bir lot adedi girin.");
      return;
    }

    if (numPrice <= 0) {
      toast.error("Lütfen geçerli bir birim fiyat girin.");
      return;
    }

    if (tradeType === 'sell' && !editTrade && matchedPos) {
      if (numLots > matchedPos.total_lots + 0.0001) {
        toast.error(`Yetersiz bakiye! Elinizde ${matchedPos.total_lots} lot var.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (editTrade) {
        const res = await updateStockTradeAction(editTrade.id, {
          symbol: cleanSymbol,
          name: name || undefined,
          assetType,
          type: tradeType,
          lots: numLots,
          price: numPrice,
          date,
          notes: notes || undefined,
        });

        if (res.success) {
          toast.success("İşlem başarıyla güncellendi!");
          onSuccess();
          onClose();
        } else {
          toast.error(res.error || "Güncelleme başarısız.");
        }
      } else {
        const res = await addStockTradeAction({
          symbol: cleanSymbol,
          name: name || undefined,
          assetType,
          type: tradeType,
          lots: numLots,
          price: numPrice,
          date,
          notes: notes || undefined,
        });

        if (res.success) {
          const actionText = tradeType === 'buy' ? 'Alış emri' : 'Satış emri';
          toast.success(`${cleanSymbol} ${actionText} başarıyla kaydedildi! ✨`);
          onSuccess();
          onClose();
        } else {
          toast.error(res.error || "İşlem kaydedilemedi.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Beklenmedik bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 backdrop-blur-md bg-black/70 animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[calc(100dvh-1.5rem)] sm:max-h-[92dvh] flex flex-col bg-[#12121c] rounded-3xl border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base ${
              tradeType === 'buy'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {tradeType === 'buy' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {editTrade ? "İşlemi Düzenle" : tradeType === 'buy' ? `${assetType === 'fund' ? 'Fon' : 'Hisse'} Alışı` : `${assetType === 'fund' ? 'Fon' : 'Hisse'} Satışı`}
              </h2>
              <p className="text-xs text-[var(--on-surface-variant)]">
                {tradeType === 'buy' ? "Portföye yeni lot ekleme veya ilk alış" : "Kâr/zarar hesaplamalı lot satışı"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
          
          {/* Buy / Sell Switcher */}
          {!editTrade && (
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5">
              <button type="button" onClick={() => setAssetType('stock')} className={`min-h-11 rounded-xl text-xs font-bold transition-colors ${assetType === 'stock' ? 'bg-[var(--primary)] text-white' : 'text-white/60 hover:text-white'}`}>Hisse</button>
              <button type="button" onClick={() => setAssetType('fund')} className={`min-h-11 rounded-xl text-xs font-bold transition-colors ${assetType === 'fund' ? 'bg-[var(--primary)] text-white' : 'text-white/60 hover:text-white'}`}>Fon</button>
            </div>
          )}

          {!editTrade && (
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5">
              <button
                type="button"
                onClick={() => setTradeType('buy')}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  tradeType === 'buy'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <TrendingUp size={15} /> Alış (Buy)
              </button>
              <button
                type="button"
                onClick={() => setTradeType('sell')}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  tradeType === 'sell'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <TrendingDown size={15} /> Satış (Sell)
              </button>
            </div>
          )}

          {/* Quick Select from Open Positions if Selling */}
          {tradeType === 'sell' && positions.length > 0 && !editTrade && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                Portföydeki Varlıklar
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {positions.map((p) => (
                  <button
                    key={p.symbol}
                    type="button"
                    onClick={() => {
                      setSymbol(p.symbol);
                      if (p.name) setName(p.name);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                      cleanSymbol === p.symbol.toUpperCase()
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 border-white/10'
                    }`}
                  >
                    <span>{p.symbol}</span>
                    <span className="text-[10px] text-white/50">({p.total_lots} Lot)</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Symbol & Name Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                {assetType === 'fund' ? 'Fon Kodu *' : 'Hisse Sembolü *'}
              </label>
              <input
                type="text"
                required
                value={symbol}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setSymbol(val);
                  setShowSuggestions(true);
                  const match = knownStocks.find(k => k.symbol.toUpperCase() === val);
                  if (match && match.name && !name) {
                    setName(match.name);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                  const match = knownStocks.find(k => k.symbol.toUpperCase() === cleanSymbol);
                  if (match && match.name && !name) {
                    setName(match.name);
                  }
                  if (cleanSymbol && !price) {
                    fetchMarketPrice(cleanSymbol, assetType);
                  }
                }}
                placeholder={assetType === 'fund' ? 'Örn: TTE, MAC' : 'Örn: THYAO, ASELS'}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold tracking-wider placeholder:text-white/20 focus:outline-none focus:border-[var(--primary)] transition-all uppercase"
              />

              {/* Suggestions Dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-[100%] left-0 right-0 z-50 mt-1 bg-[#181826] border border-white/15 rounded-2xl shadow-2xl overflow-hidden py-1 max-h-48 overflow-y-auto">
                  {filteredSuggestions.map((item) => (
                    <button
                      key={item.symbol}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(item);
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{item.symbol}</span>
                        <span className="text-[11px] text-[var(--on-surface-variant)] truncate max-w-[170px]">{item.name}</span>
                      </div>
                      {item.isCustom && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold">Kayıtlı</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                {assetType === 'fund' ? 'Fon Adı (Opsiyonel)' : 'Şirket / Tanım (Opsiyonel)'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={assetType === 'fund' ? 'Örn: Para Piyasası Fonu' : 'Örn: Türk Hava Yolları'}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--primary)] transition-all"
              />
            </div>
          </div>

          {/* Position Info Banner if holding stock */}
          {matchedPos && (
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="text-[var(--on-surface-variant)]">Eldeki Mevcut Miktar:</span>
                <span className="font-bold text-white text-sm">{matchedPos.total_lots} Lot</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[var(--on-surface-variant)]">Mevcut Ort. Maliyet:</span>
                <span className="font-bold text-white text-sm">
                  {matchedPos.average_cost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                </span>
              </div>
            </div>
          )}

          {/* Lots & Price Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                  Lot Sayısı (Adet) *
                </label>
                {tradeType === 'sell' && matchedPos && (
                  <button
                    type="button"
                    onClick={() => setLots(String(matchedPos.total_lots))}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
                  >
                    Tümünü Sat ({matchedPos.total_lots})
                  </button>
                )}
              </div>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={lots}
                onChange={(e) => setLots(e.target.value)}
                placeholder="Örn: 100"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold placeholder:text-white/20 focus:outline-none focus:border-[var(--primary)] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                  Birim Fiyat (₺) *
                </label>
                {cleanSymbol && (
                  <button
                    type="button"
                    disabled={isFetchingQuote}
                    onClick={() => fetchMarketPrice(cleanSymbol, assetType)}
                    className="text-[10px] font-bold text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles size={11} className={isFetchingQuote ? "animate-spin" : ""} />
                    {isFetchingQuote ? "Fiyat Alınıyor..." : "Piyasa Fiyatı Al"}
                  </button>
                )}
              </div>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Örn: 245.50"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold placeholder:text-white/20 focus:outline-none focus:border-[var(--primary)] transition-all"
              />
            </div>
          </div>

          {/* Market Quote Details Card */}
          {marketQuote && (marketQuote.openPrice > 0 || marketQuote.closePrice > 0) && (
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1 text-xs animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[var(--on-surface-variant)] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Piyasa Fiyatı: <b className="text-white text-sm">{marketQuote.currentPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</b>
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  marketQuote.dayChangePercent >= 0
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}>
                  {marketQuote.dayChangePercent >= 0 ? '▲ +' : '▼ '}
                  {marketQuote.dayChangePercent.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-white/60 pt-1 border-t border-white/5">
                <span>Açılış: <b className="text-white/90">{marketQuote.openPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</b></span>
                <span>Önceki Kapanış: <b className="text-white/90">{marketQuote.closePrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</b></span>
              </div>
              {price !== String(marketQuote.currentPrice) && (
                <button
                  type="button"
                  onClick={() => setPrice(String(marketQuote.currentPrice))}
                  className="mt-1 py-1 px-2.5 text-[10px] font-bold rounded-lg bg-[var(--primary)]/20 text-[var(--primary)] hover:bg-[var(--primary)]/30 transition-colors w-fit self-end cursor-pointer"
                >
                  Piyasa Fiyatını Uygula ({marketQuote.currentPrice} ₺)
                </button>
              )}
            </div>
          )}

          {/* Date & Note Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} /> İşlem Tarihi *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--primary)] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1">
                <FileText size={12} /> Not (Opsiyonel)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Örn: Temettü hedefli, kademe alış"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--primary)] transition-all"
              />
            </div>
          </div>

          {/* LIVE MATH CALCULATION PREVIEW BOX */}
          {numLots > 0 && numPrice > 0 && (
            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex flex-col gap-2.5 animate-fade-in">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                <span className="text-[var(--on-surface-variant)]">Toplam İşlem Tutarı:</span>
                <span className="text-base font-extrabold text-white">
                  {totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                </span>
              </div>

              {/* Buy Preview: New Average Cost */}
              {tradeType === 'buy' && newAvgCostPreview !== null && (
                <div className="flex items-center justify-between text-xs text-emerald-400">
                  <span className="flex items-center gap-1">
                    <Sparkles size={13} />
                    {matchedPos ? "Yeni Ağırlıklı Ortalama Maliyet:" : "Birim Alış Maliyeti:"}
                  </span>
                  <span className="font-bold text-sm">
                    {newAvgCostPreview.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ₺
                  </span>
                </div>
              )}

              {/* Sell Preview: Realized Profit / Loss */}
              {tradeType === 'sell' && realizedPnlPreview !== null && realizedPnlPercentPreview !== null && (
                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  realizedPnlPreview >= 0
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="flex flex-col">
                    <span className="font-semibold text-[11px] uppercase tracking-wider">
                      {realizedPnlPreview >= 0 ? "💰 Gerçekleşen Net Kâr" : "📉 Gerçekleşen Net Zarar"}
                    </span>
                    <span className="text-base font-extrabold">
                      {realizedPnlPreview >= 0 ? '+' : ''}
                      {realizedPnlPreview.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] opacity-70">Getiri Oranı</span>
                    <p className="text-sm font-black">
                      {realizedPnlPercentPreview >= 0 ? '+' : ''}%{realizedPnlPercentPreview.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-white/80 hover:text-white text-xs font-semibold hover:bg-white/5 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 ${
                tradeType === 'buy'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                  : 'bg-rose-500 hover:bg-rose-400 text-white'
              }`}
            >
              <CheckCircle2 size={16} />
              {isSubmitting ? "Kaydediliyor..." : editTrade ? "Değişiklikleri Kaydet" : tradeType === 'buy' ? "Alış Emrini Kaydet" : "Satış Emrini Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document === "undefined" ? null : createPortal(modal, document.body);
}
