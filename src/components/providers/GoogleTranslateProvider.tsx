"use client";

import React, { useEffect } from "react";
import { isAbroad, getLocale, type Locale } from "@/lib/i18n";

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

export function GoogleTranslateProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Yurt dışındaki kullanıcılar zaten yerel olarak %100 temiz İngilizce arayüze sahiptir.
    // Google Translate sadece TR kullanıcıları isteğe bağlı olarak widget üzerinden tetiklediğinde devreye girer.
    if (isAbroad()) {
      // Clear any leftover googtrans cookies if abroad to keep pure native UI
      document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      try {
        document.cookie = `googtrans=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      } catch {}
      return;
    }

    const currentLoc = getLocale();
    const isGoogleTranslateRequested = localStorage.getItem("dailym-google-translate-active") === "1";
    if (!isGoogleTranslateRequested) {
      // Clear cookies if not explicitly requested
      document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      try {
        document.cookie = `googtrans=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      } catch {}
      return;
    }

    const targetVal = currentLoc === "en" ? "/tr/en" : "/tr/tr";
    document.cookie = `googtrans=${targetVal}; path=/; max-age=31536000`;
    try {
      document.cookie = `googtrans=${targetVal}; path=/; domain=${window.location.hostname}; max-age=31536000`;
    } catch {}

    window.googleTranslateElementInit = () => {
      try {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "tr",
              includedLanguages: "en,tr",
              autoDisplay: false,
              multilanguagePage: true
            },
            "google_translate_element"
          );

          if (currentLoc === "en") {
            setTimeout(() => {
              const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
              if (combo && combo.value !== "en") {
                combo.value = "en";
                combo.dispatchEvent(new Event("change"));
              }
            }, 300);
          }
        }
      } catch (err) {
        console.warn("Google translate element init warning:", err);
      }
    };

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.head.appendChild(script);
    } else if (window.google && window.google.translate) {
      window.googleTranslateElementInit();
    }

    const handleLocaleChange = (e: Event) => {
      if (isAbroad() || localStorage.getItem("dailym-google-translate-active") !== "1") return;
      const newLocale = (e as CustomEvent<Locale>).detail || getLocale();
      const val = newLocale === "en" ? "/tr/en" : "/tr/tr";
      document.cookie = `googtrans=${val}; path=/; max-age=31536000`;
      try {
        document.cookie = `googtrans=${val}; path=/; domain=${window.location.hostname}; max-age=31536000`;
      } catch {}

      const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
      if (combo) {
        combo.value = newLocale === "en" ? "en" : "tr";
        combo.dispatchEvent(new Event("change"));
      }
    };

    window.addEventListener("dailym-locale-change", handleLocaleChange);
    return () => {
      window.removeEventListener("dailym-locale-change", handleLocaleChange);
    };
  }, []);

  return (
    <div
      id="google_translate_element"
      style={{ display: "none" }}
      aria-hidden="true"
    />
  );
}
