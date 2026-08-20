"use client";

import React, { useState, useEffect } from "react";
import { X, TrendingUp, TrendingDown, DollarSign, Calendar, FileText, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { addStockTradeAction, updateStockTradeAction } from "@/actions/stocks";
import { StockPositionDTO, StockTradeDTO } from "@/models/DashboardTypes";
import toast from "react-hot-toast";

interface AddStockTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialType?: 'buy' | 'sell';
  initialSymbol?: string;
  editTrade?: StockTradeDTO | null;
  positions?: StockPositionDTO[];
}

export function AddStockTradeModal({
  isOpen,
  onClose,
  onSuccess,
  initialType = 'buy',
  initialSymbol = '',
  editTrade = null,
  positions = [],
}: AddStockTradeModalProps) {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>(editTrade?.type || initialType);
  const [symbol, setSymbol] = useState(editTrade?.symbol || initialSymbol || '');
  const [name, setName] = useState(editTrade?.name || '');
  const [lots, setLots] = useState<string>(editTrade ? String(editTrade.lots) : '');
  const [price, setPrice] = useState<string>(editTrade ? String(editTrade.price) : '');
  const [date, setDate] = useState<string>(
    editTrade?.rawDate ? editTrade.rawDate.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState(editTrade?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editTrade) {
      setTradeType(editTrade.type);
      setSymbol(editTrade.symbol);
      setName(editTrade.name || '');
      setLots(String(editTrade.lots));
      setPrice(String(editTrade.price));
      setDate(editTrade.rawDate ? editTrade.rawDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setNotes(editTrade.notes || '');
    } else {
      setTradeType(initialType);
      if (initialSymbol) setSymbol(initialSymbol);
    }
  }, [editTrade, initialType, initialSymbol]);

  if (!isOpen) return null;

  const cleanSymbol = symbol.trim().toUpperCase();
  const matchedPos = positions.find((p) => p.symbol.toUpperCase() === cleanSymbol);

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

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/70 animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-[#12121c] rounded-3xl border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.8)] overflow-hidden">
        
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
                {editTrade ? "Emri Düzenle" : tradeType === 'buy' ? "Hisse Alış Emri" : "Hisse Satış Emri"}
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
                Portföydeki Hisseler
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
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                Hisse Sembolü *
              </label>
              <input
                type="text"
                required
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="Örn: THYAO, EREGL"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold tracking-wider placeholder:text-white/20 focus:outline-none focus:border-[var(--primary)] transition-all uppercase"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                Şirket / Tanım (Opsiyonel)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Türk Hava Yolları"
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
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-bold underline"
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
              <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                Birim Fiyat (₺) *
              </label>
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
}
