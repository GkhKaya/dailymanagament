"use client";

import React from "react";
import { HeroPanel } from "@/components/auth/HeroPanel";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { useTranslation } from "@/hooks/useTranslation";

export function ForgotPasswordView() {
  const { t } = useTranslation();
  return (
    <main className="ambient-bg min-h-screen flex" role="main">
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
            style={{ color: "var(--on-surface)", marginBottom: 16 }}
          >
            {t("auth.forgotPasswordTitle")}
          </h2>

          <div className="animate-slide-up anim-delay-200">
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </main>
  );
}
