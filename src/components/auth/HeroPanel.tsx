import React from "react";
import { t } from "@/lib/i18n";

export function HeroPanel() {
  return (
    <div className="hidden md:flex flex-col justify-between flex-1 px-16 py-14">
      {/* Logo — top */}
      <h1 className="text-logo animate-slide-up" style={{ color: "var(--on-surface)" }}>
        {t("home.logo")}
      </h1>

      {/* Hero text — bottom */}
      <div style={{ maxWidth: 420 }}>
        <h2
          className="text-headline animate-slide-up anim-delay-100"
          style={{ color: "var(--on-surface)", marginBottom: 14 }}
        >
          {t("home.heroTitle")}
        </h2>
        <p className="text-body animate-slide-up anim-delay-200" style={{ color: "var(--on-surface-variant)" }}>
          {t("home.heroSubtitle")}
        </p>
      </div>
    </div>
  );
}
