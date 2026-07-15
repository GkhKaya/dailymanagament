"use client";

import React, { useState, useEffect } from "react";
import { t } from "@/lib/i18n";
import { Activity, Wallet, LineChart } from "lucide-react";

const slides = [
  {
    icon: <Activity size={32} className="text-[var(--primary)]" />,
    title: "Sağlığınızı Yönetin",
    description: "Günlük kalori, uyku düzeni ve egzersizlerinizi zahmetsizce kaydedip takip edin.",
  },
  {
    icon: <Wallet size={32} className="text-[var(--primary)]" />,
    title: "Finansal Özgürlük",
    description: "Gelir, gider ve aboneliklerinizi tek bir merkezden yöneterek geleceğinizi planlayın.",
  },
  {
    icon: <LineChart size={32} className="text-[var(--primary)]" />,
    title: "Gelişmiş Analizler",
    description: "Verilerinizi detaylı ve modern grafiklerle inceleyip, hedeflerinize daha hızlı ulaşın.",
  }
];

export function HeroPanel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Timer: reset whenever currentSlide changes (fixes the jump issue)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [currentSlide]);

  return (
    <div className="hidden md:flex flex-col justify-between flex-1 px-[var(--space-8)] py-[var(--space-8)] relative overflow-hidden">
      
      {/* Background Graphic Effect (Optional faint neon glow) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary)] rounded-full blur-[120px] opacity-[0.03] pointer-events-none -z-10"></div>

      {/* Logo — top */}
      <h1 className="text-logo text-[var(--primary)] animate-slide-up z-10">
        {t("home.logo")}
      </h1>

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
              <h2 className="text-hero text-white mb-[var(--space-2)] text-[32px] leading-tight">
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
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === currentSlide ? 'w-8 bg-[var(--primary)]' : 'w-2 bg-[var(--outline)] hover:bg-[var(--on-surface-variant)]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Hero text — Bottom (Original Text) */}
      <div style={{ maxWidth: 420 }} className="z-10">
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
