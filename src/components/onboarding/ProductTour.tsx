"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, X, Sparkles } from "lucide-react";
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
    if (!element) {
      setHighlight(null);
      return;
    }
    element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    const rect = element.getBoundingClientRect();
    const padding = 7;
    setHighlight({
      top: Math.max(6, rect.top - padding),
      left: Math.max(6, rect.left - padding),
      width: Math.min(window.innerWidth - 12, rect.width + padding * 2),
      height: Math.min(window.innerHeight - 12, rect.height + padding * 2)
    });
  }, [current.target]);

  useEffect(() => {
    onChangeMode(current.mode);

    // Staggered attempts to ensure dynamic components and animations are fully mounted
    const timer1 = window.setTimeout(updateHighlight, 120);
    const timer2 = window.setTimeout(updateHighlight, 320);

    window.addEventListener("resize", updateHighlight);
    window.addEventListener("scroll", updateHighlight, true);

    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      window.removeEventListener("resize", updateHighlight);
      window.removeEventListener("scroll", updateHighlight, true);
    };
  }, [current.mode, current.target, onChangeMode, updateHighlight]);

  const finish = () => {
    localStorage.setItem("dailym-product-tour-completed", "1");
    if (typeof window !== "undefined" && window.location.search.includes("tour=1")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("tour");
      window.history.replaceState({}, "", url.toString());
    }
    onFinish();
  };

  // Smart Tooltip positioning: Place above target if target is in lower half of screen
  const tooltipWidth = typeof window !== 'undefined' ? Math.min(340, window.innerWidth - 32) : 320;
  const tooltipHeightApprox = 230;

  let tooltipTop = 100;
  let tooltipLeft = 20;

  if (typeof window !== 'undefined') {
    if (highlight) {
      const spaceBelow = window.innerHeight - (highlight.top + highlight.height);
      const spaceAbove = highlight.top;

      if (spaceBelow < tooltipHeightApprox && spaceAbove > spaceBelow) {
        // Place above target
        tooltipTop = Math.max(16, highlight.top - tooltipHeightApprox - 10);
      } else {
        // Place below target
        tooltipTop = Math.min(window.innerHeight - tooltipHeightApprox - 16, highlight.top + highlight.height + 12);
      }

      tooltipLeft = Math.min(Math.max(16, highlight.left), window.innerWidth - tooltipWidth - 16);
    } else {
      // Center modal
      tooltipTop = Math.max(24, window.innerHeight / 2 - 120);
      tooltipLeft = Math.max(16, (window.innerWidth - tooltipWidth) / 2);
    }
  }

  return (
    <div className="fixed inset-0 z-[160]" role="dialog" aria-modal="true" aria-labelledby="product-tour-title">
      {!highlight && <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />}
      {highlight && (
        <div 
          className="pointer-events-none fixed z-[161] rounded-2xl border-2 border-[var(--primary)] shadow-[0_0_0_9999px_rgba(0,0,0,0.70),0_0_30px_rgba(142,193,59,0.85)] transition-all duration-200" 
          style={highlight} 
        />
      )}
      <section 
        className="fixed z-[162] rounded-3xl border border-[var(--primary)]/40 bg-[#11151a] p-5 shadow-2xl transition-all duration-200" 
        style={{ width: tooltipWidth, top: tooltipTop, left: tooltipLeft }}
      >
        <button 
          type="button" 
          onClick={finish} 
          aria-label="Tanıtımı kapat" 
          className="absolute right-2 top-2 flex min-h-11 min-w-11 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="mb-4 flex items-center gap-2 pr-10">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div 
              className="h-full rounded-full bg-[var(--primary)] transition-all duration-300" 
              style={{ width: `${((stepIndex + 1) / productTourSteps.length) * 100}%` }} 
            />
          </div>
          <span className="text-xs font-bold text-white/60 shrink-0">
            {stepIndex + 1}/{productTourSteps.length}
          </span>
        </div>

        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--primary)] flex items-center gap-1.5">
          <Sparkles size={13} />
          Uygulama Rehberi
        </p>
        <h2 id="product-tour-title" className="mb-2 text-base sm:text-lg font-bold text-white">
          {current.title}
        </h2>
        <p className="text-xs sm:text-sm leading-relaxed text-[var(--on-surface-variant)]">
          {current.text}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 pt-2 border-t border-white/5">
          <button 
            type="button" 
            onClick={() => setStepIndex((index) => Math.max(0, index - 1))} 
            disabled={stepIndex === 0} 
            className="flex min-h-10 items-center gap-1 rounded-xl px-2 text-xs sm:text-sm font-semibold text-white/60 hover:text-white disabled:invisible cursor-pointer"
          >
            <ArrowLeft size={16} /> Geri
          </button>
          <button 
            type="button" 
            onClick={isLast ? finish : () => setStepIndex((index) => index + 1)} 
            className="flex min-h-10 items-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 text-xs sm:text-sm font-bold text-black transition-colors cursor-pointer"
          >
            {isLast ? "Başlayalım" : "Devam"} {isLast ? <Check size={16} /> : <ArrowRight size={16} />}
          </button>
        </div>
      </section>
    </div>
  );
}
