"use client";

import React, { useState } from "react";
import { X, TrendingUp, Edit2, Trash2, Plus, Calendar, DollarSign, Building2 } from "lucide-react";
import { StockPositionDTO, StockTradeDTO } from "@/models/DashboardTypes";
import { deleteStockTradeAction, deleteStockPositionAction } from "@/actions/stocks";
import { useTranslation } from "@/hooks/useTranslation";
import { getStockCurrencySymbol, formatStockCurrency } from "@/lib/stocks-ui";
import toast from "react-hot-toast";

interface StockPositionOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  position: StockPositionDTO;
  trades: StockTradeDTO[];
  onEditTrade: (trade: StockTradeDTO) => void;
  onAddTrade: (type: 'buy' | 'sell', symbol: string) => void;
  onEditSymbolName: (symbol: string, currentName?: string) => void;
}

export function StockPositionOrdersModal({
  isOpen,
  onClose,
  onSuccess,
  position,
  trades,
  onEditTrade,
  onAddTrade,
  onEditSymbolName,
}: StockPositionOrdersModalProps) {
  const { locale, isAbroad: userAbroad } = useTranslation();
  const isEn = userAbroad || locale === 'en';
  const stockSym = getStockCurrencySymbol();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter trades for this specific symbol
  const symbolTrades = trades.filter(
    (t) => t.symbol.toUpperCase() === position.symbol.toUpperCase()
  );

  const buyTrades = symbolTrades.filter((t) => t.type === 'buy');
  const sellTrades = symbolTrades.filter((t) => t.type === 'sell');

  const handleDelete = async (tradeId: string) => {
    const confirmMsg = isEn
      ? "Are you sure you want to delete this trade? Cost basis will be recalculated."
      : "Bu işlemi silmek istediğinize emin misiniz? Maliyetler geriye dönük tekrar hesaplanacaktır.";
    if (!confirm(confirmMsg)) {
      return;
    }
    setDeletingId(tradeId);
    try {
      const res = await deleteStockTradeAction(tradeId);
      if (res.success) {
        toast.success(isEn ? "Trade deleted and portfolio updated." : "İşlem silindi ve portföy güncellendi.");
        onSuccess();
      } else {
        toast.error(res.error || (isEn ? "Deletion failed." : "Silme başarısız."));
      }
    } catch (err: any) {
      toast.error(err.message || (isEn ? "An error occurred." : "Hata oluştu."));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteEntirePosition = async () => {
    const confirmMsg = isEn
      ? `All buy and sell records for ${position.symbol} will be permanently deleted. Are you sure?`
      : `${position.symbol} hissesine ait tüm alış ve satış kayıtları tamamen silinecektir. Emin misiniz?`;
    if (!confirm(confirmMsg)) {
      return;
    }
    try {
      const res = await deleteStockPositionAction(position.symbol);
      if (res.success) {
        toast.success(isEn ? `${position.symbol} position deleted.` : `${position.symbol} hissesi tamamen silindi.`);
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || (isEn ? "Deletion failed." : "Silme işlemi başarısız."));
      }
    } catch (err: any) {
      toast.error(err.message || (isEn ? "An error occurred." : "Hata oluştu."));
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 backdrop-blur-md bg-black/70 animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-[#12121c] rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] font-black text-sm">
              {position.symbol.slice(0, 4)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">{position.symbol}</h3>
                <button
                  type="button"
                  onClick={() => onEditSymbolName(position.symbol, position.name)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                  title={isEn ? "Edit asset name" : "Şirket adını düzenle"}
                >
                  <Edit2 size={13} />
                </button>
              </div>
              <p className="text-xs text-[var(--on-surface-variant)]">{position.name || (isEn ? "Market Asset" : "Borsa İstanbul")}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Position Summary Bar */}
        <div className="px-5 sm:px-6 py-3 bg-white/5 border-b border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0">
          <div>
            <span className="text-[10px] text-[var(--on-surface-variant)] uppercase block">
              {isEn ? "Holding Shares" : "Eldeki Lot"}
            </span>
            <span className="font-black text-white text-sm">{position.total_lots} {isEn ? "Shares" : "Lot"}</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--on-surface-variant)] uppercase block">
              {isEn ? "Avg Cost" : "Ort. Maliyet"}
            </span>
            <span className="font-black text-white text-sm">
              {formatStockCurrency(position.average_cost)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--on-surface-variant)] uppercase block">
              {isEn ? "Total Cost" : "Toplam Maliyet"}
            </span>
            <span className="font-bold text-white text-sm">
              {formatStockCurrency(position.total_cost)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--on-surface-variant)] uppercase block">
              {isEn ? "Current Price" : "Güncel Fiyat"}
            </span>
            <span className="font-bold text-white text-sm">
              {position.current_price && position.current_price > 0 ? formatStockCurrency(position.current_price) : '—'}
            </span>
          </div>
        </div>

        {/* Scrollable Orders List */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
          
          {/* Action Row */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
              {isEn ? `Buy Orders (${buyTrades.length})` : `Giriş & Alış Emirleri (${buyTrades.length})`}
            </h4>
            <button
              type="button"
              onClick={() => onAddTrade('buy', position.symbol)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={13} /> {isEn ? "Add Buy" : "Yeni Alış Ekle"}
            </button>
          </div>

          {/* Buy Orders */}
          {buyTrades.length === 0 ? (
            <p className="text-xs text-[var(--on-surface-variant)] text-center py-4">
              {isEn ? "No buy orders recorded." : "Kayıtlı alış emri bulunamadı."}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {buyTrades.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-2xl bg-black/40 border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-emerald-400">+{t.lots} {isEn ? 'Shares' : 'Lot'}</span>
                      <span className="text-xs text-white/90">@ {formatStockCurrency(t.price)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--on-surface-variant)]">
                      <span>{isEn ? "Total:" : "Tutar:"} <strong>{formatStockCurrency(t.total_amount)}</strong></span>
                      <span>•</span>
                      <span>{t.date}</span>
                    </div>
                    {t.notes && <p className="text-[10px] text-white/50 italic">{t.notes}</p>}
                  </div>

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditTrade(t)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                      title={isEn ? "Edit trade" : "Giriş fiyatı veya lot adedini düzelt"}
                    >
                      <Edit2 size={14} />
                      <span className="hidden sm:inline text-[11px]">{isEn ? "Edit" : "Düzenle"}</span>
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === t.id}
                      onClick={() => handleDelete(t.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
                      title={isEn ? "Delete" : "Sil"}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sell Orders if any */}
          {sellTrades.length > 0 && (
            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-white/5">
              <h4 className="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                {isEn ? `Past Sell Orders (${sellTrades.length})` : `Geçmiş Satış İşlemleri (${sellTrades.length})`}
              </h4>
              <div className="flex flex-col gap-2">
                {sellTrades.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-400">-{t.lots} {isEn ? 'Shares' : 'Lot'}</span>
                        <span>@ {formatStockCurrency(t.price)}</span>
                        <span className={`font-bold ${t.realized_pnl && t.realized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ({t.realized_pnl && t.realized_pnl >= 0 ? '+' : ''}{formatStockCurrency(t.realized_pnl || 0)} {isEn ? "P&L" : "K/Z"})
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--on-surface-variant)]">{t.date}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditTrade(t)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 cursor-pointer"
                        title={isEn ? "Edit" : "Düzenle"}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                        title={isEn ? "Delete" : "Sil"}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-black/40 border-t border-white/10 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleDeleteEntirePosition}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 size={13} /> {isEn ? "Delete Position" : "Hisseyi Tamamen Sil"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
          >
            {isEn ? "Close" : "Kapat"}
          </button>
        </div>

      </div>
    </div>
  );
}
