"use client";

import React from "react";
import { HeroPanel } from "@/components/auth/HeroPanel";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthLanguageToggle } from "@/components/auth/AuthLanguageToggle";
import { useTranslation } from "@/hooks/useTranslation";

export function LoginView() {
  const { t } = useTranslation();

  return (
    <main className="ambient-bg min-h-screen flex relative" role="main">
      {/* ── Dil Değiştirici (Top Right) ── */}
      <div className="absolute top-6 right-6 z-30">
        <AuthLanguageToggle />
      </div>

      {/* ── Sol Panel: Logo + Hero ── */}
      <HeroPanel />

      {/* ── Sağ Panel: Form ── */}
      <div className="flex flex-1 items-center justify-center md:justify-end px-8 py-12 md:pl-16 md:pr-24">
        {/* Mobil logo */}
        <header className="md:hidden absolute top-8 w-full flex items-center justify-center gap-2 animate-slide-up">
          <img src="/assets/logo.svg" alt="DailyM - Kişisel Yönetim Asistanı" className="h-8 w-auto object-contain" />
          <span className="text-logo font-bold" style={{ color: "var(--on-surface)" }}>
            {t("home.logo")}
          </span>
        </header>

        <div style={{ width: "100%", maxWidth: 380 }} className="animate-slide-up anim-delay-100">
          <h2
            className="text-subtitle"
            style={{ color: "var(--on-surface)", marginBottom: 40 }}
          >
            {t("auth.welcomeTitle")}
          </h2>

          <div className="animate-slide-up anim-delay-200">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
