"use client";

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Share,
  PlusSquare,
  CheckCircle2,
  MoreVertical,
  Download,
  Smartphone,
  Sparkles,
  Zap,
  Bell,
  Check,
  ExternalLink
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { DevicePlatform } from '@/lib/pwa-helpers';

interface PwaInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlatform?: DevicePlatform;
  deferredPrompt?: any;
  onInstallSuccess?: () => void;
}

export function PwaInstallGuideModal({
  isOpen,
  onClose,
  initialPlatform = 'ios',
  deferredPrompt,
  onInstallSuccess,
}: PwaInstallGuideModalProps) {
  const { locale, isAbroad } = useTranslation();
  const isEn = isAbroad || locale === 'en';

  const [activeTab, setActiveTab] = useState<'ios' | 'android'>(
    initialPlatform === 'android' ? 'android' : 'ios'
  );
  const [isTriggeringInstall, setIsTriggeringInstall] = useState(false);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    setIsTriggeringInstall(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        onInstallSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error("Native install error:", err);
    } finally {
      setIsTriggeringInstall(false);
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 backdrop-blur-md bg-black/75 animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col bg-[#12121c] rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-emerald-400 p-[1px] shadow-lg shadow-[var(--primary)]/20">
              <div className="w-full h-full bg-[#12121c] rounded-2xl flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-[var(--primary)]" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                {isEn ? "Install DailyM as App" : "DailyM'i Uygulama Olarak Ekle"}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 font-bold uppercase tracking-wide">
                  PWA
                </span>
              </h2>
              <p className="text-xs text-[var(--on-surface-variant)]">
                {isEn ? "How to install on your mobile home screen" : "Telefonunuzun ana ekranına kurulum rehberi"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? "Close" : "Kapat"}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-4 pb-0 shrink-0">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-white/15 text-white shadow-md border border-white/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-sm">🍎</span>
              <span>Apple (iOS)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-md border border-emerald-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-sm">🤖</span>
              <span>Android (Chrome)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4">
          
          {/* iOS Steps */}
          {activeTab === 'ios' && (
            <div className="flex flex-col gap-3 animate-fade-in">
              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black text-sm shrink-0">
                  1
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white">
                      {isEn ? "Tap the 'Share' Button" : "'Paylaş' Simgesine Dokunun"}
                    </h3>
                    <div className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center gap-1">
                      <Share size={10} />
                      <span>{isEn ? "Share" : "Paylaş"}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    {isEn
                      ? "In Safari, tap the Share icon located at the bottom toolbar (or top right in Chrome for iOS)."
                      : "Safari tarayıcısının en alt çubuğundaki (veya Chrome'da üstteki) kare içinden yukarı ok çıkan Paylaş simgesine dokunun."}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30 flex items-center justify-center font-black text-sm shrink-0">
                  2
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white">
                      {isEn ? "Select 'Add to Home Screen'" : "'Ana Ekrana Ekle' Seçeneğini Seçin"}
                    </h3>
                    <div className="px-1.5 py-0.5 rounded bg-[var(--primary)]/20 text-[var(--primary)] text-[10px] font-bold flex items-center gap-1">
                      <PlusSquare size={10} />
                      <span>{isEn ? "Add to Home" : "Ana Ekrana Ekle"}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    {isEn
                      ? "Scroll down through the share options and tap 'Add to Home Screen'."
                      : "Açılan paylaşım menüsünü biraz aşağı kaydırarak 'Ana Ekrana Ekle' seçeneğine dokunun."}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-sm shrink-0">
                  3
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white">
                      {isEn ? "Tap 'Add' to Finish" : "Sağ Üstten 'Ekle'ye Basın"}
                    </h3>
                    <div className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                      <Check size={10} />
                      <span>{isEn ? "Add" : "Ekle"}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    {isEn
                      ? "Confirm by tapping 'Add' in the top right. DailyM is now ready on your home screen with a native app icon!"
                      : "Sağ üst köşedeki 'Ekle' butonuna basın. DailyM artık telefonunuzun ana ekranında yerel bir uygulama olarak yerini alır!"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Android Steps */}
          {activeTab === 'android' && (
            <div className="flex flex-col gap-3 animate-fade-in">
              {/* Direct 1-Click Install Button if supported */}
              {deferredPrompt && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-400" />
                      {isEn ? "Quick 1-Click Install Supported!" : "Tek Tıkla Doğrudan Kurulum!"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleNativeInstall}
                    disabled={isTriggeringInstall}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <Download size={14} />
                    {isTriggeringInstall
                      ? (isEn ? "Opening Installer..." : "Yükleyici Açılıyor...")
                      : (isEn ? "Install DailyM App Now" : "DailyM'i Şimdi Telefona Yükle")}
                  </button>
                </div>
              )}

              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-sm shrink-0">
                  1
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white">
                      {isEn ? "Open Browser Menu (Three Dots)" : "Tarayıcı Menüsünü Açın (Üç Nokta)"}
                    </h3>
                    <div className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px] font-bold flex items-center gap-0.5">
                      <MoreVertical size={10} />
                    </div>
                  </div>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    {isEn
                      ? "Tap the three vertical dots (⋮) in the top right corner of Chrome or your browser."
                      : "Chrome veya mobil tarayıcınızın sağ üst köşesindeki üç nokta (⋮) simgesine dokunun."}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30 flex items-center justify-center font-black text-sm shrink-0">
                  2
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white">
                      {isEn ? "Tap 'Install App' / 'Add to Home'" : "'Uygulamayı Yükle' veya 'Ana Ekrana Ekle'"}
                    </h3>
                    <div className="px-1.5 py-0.5 rounded bg-[var(--primary)]/20 text-[var(--primary)] text-[10px] font-bold flex items-center gap-1">
                      <Download size={10} />
                      <span>{isEn ? "Install" : "Yükle"}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    {isEn
                      ? "Select 'Install app' or 'Add to Home screen' from the dropdown menu list."
                      : "Açılan menü seçeneklerinden 'Uygulamayı yükle' veya 'Ana ekrana ekle' satırına dokunun."}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black text-sm shrink-0">
                  3
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white">
                      {isEn ? "Confirm and Launch" : "Kurulumu Onaylayın"}
                    </h3>
                    <div className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 size={10} />
                      <span>{isEn ? "Done" : "Tamam"}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    {isEn
                      ? "Confirm by clicking 'Install'. DailyM is instantly installed on your phone without taking space like large app store apps!"
                      : "Gelen onay penceresinde 'Yükle' butonuna basın. DailyM cihazınızda megabaytlarca yer kaplamadan saniyeler içinde kurulur!"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Benefits Feature Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-variant)] flex items-center gap-1">
              <Sparkles size={11} className="text-[var(--primary)]" />
              {isEn ? "Why Add as PWA?" : "Neden Uygulama Olarak Eklemelisiniz?"}
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex flex-col items-center gap-1">
                <Zap size={14} className="text-amber-400" />
                <span className="text-[10px] font-bold text-white/90 leading-tight">
                  {isEn ? "2x Faster Startup" : "2x Hızlı Açılış"}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex flex-col items-center gap-1">
                <Smartphone size={14} className="text-[var(--primary)]" />
                <span className="text-[10px] font-bold text-white/90 leading-tight">
                  {isEn ? "Fullscreen View" : "Tam Ekran Deneyim"}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex flex-col items-center gap-1">
                <Bell size={14} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-white/90 leading-tight">
                  {isEn ? "Push Alerts" : "Anlık Bildirimler"}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/30 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-5 rounded-xl bg-[var(--primary)] hover:brightness-110 text-black font-extrabold text-xs transition-all shadow-md cursor-pointer text-center"
          >
            {isEn ? "Got it! Close" : "Anladım, Kapat"}
          </button>
        </div>

      </div>
    </div>
  );

  return typeof document === 'undefined' ? null : createPortal(modal, document.body);
}
