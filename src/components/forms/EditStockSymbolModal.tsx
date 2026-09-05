"use client";

import React, { useState } from "react";
import { X, Building2, CheckCircle2 } from "lucide-react";
import { updateStockSymbolNameAction } from "@/actions/stocks";
import { useTranslation } from "@/hooks/useTranslation";
import toast from "react-hot-toast";

interface EditStockSymbolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  symbol: string;
  currentName?: string;
  currentAssetType?: 'stock' | 'fund' | 'crypto';
}

export function EditStockSymbolModal({
  isOpen,
  onClose,
  onSuccess,
  symbol,
  currentName = "",
  currentAssetType = 'stock',
}: EditStockSymbolModalProps) {
  const { locale, isAbroad: userAbroad } = useTranslation();
  const isEn = userAbroad || locale === 'en';

  const [name, setName] = useState(currentName);
  const [assetType, setAssetType] = useState<'stock' | 'fund' | 'crypto'>(currentAssetType);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await updateStockSymbolNameAction(symbol, name, assetType);
      if (res.success) {
        toast.success(isEn ? `${symbol} details updated.` : `${symbol} bilgileri güncellendi.`);
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

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/70 animate-fade-in">
      <div className="relative w-full max-w-sm flex flex-col bg-[#12121c] rounded-3xl border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] font-bold">
              <Building2 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{symbol} {isEn ? "Asset Info" : "Varlık Bilgisi"}</h3>
              <p className="text-[11px] text-[var(--on-surface-variant)]">{isEn ? "Edit name and asset type" : "Adını ve türünü düzenleyin"}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-white/70 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
              {isEn ? "Description / Name" : "Tanım"}
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isEn ? "e.g. Apple Inc, S&P 500 ETF" : "Örn: Aselsan Elektronik Sanayi"}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
              {isEn ? "Asset Type" : "Varlık Türü"}
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-white/10">
              <button 
                type="button" 
                onClick={() => setAssetType('stock')} 
                className={`min-h-11 rounded-lg text-xs font-bold transition-colors cursor-pointer ${assetType === 'stock' ? 'bg-[var(--primary)] text-white' : 'text-white/60 hover:text-white'}`}
              >
                {isEn ? "Stock" : "Hisse"}
              </button>
              <button 
                type="button" 
                onClick={() => setAssetType('fund')} 
                className={`min-h-11 rounded-lg text-xs font-bold transition-colors cursor-pointer ${assetType === 'fund' ? 'bg-purple-500/25 text-purple-200' : 'text-white/60 hover:text-white'}`}
              >
                {isEn ? "Fund / ETF" : "Fon"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:bg-white/5 cursor-pointer"
            >
              {isEn ? "Cancel" : "Vazgeç"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[var(--primary)] hover:bg-[#3d3fb3] text-black font-bold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (isEn ? "Saving..." : "Kaydediliyor...") : (
                <>
                  <CheckCircle2 size={14} /> {isEn ? "Save" : "Kaydet"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
