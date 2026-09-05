"use client";

import React from "react";
import { HeroPanel } from "@/components/auth/HeroPanel";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthLanguageToggle } from "@/components/auth/AuthLanguageToggle";
import { useTranslation } from "@/hooks/useTranslation";

export function RegisterView() {
  const { t } = useTranslation();

  return (
    <div className="ambient-bg min-h-screen flex relative">
      {/* ── Dil Değiştirici (Top Right) ── */}
      <div className="absolute top-6 right-6 z-30">
        <AuthLanguageToggle />
      </div>

      {/* ── Sol Panel: Logo + Hero ── */}
      <HeroPanel />

      {/* ── Sağ Panel: Form ── */}
      <div className="flex flex-1 items-center justify-center md:justify-end px-8 py-12 md:pl-16 md:pr-24">
        {/* Mobil logo */}
        <div className="md:hidden absolute top-8 w-full flex items-center justify-center gap-2 animate-slide-up">
          <img src="/assets/logo.svg" alt="DailyM" className="h-8 w-auto object-contain" />
          <h1 className="text-logo" style={{ color: "var(--on-surface)" }}>
            {t("home.logo")}
          </h1>
        </div>

        <div style={{ width: "100%", maxWidth: 380 }} className="animate-slide-up anim-delay-100">
          <h2
            className="text-subtitle"
            style={{ color: "var(--on-surface)", marginBottom: 40 }}
          >
            {t("auth.registerTitle")}
          </h2>

          <div className="animate-slide-up anim-delay-200">
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  );
}
