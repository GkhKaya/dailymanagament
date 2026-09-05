"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, Globe, Coins, Info, Check, Save, Ban } from "lucide-react";
import { getUserMarketsAction, updateUserMarketsAction } from "@/actions/stocks";
import { useTranslation } from "@/hooks/useTranslation";
import toast from "react-hot-toast";

interface ManageMarketsFormProps {
  onClose?: () => void;
  onSuccess?: (markets: string[]) => void;
}

export function ManageMarketsForm({ onClose, onSuccess }: ManageMarketsFormProps) {
  const { locale, isAbroad } = useTranslation();
  const isEn = isAbroad || locale === "en";

  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(["bist"]);
  const [noTrading, setNoTrading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getUserMarketsAction().then((res) => {
      setIsLoading(false);
      if (res.success && res.active_markets) {
        setSelectedMarkets(res.active_markets);
        if (res.active_markets.length === 0) {
          setNoTrading(true);
        }
      }
    });
  }, []);

  const toggleMarket = (marketId: string) => {
    setNoTrading(false);
    setSelectedMarkets((prev) =>
      prev.includes(marketId) ? prev.filter((m) => m !== marketId) : [...prev, marketId]
    );
  };

  const handleSelectNoTrading = () => {
    setNoTrading(true);
    setSelectedMarkets([]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const finalMarkets = noTrading ? [] : selectedMarkets;
      const res = await updateUserMarketsAction(finalMarkets);
      if (res.success) {
        toast.success(
          isEn
            ? "Market preferences updated successfully!"
            : "Piyasa tercihleriniz başarıyla güncellendi!"
        );
        if (onSuccess) onSuccess(finalMarkets);
        if (onClose) onClose();
      } else {
        toast.error(res.error || (isEn ? "Failed to save preferences." : "Tercihler kaydedilemedi."));
      }
    } catch {
      toast.error(isEn ? "An error occurred." : "Bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  const marketsList = [
    {
      id: "bist",
      title: isEn ? "Borsa Istanbul (BIST)" : "Borsa İstanbul (BIST)",
      subtitle: isEn ? "Turkish Equities & TEFAS Funds" : "BIST 100, Pay Piyasası & Fonlar",
      icon: TrendingUp,
      description: isEn
        ? "THYAO, ASELS, EREGL, GARAN and all BIST stocks."
        : "THYAO, ASELS, EREGL, GARAN ve tüm Borsa İstanbul hisseleri.",
      badge: "TRY ₺",
    },
    {
      id: "us",
      title: isEn ? "US Stock Markets" : "Amerikan Borsaları (US Stocks)",
      subtitle: isEn ? "NASDAQ, NYSE & S&P 500" : "NASDAQ, NYSE & S&P 500",
      icon: Globe,
      description: isEn
        ? "Apple (AAPL), Nvidia (NVDA), Microsoft (MSFT), Tesla (TSLA) and US stocks."
        : "Apple (AAPL), Nvidia (NVDA), Microsoft (MSFT), Tesla (TSLA) ve ABD hisseleri.",
      badge: "USD $",
    },
    {
      id: "crypto",
      title: isEn ? "Crypto Assets" : "Kripto Para Piyasası (Crypto)",
      subtitle: isEn ? "Bitcoin, Ethereum & Altcoins" : "Bitcoin, Ethereum & Kripto Varlıklar",
      icon: Coins,
      description: isEn
        ? "Bitcoin (BTC), Ethereum (ETH), Solana (SOL) and digital assets."
        : "Bitcoin (BTC), Ethereum (ETH), Solana (SOL) ve dijital varlıklar.",
      badge: "USD $",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-[var(--on-surface-variant)] text-sm">
        {isEn ? "Loading market preferences..." : "Piyasa tercihleri yükleniyor..."}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4 p-1">
      <div className="flex flex-col gap-1 mb-2">
        <h3 className="text-base font-bold text-white">
          {isEn ? "Select Active Trading Markets" : "İşlem Yaptığınız Piyasaları Seçin"}
        </h3>
        <p className="text-xs text-[var(--on-surface-variant)]">
          {isEn
            ? "Only assets from your selected markets will appear in quick search and trade forms."
            : "Hisse eklerken ve arama yaparken yalnızca seçtiğiniz piyasaların varlıkları listelenir."}
        </p>
      </div>

      {/* Market Cards */}
      <div className="flex flex-col gap-2.5">
        {marketsList.map((m) => {
          const isSelected = !noTrading && selectedMarkets.includes(m.id);
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              onClick={() => toggleMarket(m.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex items-start gap-3.5 ${
                isSelected
                  ? "bg-[rgba(var(--primary-rgb),0.12)] border-[var(--primary)] shadow-md ring-1 ring-[var(--primary)]/30"
                  : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                  isSelected
                    ? "bg-[var(--primary)]/15 border-[var(--primary)]/30 text-[var(--primary)]"
                    : "bg-white/5 border-white/10 text-white/70"
                }`}
              >
                <Icon size={19} />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h4 className="text-sm font-bold text-white">{m.title}</h4>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-white/70 border border-white/10">
                    {m.badge}
                  </span>
                </div>
                <p className="text-xs text-[var(--on-surface-variant)] mb-0.5">{m.subtitle}</p>
                <p className="text-[11px] text-[var(--on-surface-variant)]/80 leading-relaxed">{m.description}</p>
              </div>
              <div
                className={`absolute top-4 right-4 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  isSelected
                    ? "bg-[var(--primary)] border-[var(--primary)] text-black shadow-sm"
                    : "border-white/20 bg-white/5 text-transparent"
                }`}
              >
                <Check size={12} strokeWidth={3} />
              </div>
            </div>
          );
        })}

        {/* Option: No trading */}
        <div
          onClick={handleSelectNoTrading}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex items-center justify-between gap-3 ${
            noTrading
              ? "bg-[rgba(var(--primary-rgb),0.12)] border-[var(--primary)] shadow-md ring-1 ring-[var(--primary)]/30"
              : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                noTrading
                  ? "bg-[var(--primary)]/15 border-[var(--primary)]/30 text-[var(--primary)]"
                  : "bg-white/5 border-white/10 text-white/70"
              }`}
            >
              <Ban size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">
                {isEn ? "I don't trade stocks or crypto (Deactivate all)" : "Borsa veya kripto işlemi yapmıyorum (Hepsini kapat)"}
              </span>
              <span className="text-[10px] text-[var(--on-surface-variant)]">
                {isEn ? "Hides stock alerts and portfolio trackers." : "Borsa bildirim ve arama listelerini devre dışı bırakır."}
              </span>
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0 ${
              noTrading
                ? "bg-[var(--primary)] border-[var(--primary)] text-black shadow-sm"
                : "border-white/20 bg-white/5 text-transparent"
            }`}
          >
            <Check size={12} strokeWidth={3} />
          </div>
        </div>
      </div>

      {/* Data Methodology Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
        <Info size={17} className="text-[var(--on-surface-variant)] shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--on-surface-variant)] leading-relaxed">
          <p className="font-semibold text-white/90 mb-0.5">
            {isEn ? "Market Data Method & Transparency" : "Piyasa Veri Yöntemi & Şeffaflık"}
          </p>
          <p className="text-[11px]">
            {isEn
              ? "Prices are updated periodically using market opening and closing reference quotes (official daily summaries), not real-time tick streaming data."
              : "Fiyatlar seans açılış ve dünkü kapanış referans verileri üzerinden periyodik olarak güncellenir; anlık saniyelik canlı borsa veri akışı değildir."}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-white/10">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {isEn ? "Cancel" : "İptal"}
          </button>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save size={15} />
          <span>{isSaving ? (isEn ? "Saving..." : "Kaydediliyor...") : (isEn ? "Save Preferences" : "Tercihleri Kaydet")}</span>
        </button>
      </div>
    </form>
  );
}
