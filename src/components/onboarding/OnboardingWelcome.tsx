"use client";

import React from 'react';
import { ArrowRight, SkipForward } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export function OnboardingWelcome({ onStart, onSkip }: { onStart: () => void, onSkip: () => void }) {
  const { locale, isAbroad: userAbroad } = useTranslation();
  const isEn = userAbroad || locale === 'en';

  return (
    <div className="flex flex-col items-center justify-center text-center animate-fade-in py-12 px-4 h-full">
      <h1 
        suppressHydrationWarning
        className="text-3xl font-bold text-white mb-4 mt-8"
      >
        {isEn ? "Welcome to DailyM!" : "Aramıza Hoş Geldiniz!"}
      </h1>
      
      <p 
        suppressHydrationWarning
        className="text-body text-[var(--on-surface-variant)] mb-12 max-w-md mx-auto"
      >
        {isEn
          ? "Reaching your health and financial goals is now much easier with Daily Management. Shall we configure your account together to get to know you better?"
          : "Daily Management ile finans ve sağlık hedeflerinize ulaşmak çok daha kolay. Sizi daha iyi tanıyabilmemiz için hesabınızı beraber kuralım mı?"}
      </p>
      
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button 
          type="button"
          onClick={onStart}
          className="w-full py-3.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <span suppressHydrationWarning>{isEn ? "Let's Get Started" : "Hadi Başlayalım"}</span>
          <ArrowRight size={18} />
        </button>
        
        <button 
          type="button"
          onClick={onSkip}
          className="w-full py-3 rounded-xl bg-transparent hover:bg-white/5 text-[var(--on-surface-variant)] hover:text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 cursor-pointer"
        >
          <span suppressHydrationWarning>{isEn ? "Skip for Now (Dashboard)" : "Şimdilik Atla (Dashboard'a Git)"}</span>
          <SkipForward size={16} />
        </button>
      </div>
    </div>
  );
}
