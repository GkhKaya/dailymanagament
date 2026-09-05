"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Globe, MapPin, Check, Sparkles, Loader2, ArrowRight, ChevronDown, Search, X } from "lucide-react";
import { saveUserResidenceAction, getUserResidenceAction } from "@/actions/residence";
import { setResidencePreferences, type Locale } from "@/lib/i18n";
import toast from "react-hot-toast";

interface CountryItem {
  code: string;
  nameEn: string;
  nameTr: string;
  flag: string;
}

const COUNTRIES: CountryItem[] = [
  { code: "DE", nameEn: "Germany", nameTr: "Almanya", flag: "🇩🇪" },
  { code: "US", nameEn: "United States", nameTr: "Amerika Birleşik Devletleri", flag: "🇺🇸" },
  { code: "GB", nameEn: "United Kingdom", nameTr: "Birleşik Krallık / İngiltere", flag: "🇬🇧" },
  { code: "NL", nameEn: "Netherlands", nameTr: "Hollanda", flag: "🇳🇱" },
  { code: "FR", nameEn: "France", nameTr: "Fransa", flag: "🇫🇷" },
  { code: "AT", nameEn: "Austria", nameTr: "Avusturya", flag: "🇦🇹" },
  { code: "CH", nameEn: "Switzerland", nameTr: "İsviçre", flag: "🇨🇭" },
  { code: "BE", nameEn: "Belgium", nameTr: "Belçika", flag: "🇧🇪" },
  { code: "CA", nameEn: "Canada", nameTr: "Kanada", flag: "🇨🇦" },
  { code: "AU", nameEn: "Australia", nameTr: "Avustralya", flag: "🇦🇺" },
  { code: "AZ", nameEn: "Azerbaijan", nameTr: "Azerbaycan", flag: "🇦🇿" },
  { code: "SE", nameEn: "Sweden", nameTr: "İsveç", flag: "🇸🇪" },
  { code: "NO", nameEn: "Norway", nameTr: "Norveç", flag: "🇳🇴" },
  { code: "DK", nameEn: "Denmark", nameTr: "Danimarka", flag: "🇩🇰" },
  { code: "IT", nameEn: "Italy", nameTr: "İtalya", flag: "🇮🇹" },
  { code: "ES", nameEn: "Spain", nameTr: "İspanya", flag: "🇪🇸" },
  { code: "AE", nameEn: "United Arab Emirates", nameTr: "BAE (Dubai)", flag: "🇦🇪" },
  { code: "QA", nameEn: "Qatar", nameTr: "Katar", flag: "🇶🇦" },
  { code: "SA", nameEn: "Saudi Arabia", nameTr: "Suudi Arabistan", flag: "🇸🇦" },
  { code: "PL", nameEn: "Poland", nameTr: "Polonya", flag: "🇵🇱" },
  { code: "IE", nameEn: "Ireland", nameTr: "İrlanda", flag: "🇮🇪" },
  { code: "RU", nameEn: "Russia", nameTr: "Rusya", flag: "🇷🇺" },
  { code: "JP", nameEn: "Japan", nameTr: "Japonya", flag: "🇯🇵" },
  { code: "KR", nameEn: "South Korea", nameTr: "Güney Kore", flag: "🇰🇷" },
  { code: "OTHER", nameEn: "Other Country", nameTr: "Diğer Ülke", flag: "🌍" }
];

