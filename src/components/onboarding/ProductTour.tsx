"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";

const steps = [
  { title: "DailyM'ye hoş geldin", text: "Bu kısa turda uygulamadaki temel alanları ve butonların ne işe yaradığını göstereceğim.", label: "Başlangıç" },
  { title: "Genel bakış", text: "Sağlık ve finans durumunu tek ekranda hızlıca görürsün. Günlük özet burada toplanır.", label: "Genel" },
  { title: "Sağlık", text: "Öğünlerini, kalorilerini, egzersizlerini ve günlük hedeflerini buradan takip edersin.", label: "Sağlık" },
  { title: "Cüzdan", text: "Gelir, gider, hesap, borç ve aboneliklerini yönetmek için Cüzdan bölümünü kullan.", label: "Cüzdan" },
  { title: "Borsa", text: "Hisse ve fon alış-satışlarını, açık portföyünü ve gerçekleşen kâr/zararını burada takip edersin.", label: "Borsa" },
  { title: "Profil", text: "Profil ve ayarlar butonundan kişisel bilgilerini, namaz bildirimlerini ve uygulama ayarlarını yönetebilirsin.", label: "Profil" },
  { title: "Hızlı ekleme", text: "Sağ alttaki + butonu; öğün, egzersiz, gelir ve gider eklemek için hızlı menüyü açar.", label: "Hızlı işlem" },
  { title: "Hazırsın", text: "Artık DailyM'yi kullanmaya başlayabilirsin. İstediğin zaman bölümler arasında geçiş yapabilirsin.", label: "Tamamlandı" },
];

export function ProductTour({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const finish = () => {
    localStorage.setItem("dailym-product-tour-completed", "1");
    onFinish();
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="product-tour-title">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[var(--primary)]/30 bg-[#11151a] p-6 shadow-[0_0_60px_rgba(142,193,59,0.18)]">
        <button type="button" onClick={finish} aria-label="Tanıtımı kapat" className="absolute right-3 top-3 flex min-h-11 min-w-11 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"><X size={18} /></button>
        <div className="mb-7 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
          <span className="text-xs font-bold text-white/50">{step + 1}/{steps.length}</span>
        </div>
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/15 text-3xl font-black text-[var(--primary)]">{isLast ? <Check size={32} /> : step + 1}</div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">{current.label}</p>
        <h2 id="product-tour-title" className="mb-3 text-2xl font-bold text-white">{current.title}</h2>
        <p className="min-h-20 text-sm leading-6 text-[var(--on-surface-variant)]">{current.text}</p>
        <div className="mt-7 flex items-center justify-between gap-3">
          <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:invisible"><ArrowLeft size={16} /> Geri</button>
          <button type="button" onClick={isLast ? finish : () => setStep((value) => value + 1)} className="flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-bold text-black transition-colors hover:bg-[var(--primary-hover)]">{isLast ? "Başlayalım" : "Sonraki"} {!isLast && <ArrowRight size={16} />}</button>
        </div>
      </div>
    </div>
  );
}
