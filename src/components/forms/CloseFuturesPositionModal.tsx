'use client';

import React, { useState } from 'react';
import { X, Check, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { closeFuturesPositionAction, FuturesTradeDTO } from '@/actions/futures';
import { calculateFuturesPnl } from '@/lib/futures-engine';
import toast from 'react-hot-toast';

interface CloseFuturesPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trade: FuturesTradeDTO | null;
  isEn?: boolean;
}

export function CloseFuturesPositionModal({
  isOpen,
  onClose,
  onSuccess,
  trade,
  isEn = false
}: CloseFuturesPositionModalProps) {
  const [exitPrice, setExitPrice] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !trade) return null;

  const numExit = parseFloat(exitPrice);
  const isValidExit = !isNaN(numExit) && numExit > 0;

  const preview = isValidExit ? calculateFuturesPnl({
    side: trade.side,
    entryPrice: trade.entry_price,
    exitPrice: numExit,
    leverage: trade.leverage,
    margin: trade.margin,
    size: trade.size
  }) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidExit) {
      toast.error(isEn ? "Please enter a valid exit price." : "Geçerli bir çıkış fiyatı girin.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await closeFuturesPositionAction(trade.id, {
        exit_price: numExit,
        notes: closeNotes.trim() || undefined
      });

      if (res.success) {
        toast.success(isEn ? "Position closed!" : "Pozisyon başarıyla kapatıldı!");
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || (isEn ? "Failed to close position." : "Pozisyon kapatılamadı."));
      }
    } catch {
      toast.error(isEn ? "Connection error." : "Bağlantı hatası.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLong = trade.side === 'long';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-[#14141f] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              isLong 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {trade.side.toUpperCase()} {trade.leverage}x
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {isEn ? `Close ${trade.symbol}` : `${trade.symbol} Pozisyonunu Kapat`}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
          {/* Position Summary Card */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[10px] text-white/50 uppercase">{isEn ? "Entry" : "Giriş"}</span>
              <p className="font-mono font-bold text-white mt-0.5">{trade.entry_price}</p>
            </div>
            <div>
              <span className="text-[10px] text-white/50 uppercase">{isEn ? "Margin" : "Teminat"}</span>
              <p className="font-mono font-bold text-white mt-0.5">${trade.margin}</p>
            </div>
            <div>
              <span className="text-[10px] text-white/50 uppercase">{isEn ? "Size" : "Büyüklük"}</span>
              <p className="font-mono font-bold text-white mt-0.5">${trade.size}</p>
            </div>
          </div>

          {/* Exit Price Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-white/80">
              {isEn ? "Exit / Market Price *" : "Çıkış / Kapanış Fiyatı *"}
            </label>
            <input
              type="number"
              step="any"
              autoFocus
              required
              placeholder="0.00"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm placeholder:text-white/30 focus:outline-none focus:border-[#8ec13b] transition-colors"
            />
          </div>

          {/* Dynamic PnL Preview */}
          {preview && (
            <div className={`p-3 rounded-xl border flex items-center justify-between animate-fadeIn ${
              preview.pnl >= 0 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <div className="flex items-center gap-1.5 font-bold">
                {preview.pnl >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{isEn ? "Estimated PnL:" : "Tahmini K/Z:"}</span>
              </div>
              <div className="text-right font-mono font-bold">
                <span>{preview.pnl >= 0 ? `+$${preview.pnl}` : `-$${Math.abs(preview.pnl)}`}</span>
                <span className="text-[10px] opacity-80 ml-1.5">
                  ({preview.pnlPercent >= 0 ? `+${preview.pnlPercent}%` : `${preview.pnlPercent}%`})
                </span>
              </div>
            </div>
          )}

          {/* Optional Closing Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-white/70">
              {isEn ? "Closing Note (Optional)" : "Kapanış Notu (İsteğe Bağlı)"}
            </label>
            <textarea
              rows={2}
              placeholder={isEn 
                ? "Target achieved, stopped out, market reversal note..." 
                : "Hedefe ulaşıldı kâr alındı, stop oldum, piyasa dönüşü notu..."}
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#8ec13b] transition-colors resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-semibold transition-colors cursor-pointer"
            >
              {isEn ? "Cancel" : "Vazgeç"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValidExit}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              {isSubmitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Check size={15} strokeWidth={2.5} />
              )}
              <span>{isEn ? "Close Position" : "Pozisyonu Kapat"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