export function ResidenceOnboardingModal({ onComplete }: { onComplete?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [residenceType, setResidenceType] = useState<"tr" | "abroad">("tr");
  const [selectedCountry, setSelectedCountry] = useState("DE");
  const [selectedLanguage, setSelectedLanguage] = useState<Locale>("tr");

  // Country Picker State
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If already completed on this device, skip redundant server action
    if (typeof window !== "undefined" && localStorage.getItem("dailym-residence-completed") === "1") {
      setIsLoading(false);
      return;
    }

    getUserResidenceAction()
      .then((res) => {
        if (res.success && res.settings) {
          if (res.settings.onboarding_residence_completed) {
            localStorage.setItem("dailym-residence-completed", "1");
            localStorage.setItem("dailym-country", res.settings.country);
            localStorage.setItem("dailym-is-abroad", res.settings.is_abroad ? "1" : "0");
            localStorage.setItem("dailym-lang", res.settings.language);
            setIsLoading(false);
            return;
          } else {
            // User has NOT completed residence on server: clear stale localStorage
            localStorage.removeItem("dailym-residence-completed");
          }
        }
        setIsOpen(true);
        setIsLoading(false);
      })
      .catch(() => {
        // Fallback check if network fails
        if (typeof window !== "undefined" && localStorage.getItem("dailym-residence-completed") !== "1") {
          setIsOpen(true);
        }
        setIsLoading(false);
      });
  }, []);

  // Close picker on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    }
    if (isPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPickerOpen]);

  const handleSelectResidence = (type: "tr" | "abroad") => {
    setResidenceType(type);
    if (type === "abroad") {
      setSelectedLanguage("en");
    } else {
      setSelectedLanguage("tr");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const isAbroad = residenceType === "abroad";
    const country = isAbroad ? selectedCountry : "TR";
    const language: Locale = isAbroad ? "en" : selectedLanguage;

    try {
      const res = await saveUserResidenceAction({
        country,
        is_abroad: isAbroad,
        language
      });

      if (res.success) {
        setResidencePreferences({ country, isAbroad, language });
        localStorage.setItem("dailym-residence-completed", "1");
        toast.success(
          isAbroad
            ? "Global settings enabled. Welcome!"
            : "Tercihleriniz kaydedildi. Hoş geldiniz!"
        );
        setIsOpen(false);
        onComplete?.();
        window.location.reload();
      } else {
        toast.error(res.error || "Ayarlar kaydedilemedi.");
      }
    } catch (err: any) {
      toast.error(err.message || "Bağlantı hatası.");
    } finally {
      setIsSaving(false);
    }
  };

  const activeCountry = useMemo(() => {
    return COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[0];
  }, [selectedCountry]);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.nameEn.toLowerCase().includes(q) ||
        c.nameTr.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  if (isLoading || !isOpen) return null;

  const isAbroadMode = residenceType === "abroad";

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-[#14141E] border border-[rgba(255,255,255,0.12)] rounded-3xl p-6 sm:p-8 shadow-[0_24px_64px_rgba(0,0,0,0.9)] flex flex-col gap-6 text-white relative">
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-[var(--primary)] flex items-center justify-center shadow-lg mb-1">
            <Globe size={28} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {isAbroadMode ? "Welcome to DailyM" : "DailyM'e Hoş Geldiniz"}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--on-surface-variant)] max-w-sm leading-relaxed">
            {isAbroadMode
              ? "Personalize your nutrition and dashboard experience."
              : "Deneyiminizi yaşadığınız yere ve dil tercihinize göre kişiselleştirelim."}
          </p>
        </div>

        {/* Question 1: Residence Location */}
        <div className="flex flex-col gap-2.5">
          <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
            <MapPin size={14} className="text-[var(--primary)]" />
            <span>{isAbroadMode ? "Where do you reside?" : "Nerede ikamet ediyorsunuz?"}</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Turkey Option */}
            <button
              type="button"
              onClick={() => handleSelectResidence("tr")}
              className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer relative ${
                residenceType === "tr"
                  ? "bg-[rgba(var(--primary-rgb),0.12)] border-[var(--primary)] shadow-md ring-1 ring-[var(--primary)]/40"
                  : "bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/20"
              }`}
            >
              {residenceType === "tr" && (
                <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-[var(--primary)] text-black flex items-center justify-center shadow-sm">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-base">🇹🇷</span>
                <span>{isAbroadMode ? "Turkey" : "Türkiye"}</span>
              </span>
              <span className="text-[11px] text-[var(--on-surface-variant)] leading-snug">
                {isAbroadMode
                  ? "Living in Turkey (TR Database)"
                  : "Türkiye'de yaşıyorum (TR Veritabanı)"}
              </span>
            </button>

            {/* Abroad Option */}
            <button
              type="button"
              onClick={() => handleSelectResidence("abroad")}
              className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer relative ${
                residenceType === "abroad"
                  ? "bg-[rgba(var(--primary-rgb),0.12)] border-[var(--primary)] shadow-md ring-1 ring-[var(--primary)]/40"
                  : "bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/20"
              }`}
            >
              {residenceType === "abroad" && (
                <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-[var(--primary)] text-black flex items-center justify-center shadow-sm">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-base">🌍</span>
                <span>{isAbroadMode ? "Abroad / International" : "Yurt Dışı / Diğer"}</span>
              </span>
              <span className="text-[11px] text-[var(--on-surface-variant)] leading-snug">
                {isAbroadMode
                  ? "Living outside Turkey (Global Foods & EN)"
                  : "Türkiye dışında (Global Besinler & EN)"}
              </span>
            </button>
          </div>
        </div>

        {/* If Abroad: Sleek Custom Country Picker */}
        {residenceType === "abroad" && (
          <div className="flex flex-col gap-2.5 animate-fade-in" ref={pickerRef}>
            <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center justify-between">
              <span>{isAbroadMode ? "Country of Residence" : "İkamet Ettiğiniz Ülke"}</span>
            </label>

            {/* Trigger Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPickerOpen((prev) => !prev)}
                className={`w-full bg-white/[0.04] hover:bg-white/[0.07] border rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all cursor-pointer ${
                  isPickerOpen
                    ? "border-[var(--primary)] shadow-[0_0_16px_rgba(var(--primary-rgb),0.15)] ring-1 ring-[var(--primary)]/50"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-xl shrink-0 shadow-inner">
                    {activeCountry.flag}
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">
                        {activeCountry.nameEn}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/70 border border-white/10">
                        {activeCountry.code}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--on-surface-variant)] truncate">
                      {isAbroadMode ? "Global Food Catalog & English" : activeCountry.nameTr}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-[var(--primary)] font-semibold hidden sm:inline">
                    {isPickerOpen
                      ? (isAbroadMode ? "Close" : "Kapat")
                      : (isAbroadMode ? "Change" : "Değiştir")}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-white/60 transition-transform duration-250 ${
                      isPickerOpen ? "rotate-180 text-[var(--primary)]" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Dropdown Panel */}
              {isPickerOpen && (
                <div className="mt-2 w-full bg-[#1A1A28] border border-white/15 rounded-2xl p-3 shadow-2xl flex flex-col gap-3 animate-slide-up z-20">
                  {/* Search input */}
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
                    />
                    <input
                      type="text"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder={
                        isAbroadMode
                          ? "Search country name or code... (e.g. Germany, US, UK)"
                          : "Ülke adı veya kodu yazın... (örn: Almanya, US, UK)"
                      }
                      className="w-full bg-white/[0.04] border border-white/10 focus:border-[var(--primary)] rounded-xl py-2.5 pl-10 pr-8 text-xs text-white placeholder-white/35 focus:outline-none transition-all"
                      autoFocus
                    />
                    {countrySearch && (
                      <button
                        type="button"
                        onClick={() => setCountrySearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Scrollable list */}
                  <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((c) => {
                        const isSelected = selectedCountry === c.code;
                        return (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(c.code);
                              setIsPickerOpen(false);
                              setCountrySearch("");
                            }}
                            className={`p-2.5 rounded-xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[rgba(var(--primary-rgb),0.15)] border border-[var(--primary)]/50 text-[var(--primary)] font-bold"
                                : "hover:bg-white/[0.06] text-white/90 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-xl shrink-0">{c.flag}</span>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold truncate text-white">
                                  {c.nameEn}
                                </span>
                                <span className="text-[10px] text-[var(--on-surface-variant)] truncate">
                                  {isAbroadMode ? c.code : c.nameTr}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70 border border-white/10">
                                {c.code}
                              </span>
                              {isSelected && (
                                <Check size={14} className="text-[var(--primary)]" strokeWidth={3} />
                              )}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="py-6 text-center text-xs text-[var(--on-surface-variant)]">
                        {isAbroadMode ? "No matching country found." : "Eşleşen ülke bulunamadı."}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Info Badge */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300 shadow-sm">
              <Sparkles size={16} className="shrink-0 text-emerald-400" />
              <span>
                {isAbroadMode ? (
                  <>
                    The app will open in <strong>English</strong> with <strong>Global Food Database</strong> active.
                  </>
                ) : (
                  <>
                    Site <strong>İngilizce</strong> olarak açılacak ve <strong>Global Besin Kataloğu</strong> aktif edilecektir.
                  </>
                )}
              </span>
            </div>
          </div>
        )}

        {/* If Turkey: Language Preference */}
        {residenceType === "tr" && (
          <div className="flex flex-col gap-2.5 animate-fade-in">
            <label className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
              <Globe size={13} className="text-[var(--primary)]" />
              <span>Tercih Ettiğiniz Dil</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedLanguage("tr")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  selectedLanguage === "tr"
                    ? "bg-[var(--primary)] text-black border-[var(--primary)] shadow-sm"
                    : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10"
                }`}
              >
                <span>Türkçe (Varsayılan)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedLanguage("en")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  selectedLanguage === "en"
                    ? "bg-[var(--primary)] text-black border-[var(--primary)] shadow-sm"
                    : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10"
                }`}
              >
                <span>English (İngilizce)</span>
              </button>
            </div>
            <span className="text-[11px] text-[var(--on-surface-variant)] text-center">
              (Dilediğiniz an üst menüden dilinizi değiştirebilirsiniz)
            </span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="w-full py-3.5 px-4 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(var(--primary-rgb),0.25)] hover:shadow-[0_0_32px_rgba(var(--primary-rgb),0.4)] disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 size={18} className="animate-spin text-black" />
              <span>{isAbroadMode ? "Configuring..." : "Kaydediliyor..."}</span>
            </>
          ) : (
            <>
              <span>{isAbroadMode ? "Get Started" : "Başla ve Devam Et"}</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
