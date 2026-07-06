import React from "react";
import { HeroPanel } from "@/components/auth/HeroPanel";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { t } from "@/lib/i18n";

export function ForgotPasswordView() {
  return (
    <div className="ambient-bg min-h-screen flex">
      {/* ── Sol Panel: Logo + Hero ── */}
      <HeroPanel />

      {/* ── Sağ Panel: Form ── */}
      <div className="flex flex-1 items-center justify-center md:justify-end px-8 py-12 md:pl-16 md:pr-24">
        {/* Mobil logo */}
        <div className="md:hidden absolute top-8 w-full text-center animate-slide-up">
          <h1 className="text-logo" style={{ color: "var(--on-surface)" }}>
            {t("home.logo")}
          </h1>
        </div>

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
    </div>
  );
}
