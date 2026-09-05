"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Download, Smartphone, Sparkles, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  getDeviceInfo,
  isPwaStandalone,
  isPwaPromptDismissed,
  dismissPwaPrompt,
  DeviceInfo
} from '@/lib/pwa-helpers';
import { PwaInstallGuideModal } from './PwaInstallGuideModal';

export function PwaInstallBanner() {
  const { locale, isAbroad } = useTranslation();
  const isEn = isAbroad || locale === 'en';

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    // Register service worker for PWA support
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // 1. Standalone check: If already running as PWA, do not show anything!
    if (isPwaStandalone()) {
      return;
    }

    const info = getDeviceInfo();
    setDeviceInfo(info);

    // 2. Only show on mobile devices (telefondan açtıysa)
    if (!info.isMobile) {
      return;
    }

    // 3. Check if recently dismissed
    if (isPwaPromptDismissed()) {
      return;
    }

    // 4. Capture native Android beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      dismissPwaPrompt(1);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 5. Gentle delay so page finishes loading smoothly before banner pops up
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 600);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isVisible || !deviceInfo) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    dismissPwaPrompt(1); // Dismiss for 1 day
  };

  const handleActionClick = async () => {
    if (deviceInfo.isAndroid && deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsVisible(false);
          dismissPwaPrompt(365);
        }
      } catch {
        setIsGuideOpen(true);
      }
    } else {
      // iOS or Android without direct prompt
      setIsGuideOpen(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm z-[110] animate-slide-up">
        <div className="relative bg-[#141420]/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-3.5 sm:p-4 shadow-[0_15px_40px_rgba(0,0,0,0.7)] flex flex-col gap-3">
          
          {/* Top Row */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-emerald-400 p-[1.5px] shrink-0 shadow-md">
              <div className="w-full h-full bg-[#12121c] rounded-2xl flex items-center justify-center overflow-hidden">
                <Image
                  src="/assets/logo.png"
                  alt="DailyM Logo"
                  width={36}
                  height={36}
                  className="rounded-xl object-cover"
                />
              </div>
            </div>

            {/* Texts */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black text-white truncate">
                  {isEn ? "Install DailyM App" : "DailyM'i Telefona Yükle"}
                </h4>
                <span className="text-[9px] px-1.5 py-0.2 font-bold rounded-md bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30 shrink-0">
                  {deviceInfo.isIos ? "iOS" : "Android"}
                </span>
              </div>
              <p className="text-[11px] text-[var(--on-surface-variant)] leading-snug line-clamp-1">
                {isEn
                  ? "Add to Home Screen for faster native app experience."
                  : "Tam ekran ve hızlı erişim için ana ekrana ekleyin."}
              </p>
            </div>

            {/* Dismiss X */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label={isEn ? "Dismiss" : "Kapat"}
              className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="py-2 px-3 rounded-xl border border-white/10 hover:bg-white/5 text-white/80 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Smartphone size={13} className="text-[var(--primary)]" />
              <span>{isEn ? "How to Add" : "Nasıl Eklenir?"}</span>
            </button>

            <button
              type="button"
              onClick={handleActionClick}
              className="py-2 px-3 rounded-xl bg-[var(--primary)] hover:brightness-110 text-black text-xs font-black transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {deviceInfo.isAndroid && deferredPrompt ? (
                <>
                  <Download size={13} />
                  <span>{isEn ? "Install" : "Yükle"}</span>
                </>
              ) : (
                <>
                  <span>{isEn ? "View Guide" : "Rehberi Aç"}</span>
                  <ChevronRight size={13} />
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Interactive Guide Modal */}
      <PwaInstallGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        initialPlatform={deviceInfo.platform}
        deferredPrompt={deferredPrompt}
        onInstallSuccess={() => setIsVisible(false)}
      />
    </>
  );
}
