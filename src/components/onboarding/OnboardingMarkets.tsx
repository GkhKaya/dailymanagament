"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, Globe, Coins, Info, ArrowRight, SkipForward, Check, Sliders, Ban } from "lucide-react";
import { getUserMarketsAction, updateUserMarketsAction } from "@/actions/stocks";
import { useTranslation } from "@/hooks/useTranslation";
import toast from "react-hot-toast";

interface OnboardingMarketsProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingMarkets({ onComplete, onSkip }: OnboardingMarketsProps) {
  const { locale, isAbroad } = useTranslation();
  const isEn = isAbroad || locale === "en";

  // Default: BIST selected
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(["bist"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noTrading, setNoTrading] = useState(false);

  useEffect(() => {
    getUserMarketsAction().then((res) => {
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

  const handleSaveAndContinue = async () => {
    setIsSubmitting(true);
    try {
      const finalMarkets = noTrading ? [] : selectedMarkets;
      const res = await updateUserMarketsAction(finalMarkets);
      if (res.success) {
        toast.success(
          isEn
            ? "Market preferences saved successfully!"
            : "Piyasa tercihleriniz başarıyla kaydedildi!"
        );
        onComplete();
      } else {
        toast.error(res.error || (isEn ? "Failed to save preferences." : "Tercihler kaydedilemedi."));
      }
    } catch {
      toast.error(isEn ? "An error occurred." : "Bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const marketsList = [
    {
      id: "bist",
      title: isEn ? "Borsa Istanbul (BIST)" : "Borsa İstanbul (BIST)",
      subtitle: isEn ? "Turkish Equities & Mutual Funds (TRY)" : "BIST 100, Pay Piyasası & Fonlar (TRY)",
      icon: TrendingUp,
      description: isEn
        ? "THYAO, ASELS, EREGL, GARAN and all BIST stocks with TEFAS funds."
        : "THYAO, ASELS, EREGL, GARAN ve tüm Borsa İstanbul payları ile TEFAS yatırım fonları.",
      badge: "TRY ₺",
    },
    {
      id: "us",
      title: isEn ? "US Stock Markets" : "Amerikan Borsaları (US Stocks)",
      subtitle: isEn ? "NASDAQ, NYSE & S&P 500 (USD)" : "NASDAQ, NYSE & S&P 500 (USD)",
      icon: Globe,
      description: isEn
        ? "Apple (AAPL), Nvidia (NVDA), Microsoft (MSFT), Tesla (TSLA) and global US stocks."
        : "Apple (AAPL), Nvidia (NVDA), Microsoft (MSFT), Tesla (TSLA) ve küresel ABD hisseleri.",
      badge: "USD $",
    },
    {
      id: "crypto",
      title: isEn ? "Crypto Assets" : "Kripto Para Piyasası (Crypto)",
      subtitle: isEn ? "Bitcoin, Ethereum & Major Cryptos (USD)" : "Bitcoin, Ethereum & Kripto Varlıklar (USD)",
      icon: Coins,
      description: isEn
        ? "Bitcoin (BTC), Ethereum (ETH), Solana (SOL) and leading digital assets."
        : "Bitcoin (BTC), Ethereum (ETH), Solana (SOL) ve önde gelen dijital varlıklar.",
      badge: "USD $",
    },
  ];

  return (
    <div className="flex flex-col animate-slide-up w-full max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[var(--primary)]/15 text-[var(--primary)] rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 suppressHydrationWarning className="text-2xl font-bold text-white">
              {isEn ? "Select Your Investment Markets" : "İşlem Yaptığınız Piyasalar"}
            </h2>
            <p suppressHydrationWarning className="text-sm text-[var(--on-surface-variant)]">
              {isEn
                ? "Choose which markets you trade in to customize your portfolio & asset search."
                : "Hangi piyasalarda işlem yapıyorsanız seçin; portföy ve hisse aramanız buna göre şekillensin."}
            </p>
          </div>
        </div>

        <button 
          type="button"
          onClick={onSkip}
          className="text-xs text-[var(--on-surface-variant)] hover:text-white flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors shrink-0 cursor-pointer"
        >
          <span>{isEn ? "Dashboard ›" : "Ana Sayfa ›"}</span>
        </button>
      </div>

      {/* Market Cards */}
      <div className="flex flex-col gap-3 mb-6">
        {marketsList.map((m) => {
          const isSelected = !noTrading && selectedMarkets.includes(m.id);
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              onClick={() => toggleMarket(m.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex items-start gap-4 ${
                isSelected
                  ? "bg-[rgba(var(--primary-rgb),0.12)] border-[var(--primary)] shadow-md ring-1 ring-[var(--primary)]/30"
                  : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                  isSelected
                    ? "bg-[var(--primary)]/15 border-[var(--primary)]/30 text-[var(--primary)]"
                    : "bg-white/5 border-white/10 text-white/70"
                }`}
              >
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-base font-bold text-white">{m.title}</h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/5 text-white/70 border border-white/10">
                    {m.badge}
                  </span>
                </div>
                <p className="text-xs text-[var(--on-surface-variant)] mb-1">{m.subtitle}</p>
                <p className="text-xs text-[var(--on-surface-variant)]/80 leading-relaxed">{m.description}</p>
              </div>
              <div
                className={`absolute top-5 right-5 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
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
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex items-center justify-between gap-4 ${
            noTrading
              ? "bg-[rgba(var(--primary-rgb),0.12)] border-[var(--primary)] shadow-md ring-1 ring-[var(--primary)]/30"
              : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                noTrading
                  ? "bg-[var(--primary)]/15 border-[var(--primary)]/30 text-[var(--primary)]"
                  : "bg-white/5 border-white/10 text-white/70"
              }`}
            >
              <Ban size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">
                {isEn ? "I don't trade stocks or crypto (Skip)" : "Borsa veya kripto işlemi yapmıyorum (Atla)"}
              </span>
              <span className="text-xs text-[var(--on-surface-variant)]">
                {isEn
                  ? "You can always activate markets later in Settings."
                  : "Dilediğiniz zaman Ayarlar bölümünden piyasaları aktif edebilirsiniz."}
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

      {/* Transparency & Data Notice */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 mb-4 flex items-start gap-3">
        <Info size={18} className="text-[var(--on-surface-variant)] shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--on-surface-variant)] leading-relaxed">
          <p className="font-semibold text-white/90 mb-1">
            {isEn ? "Market Data Method & Transparency" : "Piyasa Veri Yöntemi & Şeffaflık"}
          </p>
          <p>
            {isEn
              ? "Prices are updated periodically using market opening and closing reference quotes (official daily summaries). Our platform does not use costly real-time tick streaming data."
              : "Fiyatlar seans açılış ve önceki gün kapanış referans verileri üzerinden periyodik olarak güncellenir. Sistemimiz saniyelik anlık canlı borsa veri akışı (streaming) değildir."}
          </p>
        </div>
      </div>

      {/* Settings Notification */}
      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 mb-6 flex items-center gap-3">
        <Sliders size={18} className="text-[var(--primary)] shrink-0" />
        <p className="text-xs text-[var(--on-surface-variant)]">
          {isEn
            ? "You can change or reconfigure these market preferences anytime from Profile > Settings."
            : "Bu ayarların tamamını dilediğiniz zaman Profil > Ayarlar bölümünden değiştirebilir veya güncelleyebilirsiniz."}
        </p>
      </div>

      {/* Bottom Actions */}
      <div className="flex gap-4 mt-auto pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onSkip}
          className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <SkipForward size={18} />
          <span>{isEn ? "Skip" : "Atla"}</span>
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSaveAndContinue}
          className="flex-1 py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>{isEn ? "Save & Go to Dashboard" : "Kaydet ve Başla"}</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
