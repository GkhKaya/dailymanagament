'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Loader2, Check, SlidersHorizontal, FileText } from 'lucide-react';
import { createFuturesTradeAction, updateFuturesTradeAction, FuturesTradeDTO } from '@/actions/futures';
import { FuturesMarket, FuturesSide, FuturesStatus } from '@/models/FuturesTrade';
import toast from 'react-hot-toast';

interface AddFuturesTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTrade?: FuturesTradeDTO | null;
  isEn?: boolean;
}

const LEVERAGE_PRESETS = [1, 2, 5, 10, 20, 50, 100];

const MARKET_OPTIONS: Array<{ value: FuturesMarket; labelTr: string; labelEn: string }> = [
  { value: 'crypto', labelTr: 'Kripto', labelEn: 'Crypto' },
  { value: 'viop', labelTr: 'BIST VİOP', labelEn: 'BIST Futures' },
  { value: 'us', labelTr: 'ABD Vadeli', labelEn: 'US Futures' },
  { value: 'forex', labelTr: 'Forex', labelEn: 'Forex' },
  { value: 'other', labelTr: 'Diğer', labelEn: 'Other' }
];

export function AddFuturesTradeModal({
  isOpen,
  onClose,
  onSuccess,
  editTrade,
  isEn = false
}: AddFuturesTradeModalProps) {
  const [symbol, setSymbol] = useState('');
  const [market, setMarket] = useState<FuturesMarket>('crypto');
  const [side, setSide] = useState<FuturesSide>('long');
  const [leverage, setLeverage] = useState<number>(10);
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [margin, setMargin] = useState<string>('');
  const [size, setSize] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [status, setStatus] = useState<FuturesStatus>('open');
  const [exitPrice, setExitPrice] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [entryDate, setEntryDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when modal opens or editTrade changes
  useEffect(() => {
    if (editTrade) {
      setSymbol(editTrade.symbol);
      setMarket(editTrade.market);
      setSide(editTrade.side);
      setLeverage(editTrade.leverage || 10);
      setEntryPrice(String(editTrade.entry_price || ''));
      setMargin(String(editTrade.margin || ''));
      setSize(String(editTrade.size || ''));
      setStopLoss(editTrade.stop_loss ? String(editTrade.stop_loss) : '');
      setTakeProfit(editTrade.take_profit ? String(editTrade.take_profit) : '');
      setStatus(editTrade.status);
      setExitPrice(editTrade.exit_price ? String(editTrade.exit_price) : '');
      setNotes(editTrade.notes || '');
      setEntryDate(editTrade.entry_date ? editTrade.entry_date.slice(0, 16) : '');
    } else {
      setSymbol('');
      setMarket('crypto');
      setSide('long');
      setLeverage(10);
      setEntryPrice('');
      setMargin('');
      setSize('');
      setStopLoss('');
      setTakeProfit('');
      setStatus('open');
      setExitPrice('');
      setNotes('');
      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setEntryDate(localIso);
    }
  }, [editTrade, isOpen]);

  // Handle Margin change -> auto-update Size
  const handleMarginChange = (val: string) => {
    setMargin(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setSize((num * leverage).toFixed(2));
    }
  };

  // Handle Size change -> auto-update Margin
  const handleSizeChange = (val: string) => {
    setSize(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && leverage > 0) {
      setMargin((num / leverage).toFixed(2));
    }
  };

  // Handle Leverage change -> auto-update Size if Margin exists
  const handleLeverageChange = (newLev: number) => {
    setLeverage(newLev);
    const marginNum = parseFloat(margin);
    if (!isNaN(marginNum) && marginNum > 0) {
      setSize((marginNum * newLev).toFixed(2));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) {
      toast.error(isEn ? "Please enter a symbol." : "Lütfen bir sembol girin.");
      return;
    }

    const numEntry = parseFloat(entryPrice);
    if (isNaN(numEntry) || numEntry <= 0) {
      toast.error(isEn ? "Please enter a valid entry price." : "Geçerli bir giriş fiyatı girin.");
      return;
    }

    const numMargin = parseFloat(margin);
    const numSize = parseFloat(size);
    if ((isNaN(numMargin) || numMargin <= 0) && (isNaN(numSize) || numSize <= 0)) {
      toast.error(isEn ? "Please enter margin or position size." : "Lütfen teminat veya pozisyon büyüklüğü girin.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editTrade) {
        const res = await updateFuturesTradeAction(editTrade.id, {
          symbol: symbol.trim(),
          market,
          side,
          leverage,
          entry_price: numEntry,
          exit_price: exitPrice ? parseFloat(exitPrice) : undefined,
          margin: numMargin > 0 ? numMargin : (numSize / leverage),
          size: numSize > 0 ? numSize : (numMargin * leverage),
          stop_loss: stopLoss ? parseFloat(stopLoss) : undefined,
          take_profit: takeProfit ? parseFloat(takeProfit) : undefined,
          status,
          notes: notes.trim(),
          entry_date: entryDate ? new Date(entryDate).toISOString() : undefined
        });

        if (res.success) {
          toast.success(isEn ? "Trade updated!" : "İşlem güncellendi!");
          onSuccess();
          onClose();
        } else {
          toast.error(res.error || (isEn ? "Failed to update trade." : "İşlem güncellenemedi."));
        }
      } else {
        const res = await createFuturesTradeAction({
          symbol: symbol.trim(),
          market,
          side,
          leverage,
          entry_price: numEntry,
          margin: numMargin > 0 ? numMargin : (numSize / leverage),
          size: numSize > 0 ? numSize : (numMargin * leverage),
          stop_loss: stopLoss ? parseFloat(stopLoss) : undefined,
          take_profit: takeProfit ? parseFloat(takeProfit) : undefined,
          status,
          exit_price: status === 'closed' && exitPrice ? parseFloat(exitPrice) : undefined,
          notes: notes.trim(),
          entry_date: entryDate ? new Date(entryDate).toISOString() : undefined
        });

        if (res.success) {
          toast.success(isEn ? "Position saved to order book!" : "Pozisyon emir defterine kaydedildi!");
          onSuccess();
          onClose();
        } else {
          toast.error(res.error || (isEn ? "Failed to save position." : "Pozisyon kaydedilemedi."));
        }
      }
    } catch {
      toast.error(isEn ? "Connection error." : "Bağlantı hatası.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-[#14141f] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
              side === 'long' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {side === 'long' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {editTrade 
                ? (isEn ? "Edit Position / Trade" : "İşlemi Düzenle") 
                : (isEn ? "New Futures Position" : "Yeni Vadeli Pozisyon")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex flex-col gap-4 text-xs">
          {/* Side Selector (Long / Short) */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/40 border border-white/5">
            <button
              type="button"
              onClick={() => setSide('long')}
              className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                side === 'long'
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <ArrowUpRight size={15} />
              <span>LONG ({isEn ? "Buy" : "Alış"})</span>
            </button>
            <button
              type="button"
              onClick={() => setSide('short')}
              className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                side === 'short'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <ArrowDownRight size={15} />
              <span>SHORT ({isEn ? "Sell" : "Satış"})</span>
            </button>
          </div>

          {/* Symbol & Market */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-white/70">
                {isEn ? "Symbol / Pair *" : "Sembol / Parite *"}
              </label>
              <input
                type="text"
                required
                placeholder="BTCUSDT, ETH, THYAO..."
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-[#8ec13b] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-white/70">
                {isEn ? "Market Platform" : "Piyasa / Platform"}
              </label>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value as FuturesMarket)}
                className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#8ec13b] transition-colors"
              >
                {MARKET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {isEn ? opt.labelEn : opt.labelTr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Leverage Slider & Input */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-white/70 flex items-center gap-1">
                <SlidersHorizontal size={13} className="text-[#8ec13b]" />
                {isEn ? "Leverage" : "Kaldıraç"}
              </span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-white font-mono font-bold text-xs">
                {leverage}x
              </span>
            </div>

            {/* Quick Leverage Presets */}
            <div className="flex flex-wrap gap-1.5">
              {LEVERAGE_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleLeverageChange(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    leverage === p
                      ? 'bg-[#8ec13b] text-black'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  {p}x
                </button>
              ))}
            </div>
          </div>

          {/* Entry Price & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-white/70">
                {isEn ? "Entry Price *" : "Giriş Fiyatı *"}
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-[#8ec13b] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-white/70">
                {isEn ? "Position Status" : "Pozisyon Durumu"}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FuturesStatus)}
                className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#8ec13b] transition-colors"
              >
                <option value="open">{isEn ? "Open Position" : "Açık Pozisyon"}</option>
                <option value="closed">{isEn ? "Closed Trade (History)" : "Kapanmış İşlem (Geçmiş)"}</option>
                <option value="limit">{isEn ? "Limit / Pending Order" : "Limit / Bekleyen Emir"}</option>
              </select>
            </div>
          </div>

          {/* Margin & Position Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-white/70">
                {isEn ? "Margin (Collateral)" : "Teminat (Margin)"}
              </label>
              <input
                type="number"
                step="any"
                placeholder="100.00"
                value={margin}
                onChange={(e) => handleMarginChange(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-[#8ec13b] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-white/70">
                {isEn ? "Total Position Size" : "Pozisyon Büyüklüğü (Size)"}
              </label>
              <input
                type="number"
                step="any"
                placeholder="1000.00"
                value={size}
                onChange={(e) => handleSizeChange(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-[#8ec13b] transition-colors"
              />
            </div>
          </div>

          {/* Stop Loss & Take Profit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-rose-400">
                Stop Loss (SL)
              </label>
              <input
                type="number"
                step="any"
                placeholder={isEn ? "Optional" : "İsteğe bağlı"}
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="w-full bg-white/[0.04] border border-rose-500/20 rounded-xl px-3 py-2 text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-emerald-400">
                Take Profit (TP)
              </label>
              <input
                type="number"
                step="any"
                placeholder={isEn ? "Optional" : "İsteğe bağlı"}
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className="w-full bg-white/[0.04] border border-emerald-500/20 rounded-xl px-3 py-2 text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* If Closed: Exit Price */}
          {status === 'closed' && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-1.5 animate-fadeIn">
              <label className="text-[11px] font-semibold text-amber-300">
                {isEn ? "Exit / Close Price *" : "Çıkış / Kapanış Fiyatı *"}
              </label>
              <input
                type="number"
                step="any"
                required={status === 'closed'}
                placeholder="0.00"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className="w-full bg-black/40 border border-amber-500/30 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {/* Notes / Trade Journal (The user explicitly requested this!) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-white/70 flex items-center gap-1">
              <FileText size={13} className="text-[#8ec13b]" />
              {isEn ? "Trade Notes & Strategy Journal" : "İşlem Notları & Strateji Günlüğü"}
            </label>
            <textarea
              rows={3}
              placeholder={isEn 
                ? "Entry reason, chart pattern, support/resistance, trade journal notes..." 
                : "Giriş sebebi, grafik formasyonu, destek/direnç seviyeleri, strateji ve işlem notları..."}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#8ec13b] transition-colors resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-semibold transition-colors cursor-pointer"
            >
              {isEn ? "Cancel" : "Vazgeç"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#8ec13b] hover:bg-[#79aa32] text-black font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              {isSubmitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Check size={15} strokeWidth={2.5} />
              )}
              <span>{editTrade ? (isEn ? "Update Trade" : "Güncelle") : (isEn ? "Save Position" : "Pozisyonu Kaydet")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
