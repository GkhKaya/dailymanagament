"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Activity, Wallet, LineChart } from "lucide-react";

export function HeroPanel() {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: <Activity size={32} className="text-[var(--primary)]" />,
      title: t("home.slides.healthTitle"),
      description: t("home.slides.healthDesc"),
    },
    {
      icon: <Wallet size={32} className="text-[var(--primary)]" />,
      title: t("home.slides.financeTitle"),
      description: t("home.slides.financeDesc"),
    },
    {
      icon: <LineChart size={32} className="text-[var(--primary)]" />,
      title: t("home.slides.analyticsTitle"),
      description: t("home.slides.analyticsDesc"),
    }
  ];

  // Timer: reset whenever currentSlide changes (fixes the jump issue)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [currentSlide, slides.length]);

  return (
    <section aria-label="DailyM Hero" className="hidden md:flex flex-col justify-between flex-1 px-[var(--space-8)] py-[var(--space-8)] relative overflow-hidden">
      
      {/* Logo — top */}
      <div className="flex items-center gap-3 animate-slide-up z-10">
        <img src="/assets/logo.svg" alt="DailyM - Kişisel Yönetim Asistanı" className="h-10 w-auto object-contain" width={40} height={40} style={{ maxHeight: "40px" }} />
        <span className="text-logo text-[var(--primary)] font-semibold">
          {t("home.logo")}
        </span>
      </div>

      {/* Carousel Area — Middle */}
      <div className="flex-1 flex flex-col justify-center z-10 mt-[var(--space-6)] mb-[var(--space-6)]">
        <div className="max-w-[420px] relative grid">
          {slides.map((slide, index) => (
            <div 
              key={index}
              className={`col-start-1 row-start-1 flex flex-col justify-center transition-all duration-700 ease-in-out pb-8 ${
                index === currentSlide ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 translate-y-4 pointer-events-none z-0'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-[var(--surface-container)] border border-[var(--outline)] flex items-center justify-center mb-[var(--space-4)] shadow-lg shadow-black/50">
                {slide.icon}
              </div>
              <h2 className="text-hero text-white mb-[var(--space-2)] text-[32px] leading-tight font-bold">
                {slide.title}
              </h2>
              <p className="text-body text-[var(--on-surface-variant)] text-lg leading-relaxed">
                {slide.description}
              </p>
            </div>
          ))}

          {/* Indicators */}
          <div className="absolute bottom-0 left-0 flex items-center gap-[var(--space-2)] z-20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === currentSlide ? 'w-8 bg-[var(--primary)]' : 'w-2 bg-[var(--outline)] hover:bg-[var(--on-surface-variant)]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Hero text — Bottom (Original Text as H1) */}
      <div style={{ maxWidth: 420 }} className="z-10">
        <h1
          className="text-headline animate-slide-up anim-delay-100"
          style={{ color: "var(--on-surface)", marginBottom: 14 }}
        >
          {t("home.heroTitle")}
        </h1>
        <p className="text-body animate-slide-up anim-delay-200" style={{ color: "var(--on-surface-variant)" }}>
          {t("home.heroSubtitle")}
        </p>
      </div>
    </section>
  );
}
