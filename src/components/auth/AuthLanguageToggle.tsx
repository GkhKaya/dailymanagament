"use client";

import React from "react";
import { Globe } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export function AuthLanguageToggle() {
  const { locale, changeLocale } = useTranslation();

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/10 shadow-lg">
      <div className="pl-2 pr-1 text-white/50 flex items-center">
        <Globe size={14} />
      </div>
      <button
        type="button"
        onClick={() => changeLocale("tr")}
        className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
          locale === "tr"
            ? "bg-[var(--primary)] text-black shadow-sm scale-105"
            : "text-white/60 hover:text-white"
        }`}
        aria-label="Türkçe"
      >
        TR
      </button>
      <button
        type="button"
        onClick={() => changeLocale("en")}
        className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
          locale === "en"
            ? "bg-[var(--primary)] text-black shadow-sm scale-105"
            : "text-white/60 hover:text-white"
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
