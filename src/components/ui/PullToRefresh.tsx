"use client";

import React, { useState, useRef, useEffect, ReactNode } from "react";
import { ArrowDown, RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  disabled?: boolean;
}

const THRESHOLD = 70; // Pull distance to trigger refresh (in px)
const MAX_PULL = 110;

export function PullToRefresh({ onRefresh, children, disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canTrigger, setCanTrigger] = useState(false);

  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pull-to-refresh if page is scrolled at the top
      if (window.scrollY <= 2 && e.touches.length === 1) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      } else {
        isPullingRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshing || e.touches.length !== 1) return;

      const currentY = e.touches[0].clientY;
      const diffY = currentY - startYRef.current;

      // Only respond to downward pulls when at top of page
      if (diffY > 0 && window.scrollY <= 2) {
        // Damping formula for smooth elastic feel
        const distance = Math.min(MAX_PULL, Math.pow(diffY, 0.85) * 1.5);
        setPullDistance(distance);
        
        if (distance >= THRESHOLD && !canTrigger) {
          setCanTrigger(true);
          if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(12);
          }
        } else if (distance < THRESHOLD && canTrigger) {
          setCanTrigger(false);
        }

        // Prevent native overscroll when pulling down at top
        if (e.cancelable && diffY > 10) {
          e.preventDefault();
        }
      } else {
        setPullDistance(0);
        setCanTrigger(false);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;

      if (canTrigger && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(THRESHOLD); // Hold position while refreshing

        try {
          await onRefresh();
        } catch (err) {
          console.error("Pull to refresh error:", err);
        } finally {
          setIsRefreshing(false);
          setCanTrigger(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
        setCanTrigger(false);
      }
    };

    const targetNode = containerRef.current || window;

    targetNode.addEventListener("touchstart", handleTouchStart as any, { passive: true });
    targetNode.addEventListener("touchmove", handleTouchMove as any, { passive: false });
    targetNode.addEventListener("touchend", handleTouchEnd as any, { passive: true });

    return () => {
      targetNode.removeEventListener("touchstart", handleTouchStart as any);
      targetNode.removeEventListener("touchmove", handleTouchMove as any);
      targetNode.removeEventListener("touchend", handleTouchEnd as any);
    };
  }, [disabled, isRefreshing, canTrigger, onRefresh]);

  const progress = Math.min(1, pullDistance / THRESHOLD);
  const rotationAngle = Math.min(180, progress * 180);

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* Pull Indicator Container */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none transition-transform duration-200"
        style={{
          transform: `translateY(${isRefreshing ? 16 : pullDistance > 0 ? pullDistance * 0.7 - 40 : -50}px)`,
          opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
        }}
      >
        <div
          className={`flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-xl border shadow-2xl transition-all ${
            canTrigger || isRefreshing
              ? "bg-[#1A1A26]/90 border-[var(--primary)]/50 text-[var(--primary)] shadow-[var(--primary)]/20"
              : "bg-[#14141F]/80 border-white/10 text-white/70"
          }`}
        >
          <div className="relative flex items-center justify-center w-5 h-5">
            {isRefreshing ? (
              <RefreshCw size={16} className="animate-spin text-[var(--primary)]" />
            ) : (
              <ArrowDown
                size={16}
                style={{
                  transform: `rotate(${canTrigger ? 180 : rotationAngle}deg)`,
                  transition: "transform 0.15s ease-out",
                }}
              />
            )}
          </div>
          <span className="text-xs font-semibold tracking-wide">
            {isRefreshing
              ? "Yenileniyor..."
              : canTrigger
              ? "Bırakın ve Yenileyin"
              : "Yenilemek için Çekin"}
          </span>
        </div>
      </div>

      {/* Main Content with subtle push down effect */}
      <div
        style={{
          transform: pullDistance > 0 && !isRefreshing ? `translateY(${pullDistance * 0.3}px)` : "none",
          transition: isPullingRef.current ? "none" : "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
