"use client";

import React, { useState } from "react";
import { X, CheckCircle2, TrendingUp, RefreshCw } from "lucide-react";
import { updateStockCurrentPriceAction, fetchMarketQuoteAction } from "@/actions/stocks";
import { StockPositionDTO } from "@/models/DashboardTypes";
import { useTranslation } from "@/hooks/useTranslation";
import { getStockCurrencySymbol, formatStockCurrency } from "@/lib/stocks-ui";
import toast from "react-hot-toast";

interface UpdateStockPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  position: StockPositionDTO | null;
}

export function UpdateStockPriceModal({
  isOpen,
  onClose,
  onSuccess,
  position,
}: UpdateStockPriceModalProps) {
  const { locale, isAbroad: userAbroad } = useTranslation();
  const isEn = userAbroad || locale === 'en';
  const stockSym = getStockCurrencySymbol();

  const [price, setPrice] = useState<string>(
    position?.current_price && position.current_price > 0 ? String(position.current_price) : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [marketInfo, setMarketInfo] = useState<{
    openPrice: number;
    closePrice: number;
    dayChangePercent: number;
  } | null>(
    position?.open_price || position?.close_price ? {
      openPrice: position.open_price || 0,
      closePrice: position.close_price || 0,
      dayChangePercent: position.day_change_percent || 0
    } : null
  );

  const handleFetchMarketPrice = async () => {
    if (!position) return;
    setIsFetchingQuote(true);
    try {
      const res = await fetchMarketQuoteAction(position.symbol, position.assetType);
      if (res.success && res.data) {
        setPrice(String(res.data.currentPrice));
        setMarketInfo({
          openPrice: res.data.openPrice,
          closePrice: res.data.closePrice,
          dayChangePercent: res.data.dayChangePercent,
        });
        toast.success(
          isEn
            ? `${position.symbol} market price updated: ${stockSym}${res.data.currentPrice}`
            : `${position.symbol} piyasa fiyatı getirildi: ${res.data.currentPrice} ${stockSym}`
        );
      } else {
        toast.error(res.error || (isEn ? "Failed to fetch market price." : "Piyasa fiyatı çekilemedi."));
      }
    } catch {
      toast.error(isEn ? "Could not retrieve market price." : "Piyasa fiyatı alınamadı.");
    } finally {
      setIsFetchingQuote(false);
    }
  };

  if (!isOpen || !position) return null;

  const numPrice = parseFloat(price) || 0;
  const potentialValue = numPrice * position.total_lots;
  const potentialPnl = numPrice > 0 ? potentialValue - position.total_cost : 0;
  const potentialPnlPercent = numPrice > 0 && position.total_cost > 0
    ? ((potentialValue - position.total_cost) / position.total_cost) * 100
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numPrice <= 0) {
      toast.error(isEn ? "Please enter a valid current price." : "Lütfen geçerli bir güncel fiyat girin.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateStockCurrentPriceAction(position.symbol, numPrice);
      if (res.success) {
        toast.success(
          isEn
            ? `${position.symbol} current price updated!`
            : `${position.symbol} güncel fiyatı güncellendi!`
        );
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || (isEn ? "Update failed." : "Güncelleme başarısız."));
      }
    } catch (err: any) {
      toast.error(err.message || (isEn ? "An error occurred." : "Hata oluştu."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const assetTypeName = position.assetType === 'fund'
    ? (isEn ? 'Fund' : 'Fon')
    : (isEn ? 'Stock' : 'Hisse');

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/70 animate-fade-in">
      <div className="relative w-full max-w-sm flex flex-col bg-[#12121c] rounded-3xl border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] font-bold">
              <TrendingUp size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {position.symbol} {isEn ? `Current ${assetTypeName} Price` : `Güncel ${assetTypeName} Fiyatı`}
              </h3>
              <p className="text-[11px] text-[var(--on-surface-variant)]">
                {position.total_lots} {isEn ? 'Shares' : 'Lot'} | {isEn ? 'Avg Cost' : 'Ort. Maliyet'}: {formatStockCurrency(position.average_cost)}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-white/70">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                {isEn ? `Current Price (${stockSym})` : `Güncel ${assetTypeName} Fiyatı (${stockSym})`}
              </label>
              <button
                type="button"
                disabled={isFetchingQuote}
                onClick={handleFetchMarketPrice}
                className="text-[11px] font-bold text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={11} className={isFetchingQuote ? "animate-spin" : ""} />
                {isFetchingQuote ? (isEn ? "Fetching..." : "Piyasa Alınıyor...") : (isEn ? "Fetch Market" : "Piyasadan Getir")}
              </button>
            </div>
            <input
              type="number"
              step="any"
              min="0"
              required
              autoFocus
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={isEn ? "e.g. 285.40" : "Örn: 285.40"}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-base text-white font-extrabold focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          {/* Market Quote Details Badge */}
          {marketInfo && (marketInfo.openPrice > 0 || marketInfo.closePrice > 0) && (
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1 text-[11px]">
              <div className="flex items-center justify-between text-[var(--on-surface-variant)]">
                <span>{isEn ? "Market Info:" : "Piyasa Bilgisi:"}</span>
                <span className={`font-bold ${marketInfo.dayChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {marketInfo.dayChangePercent >= 0 ? '▲ +' : '▼ '}
                  {marketInfo.dayChangePercent.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-white/70">
                <span>{isEn ? "Open:" : "Açılış:"} <b className="text-white">{formatStockCurrency(marketInfo.openPrice)}</b></span>
                <span>{isEn ? "Prev Close:" : "Önceki Kapanış:"} <b className="text-white">{formatStockCurrency(marketInfo.closePrice)}</b></span>
              </div>
            </div>
          )}

          {numPrice > 0 && (
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              potentialPnl >= 0
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}>
              <div>
                <p className="text-[10px] opacity-70">{isEn ? "Unrealized P&L" : "Potansiyel Kâr/Zarar"}</p>
                <p className="font-extrabold text-sm">
                  {potentialPnl >= 0 ? '+' : ''}{formatStockCurrency(potentialPnl)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] opacity-70">{isEn ? "Return" : "Getiri"}</p>
                <p className="font-black text-sm">{potentialPnlPercent >= 0 ? '+' : ''}%{potentialPnlPercent.toFixed(2)}</p>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 text-white/80 hover:text-white text-xs font-semibold cursor-pointer"
            >
              {isEn ? "Cancel" : "İptal"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[var(--primary)] hover:opacity-90 text-black text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 size={15} /> {isSubmitting ? (isEn ? "Saving..." : "Kaydediliyor...") : (isEn ? "Save" : "Kaydet")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
