import React from 'react';
import { ArrowRight, SkipForward } from 'lucide-react';

export function OnboardingWelcome({ onStart, onSkip }: { onStart: () => void, onSkip: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center animate-fade-in py-12 px-4 h-full">
      <h1 className="text-3xl font-bold text-white mb-4 mt-8">Aramıza Hoş Geldiniz!</h1>
      
      <p className="text-body text-[var(--on-surface-variant)] mb-12 max-w-md mx-auto">
        Daily Management ile finans ve sağlık hedeflerinize ulaşmak çok daha kolay. Sizi daha iyi tanıyabilmemiz için hesabınızı beraber kuralım mı?
      </p>
      
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button 
          onClick={onStart}
          className="w-full py-3 rounded-xl bg-[var(--inverse-primary)] hover:bg-[var(--inverse-primary-hover)] text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          <span>Hadi Başlayalım</span>
          <ArrowRight size={18} />
        </button>
        
        <button 
          onClick={onSkip}
          className="w-full py-3 rounded-xl bg-transparent hover:bg-white/5 text-[var(--on-surface-variant)] hover:text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 border border-white/10 hover:border-white/20"
        >
          <span>Şimdilik Atla (Dashboard'a Git)</span>
          <SkipForward size={16} />
        </button>
      </div>
    </div>
  );
}
