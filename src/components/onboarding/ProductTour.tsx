"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { productTourSteps, type ProductTourMode } from "./product-tour-steps";

type Highlight = { top: number; left: number; width: number; height: number } | null;

function findVisibleTarget(target: string): HTMLElement | null {
  return [...document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`)]
    .find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }) ?? null;
}

export function ProductTour({ onFinish, onChangeMode }: { onFinish: () => void; onChangeMode: (mode: ProductTourMode) => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [highlight, setHighlight] = useState<Highlight>(null);
  const current = productTourSteps[stepIndex];
  const isLast = stepIndex === productTourSteps.length - 1;

  const updateHighlight = useCallback(() => {
    const element = findVisibleTarget(current.target);
    if (!element) return setHighlight(null);
    element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    const rect = element.getBoundingClientRect();
    const padding = 7;
    setHighlight({ top: Math.max(6, rect.top - padding), left: Math.max(6, rect.left - padding), width: Math.min(window.innerWidth - 12, rect.width + padding * 2), height: Math.min(window.innerHeight - 12, rect.height + padding * 2) });
  }, [current.target]);

  useEffect(() => {
    onChangeMode(current.mode);
    const timer = window.setTimeout(updateHighlight, 160);
    window.addEventListener("resize", updateHighlight);
    window.addEventListener("scroll", updateHighlight, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateHighlight);
      window.removeEventListener("scroll", updateHighlight, true);
    };
  }, [current.mode, onChangeMode, updateHighlight]);

  const finish = () => {
    localStorage.setItem("dailym-product-tour-completed", "1");
    if (typeof window !== "undefined" && window.location.search.includes("tour=1")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("tour");
      window.history.replaceState({}, "", url.toString());
    }
    onFinish();
  };

  const tooltipTop = highlight ? Math.min(window.innerHeight - 245, highlight.top + highlight.height + 14) : Math.max(24, window.innerHeight / 2 - 120);
  const tooltipLeft = highlight ? Math.min(Math.max(16, highlight.left), window.innerWidth - 336) : 16;

  return (
    <div className="fixed inset-0 z-[160]" role="dialog" aria-modal="true" aria-labelledby="product-tour-title">
      {!highlight && <div className="absolute inset-0 bg-black/65" />}
      {highlight && <div className="pointer-events-none fixed z-[161] rounded-2xl border-2 border-[var(--primary)] shadow-[0_0_0_9999px_rgba(0,0,0,0.65),0_0_28px_rgba(142,193,59,0.8)] transition-all duration-200" style={highlight} />}
      <section className="fixed z-[162] w-[min(320px,calc(100vw-32px))] rounded-3xl border border-[var(--primary)]/35 bg-[#11151a] p-5 shadow-2xl" style={{ top: tooltipTop, left: tooltipLeft }}>
        <button type="button" onClick={finish} aria-label="Tanıtımı kapat" className="absolute right-2 top-2 flex min-h-11 min-w-11 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"><X size={18} /></button>
        <div className="mb-5 flex items-center gap-2 pr-10"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${((stepIndex + 1) / productTourSteps.length) * 100}%` }} /></div><span className="text-xs font-bold text-white/50">{stepIndex + 1}/{productTourSteps.length}</span></div>
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">Uygulama rehberi</p>
        <h2 id="product-tour-title" className="mb-2 text-lg font-bold text-white">{current.title}</h2>
        <p className="text-sm leading-6 text-[var(--on-surface-variant)]">{current.text}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button type="button" onClick={() => setStepIndex((index) => Math.max(0, index - 1))} disabled={stepIndex === 0} className="flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-white/60 disabled:invisible"><ArrowLeft size={16} /> Geri</button>
          <button type="button" onClick={isLast ? finish : () => setStepIndex((index) => index + 1)} className="flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-black">{isLast ? "Başlayalım" : "Devam"} {isLast ? <Check size={16} /> : <ArrowRight size={16} />}</button>
        </div>
      </section>
    </div>
  );
}
