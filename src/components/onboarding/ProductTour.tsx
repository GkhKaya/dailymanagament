"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, X, Sparkles, CornerDownLeft } from "lucide-react";
import { productTourSteps, type ProductTourMode } from "./product-tour-steps";
import { useTranslation } from "@/hooks/useTranslation";
import { isAbroad } from "@/lib/i18n";

type Highlight = { top: number; left: number; width: number; height: number } | null;

function isElementTrulyVisible(el: HTMLElement): boolean {
  if (!el) return false;

  if (typeof el.checkVisibility === 'function') {
    if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) {
      return false;
    }
  }

  if (typeof window !== 'undefined') {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    // Check all parent elements up to body
    let curr: HTMLElement | null = el.parentElement;
    while (curr && curr !== document.body) {
      const parentStyle = window.getComputedStyle(curr);
      if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
        return false;
      }
      curr = curr.parentElement;
    }
  }

  const rect = el.getBoundingClientRect();
  return rect.width > 4 && rect.height > 4;
}

function findVisibleTarget(target: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const elements = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`));
  if (elements.length === 0) return null;

  // On small screens, prioritize mobile-specific elements (which appear later in the DOM)
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 640 : false;
  const candidates = isMobile ? [...elements].reverse() : elements;

  return candidates.find((el) => isElementTrulyVisible(el)) ?? null;
}

export function ProductTour({ onFinish, onChangeMode }: { onFinish: () => void; onChangeMode: (mode: ProductTourMode) => void }) {
  const { locale, isAbroad: abroadFromHook } = useTranslation();
  const [userAbroad, setUserAbroad] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setUserAbroad(isAbroad());
  }, []);

  const isEn = abroadFromHook || userAbroad || locale === 'en' || isAbroad();
  const [stepIndex, setStepIndex] = useState(0);
  const [highlight, setHighlight] = useState<Highlight>(null);
  const current = productTourSteps[stepIndex];
  const isLast = stepIndex === productTourSteps.length - 1;

  const measureAndApplyHighlight = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const padding = 6;
    setHighlight({
      top: Math.max(4, rect.top - padding),
      left: Math.max(4, rect.left - padding),
      width: Math.min(window.innerWidth - 8, rect.width + padding * 2),
      height: Math.min(window.innerHeight - 8, rect.height + padding * 2)
    });
  }, []);

  const goToTarget = useCallback(() => {
    const element = findVisibleTarget(current.target);
    if (!element) {
      setHighlight(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    const isInView = rect.top >= 50 && rect.bottom <= window.innerHeight - 50 && rect.left >= 0 && rect.right <= window.innerWidth;

    if (!isInView) {
      // Instant snapping instead of sluggish smooth scrolling to prevent drifting
      element.scrollIntoView({ behavior: "auto", block: "center", inline: "nearest" });
    }

    measureAndApplyHighlight(element);
  }, [current.target, measureAndApplyHighlight]);

  const syncOnScrollOrResize = useCallback(() => {
    const element = findVisibleTarget(current.target);
    if (!element) return;
    measureAndApplyHighlight(element);
  }, [current.target, measureAndApplyHighlight]);

  useEffect(() => {
    onChangeMode(current.mode);

    // Instant position + short checks for dynamic tab mount transitions
    goToTarget();
    const timer1 = window.setTimeout(goToTarget, 50);
    const timer2 = window.setTimeout(goToTarget, 160);

    window.addEventListener("resize", syncOnScrollOrResize);
    window.addEventListener("scroll", syncOnScrollOrResize, true);

    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      window.removeEventListener("resize", syncOnScrollOrResize);
      window.removeEventListener("scroll", syncOnScrollOrResize, true);
    };
  }, [current.mode, current.target, onChangeMode, goToTarget, syncOnScrollOrResize]);

  const finish = useCallback(() => {
    localStorage.setItem("dailym-product-tour-completed", "1");
    if (typeof window !== "undefined" && window.location.search.includes("tour=1")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("tour");
      window.history.replaceState({}, "", url.toString());
    }
    onFinish();
  }, [onFinish]);

  const handleNext = useCallback(() => {
    if (isLast) {
      finish();
    } else {
      setStepIndex((idx) => Math.min(productTourSteps.length - 1, idx + 1));
    }
  }, [isLast, finish]);

  const handleBack = useCallback(() => {
    setStepIndex((idx) => Math.max(0, idx - 1));
  }, []);

  // Keyboard navigation: Enter or ArrowRight = Next, ArrowLeft = Back, Escape = Close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleBack();
      } else if (e.key === "Escape") {
        e.preventDefault();
        finish();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handleBack, finish]);

  // Dynamic positioning calculation
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 640 : false;
  const tooltipWidth = isMobile
    ? (typeof window !== 'undefined' ? Math.min(window.innerWidth - 24, 400) : 320)
    : 360;

  let tooltipTop = 100;
  let tooltipLeft = 20;

  if (typeof window !== 'undefined') {
    const cardHeight = cardRef.current?.offsetHeight || 260;
    const windowH = window.innerHeight;
    const windowW = window.innerWidth;

    if (isMobile) {
      tooltipLeft = Math.max(12, (windowW - tooltipWidth) / 2);

      if (highlight) {
        const targetMidY = highlight.top + highlight.height / 2;
        if (targetMidY < windowH / 2) {
          // Target is in upper half of screen, place card near bottom to avoid overlap
          tooltipTop = Math.min(windowH - cardHeight - 16, Math.max(highlight.top + highlight.height + 16, windowH - cardHeight - 20));
        } else {
          // Target is in lower half of screen, place card near top
          tooltipTop = Math.max(16, Math.min(highlight.top - cardHeight - 16, 24));
        }
      } else {
        tooltipTop = Math.max(20, (windowH - cardHeight) / 2);
      }
    } else {
      // Desktop
      if (highlight) {
        const spaceBelow = windowH - (highlight.top + highlight.height);
        const spaceAbove = highlight.top;

        if (spaceBelow < cardHeight + 20 && spaceAbove > spaceBelow) {
          // Place above target
          tooltipTop = Math.max(16, highlight.top - cardHeight - 16);
        } else {
          // Place below target
          tooltipTop = Math.min(windowH - cardHeight - 16, highlight.top + highlight.height + 16);
        }

        tooltipLeft = Math.min(Math.max(16, highlight.left), windowW - tooltipWidth - 16);
      } else {
        tooltipTop = Math.max(24, (windowH - cardHeight) / 2);
        tooltipLeft = Math.max(16, (windowW - tooltipWidth) / 2);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[160]" role="dialog" aria-modal="true" aria-labelledby="product-tour-title">
      {!highlight && <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" />}
      {highlight && (
        <div 
          className="pointer-events-none fixed z-[161] rounded-2xl border-2 border-[var(--primary)] ring-2 ring-[var(--primary)]/30 shadow-[0_0_0_9999px_rgba(0,0,0,0.78)] transition-[top,left,width,height] duration-150 ease-out" 
          style={highlight} 
        />
      )}
      <section 
        ref={cardRef}
        className="fixed z-[162] rounded-3xl border border-[var(--primary)]/30 bg-[#13171d] p-5 shadow-2xl transition-[top,left] duration-150 ease-out max-h-[calc(100vh-32px)] overflow-y-auto" 
        style={{ width: tooltipWidth, top: tooltipTop, left: tooltipLeft }}
      >
        <button 
          type="button" 
          onClick={finish} 
          aria-label={isEn ? "Close tour" : "Tanıtımı kapat"} 
          className="absolute right-3 top-3 flex min-h-9 min-w-9 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
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
          {isEn ? "App Guide" : "Uygulama Rehberi"}
        </p>
        <h2 id="product-tour-title" className="mb-2 text-base sm:text-lg font-bold text-white pr-4">
          {isEn ? (current.titleEn || current.title) : current.title}
        </h2>
        <p className="text-xs sm:text-sm leading-relaxed text-[var(--on-surface-variant)]">
          {isEn ? (current.textEn || current.text) : current.text}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-white/10">
          <button 
            type="button" 
            onClick={handleBack} 
            disabled={stepIndex === 0} 
            className="flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs sm:text-sm font-semibold text-white/60 hover:text-white disabled:invisible cursor-pointer transition-colors"
          >
            <ArrowLeft size={16} /> {isEn ? "Back" : "Geri"}
          </button>
          
          <button 
            type="button" 
            onClick={handleNext} 
            className="flex min-h-10 items-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2 text-xs sm:text-sm font-bold text-black transition-all cursor-pointer shadow-lg shadow-[var(--primary)]/20 active:scale-95"
          >
            <span>{isLast ? (isEn ? "Let's Start" : "Başlayalım") : (isEn ? "Next" : "Devam")}</span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/15 text-black/90 border border-black/10">
              <CornerDownLeft size={10} className="stroke-[2.5]" />
              Enter
            </span>
            {isLast ? <Check size={16} /> : <ArrowRight size={16} />}
          </button>
        </div>
      </section>
    </div>
  );
}
