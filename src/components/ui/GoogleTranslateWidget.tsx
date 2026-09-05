"use client";

import React, { useState, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { isAbroad, setLocale, type Locale } from "@/lib/i18n";
import { useTranslation } from "@/hooks/useTranslation";
import { saveUserResidenceAction } from "@/actions/residence";
import toast from "react-hot-toast";

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

export function GoogleTranslateWidget() {
  const { locale, isAbroad: userAbroad } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  // Yurt dışında yaşayan kullanıcılar için TR göstermeye gerek yok
  if (userAbroad) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold text-emerald-400">
        <Globe size={13} />
        <span>Global (EN)</span>
      </div>
    );
  }

  const handleToggleLanguage = async (newLocale: Locale) => {
    if (newLocale === locale || isChanging) return;
    setIsChanging(true);

    try {
      localStorage.removeItem("dailym-google-translate-active");
      setLocale(newLocale);

      // Sunucuya da kaydet
      await saveUserResidenceAction({
        country: "TR",
        is_abroad: false,
        language: newLocale
      });

      toast.success(newLocale === "en" ? "Language switched to English" : "Dil Türkçe olarak ayarlandı");
    } catch {
      // Hata olsa dahi yerel dil değişmiştir
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold transition-all shadow-xs">
      <button
        type="button"
        onClick={() => handleToggleLanguage("tr")}
        disabled={isChanging}
        className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
          locale === "tr"
            ? "bg-[var(--primary)] text-black shadow-sm font-bold"
            : "text-[var(--on-surface-variant)] hover:text-white"
        }`}
        title="Türkçe"
      >
        <span>TR</span>
      </button>

      <button
        type="button"
        onClick={() => handleToggleLanguage("en")}
        disabled={isChanging}
        className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
          locale === "en"
            ? "bg-[var(--primary)] text-black shadow-sm font-bold"
            : "text-[var(--on-surface-variant)] hover:text-white"
        }`}
        title="English (Google Translate)"
      >
        <span>EN</span>
      </button>
    </div>
  );
}
