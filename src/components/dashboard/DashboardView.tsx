"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Flame, ArrowRight } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { useTranslation } from "@/hooks/useTranslation";
import { useDashboardViewModel } from "@/viewmodels/useDashboardViewModel";
import dynamic from 'next/dynamic';
import { GoogleTranslateWidget } from "@/components/ui/GoogleTranslateWidget";
import { ResidenceOnboardingModal } from "@/components/onboarding/ResidenceOnboardingModal";
import { HealthSection } from "@/components/dashboard/HealthSection";
import { FinanceSection } from "@/components/dashboard/FinanceSection";
import { FABMenu } from "@/components/dashboard/FABMenu";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { VoiceAssistantFAB } from '@/components/assistant/VoiceAssistantFAB';
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { ProductTour } from "@/components/onboarding/ProductTour";

// Performans optimizasyonu: Ağır formları ve analiz sayfalarını sadece ihtiyaç anında (tıklandığında) yüklenecek şekilde (Lazy Load) ayırıyoruz.
const HealthAnalysis = dynamic(() => import("@/components/dashboard/HealthAnalysis").then(m => m.HealthAnalysis), { ssr: false });
const FinanceAnalysis = dynamic(() => import("@/components/dashboard/FinanceAnalysis").then(m => m.FinanceAnalysis), { ssr: false });
const StocksAnalysis = dynamic(() => import("@/components/dashboard/StocksAnalysis").then(m => m.StocksAnalysis), { ssr: false });
const StocksSection = dynamic(() => import("@/components/dashboard/StocksSection").then(m => m.StocksSection), { ssr: false });

import { DashboardSheetManager } from "@/components/dashboard/DashboardSheetManager";

export function DashboardView() {
  const router = useRouter();
  const { mode, setMode, currentDate, handlePrevDay, handleNextDay, handleAddBmr, healthData, financeData, isLoadingHealth, isLoadingFinance, refreshData } = useDashboardViewModel();
  const { t, locale, isAbroad: userAbroad } = useTranslation();
  const isEn = userAbroad || locale === 'en';
  
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [sheetPayload, setSheetPayload] = useState<any>(null);
  const [showProductTour, setShowProductTour] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tour") === "1") {
        setShowProductTour(true);
        return;
      }
      setShowProductTour(localStorage.getItem("dailym-product-tour-completed") !== "1");
    }
  }, []);

  React.useEffect(() => {
    switch (mode) {
      case 'overview':
        document.title = isEn ? "Overview | DailyM" : "Gösterge Paneli | DailyM";
        break;
      case 'health':
        document.title = isEn ? "Nutrition | DailyM" : "Beslenme | DailyM";
        break;
      case 'finance':
        document.title = isEn ? "Wallet | DailyM" : "Cüzdan | DailyM";
        break;
      case 'stocks':
        document.title = isEn ? "Stocks & Portfolio | DailyM" : "Borsa & Portföy | DailyM";
        break;
      case 'health-analysis':
        document.title = isEn ? "Nutrition Analysis | DailyM" : "Sağlık Analizi | DailyM";
        break;
      case 'finance-analysis':
        document.title = isEn ? "Finance Analysis | DailyM" : "Finans Analizi | DailyM";
        break;
      case 'stocks-analysis':
        document.title = isEn ? "Stocks Analysis | DailyM" : "Borsa Analizi | DailyM";
        break;
    }
  }, [mode, isEn]);

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dailym-product-tour-completed');
      localStorage.removeItem('dailym-residence-completed');
      localStorage.removeItem('dailym-is-abroad');
      localStorage.removeItem('dailym-country');
      localStorage.removeItem('dailym-lang');
      document.cookie = 'IS_ABROAD=0; path=/; max-age=0';
      document.cookie = 'USER_COUNTRY=; path=/; max-age=0';
      document.cookie = 'NEXT_LOCALE=; path=/; max-age=0';
    }
    await logoutAction();
    router.push('/');
  };

  const handleSuccess = () => {
    setActiveSheet(null);
    setSheetPayload(null);
    refreshData();
  };

  const handleOpenSheet = (sheetName: string, payload?: unknown) => {
    setSheetPayload(payload || null);
    setActiveSheet(sheetName);
  };

  const handlePullRefresh = async () => {
    await refreshData();
    router.refresh();
  };

  return (
    <PullToRefresh onRefresh={handlePullRefresh}>
      <div className="min-h-screen bg-[var(--background)] text-[var(--on-surface)] flex flex-col font-sans relative selection:bg-[var(--primary)] selection:text-black">
        <a className="skip-link" href="#main-content">{isEn ? "Skip to main content" : "Ana içeriğe geç"}</a>
        {/* ── Top App Bar / Header ── */}
        <header className="w-full px-4 sm:px-[var(--space-6)] py-3 sm:py-[var(--space-4)] border-b border-[rgba(255,255,255,0)] bg-transparent backdrop-blur-xl sticky top-0 z-30">
          <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-[var(--space-6)]">
              {/* Logo & Brand */}
              <button type="button" aria-label={isEn ? "Go to overview" : "Genel bakışa git"} className="flex items-center gap-2.5 cursor-pointer" onClick={() => setMode('overview')}>
                <img src="/assets/logo.svg" alt="DailyM" className="h-8 w-auto object-contain" width={32} height={32} style={{ maxHeight: "32px" }} />
                <span className="text-xl font-bold tracking-tight text-white">Daily<span className="text-[var(--primary)]">M</span></span>
              </button>
              <nav className="hidden sm:flex items-center gap-[var(--space-4)]">
                <button
                  data-tour="nav-overview"
                  onClick={() => setMode('overview')}
                  className={`text-body font-medium transition-colors cursor-pointer ${
                    mode === 'overview' ? 'text-[var(--primary)] border-b-2 border-[var(--primary)] pb-1 font-bold' : 'text-[var(--on-surface-variant)] hover:text-white pb-1'
                  }`}
                >
                  {t("dashboard.tabOverview")}
                </button>
                <button
                  data-tour="nav-health"
                  onClick={() => setMode('health')}
                  className={`text-body font-medium transition-colors cursor-pointer ${
                    mode === 'health' ? 'text-[var(--primary)] border-b-2 border-[var(--primary)] pb-1 font-bold' : 'text-[var(--on-surface-variant)] hover:text-white pb-1'
                  }`}
                >
                  {t("dashboard.tabHealth")}
                </button>
                <button
                  data-tour="nav-finance"
                  onClick={() => setMode('finance')}
                  className={`text-body font-medium transition-colors cursor-pointer ${
                    mode === 'finance' ? 'text-[var(--primary)] border-b-2 border-[var(--primary)] pb-1 font-bold' : 'text-[var(--on-surface-variant)] hover:text-white pb-1'
                  }`}
                >
                  {t("dashboard.tabFinance")}
                </button>
                <button
                  data-tour="nav-stocks"
                  onClick={() => setMode('stocks')}
                  className={`text-body font-medium transition-colors cursor-pointer ${
                    mode === 'stocks' ? 'text-[var(--primary)] border-b-2 border-[var(--primary)] pb-1 font-bold' : 'text-[var(--on-surface-variant)] hover:text-white pb-1'
                  }`}
                >
                  {t("dashboard.tabStocks")}
                </button>
              </nav>
            </div>

            {/* Action icons (Notifications, Settings, Profile) */}
            <div className="flex items-center gap-[var(--space-3)]">
              <GoogleTranslateWidget />
              <button 
                data-tour="profile"
                onClick={() => router.push('/profile')}
                aria-label={isEn ? "Profile and settings" : "Profil ve ayarlar"}
                className="min-h-11 min-w-11 rounded bg-[var(--outline)] flex items-center justify-center hover:bg-[var(--primary)] hover:text-white transition-colors"
              >
                <User size={16} />
              </button>
              <button 
                onClick={handleLogout}
                aria-label={isEn ? "Log out" : "Oturumu kapat"}
                className="min-h-11 min-w-11 rounded bg-[var(--outline)] flex items-center justify-center text-[var(--on-surface-variant)] hover:bg-red-500 hover:text-white transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Mode Switcher (shows below header on small screens) */}
        <div className="w-full px-4 pb-4 sm:hidden flex justify-center relative z-10">
          {mode !== 'health-analysis' && mode !== 'finance-analysis' && (
            <div className="grid grid-cols-4 gap-1 w-full bg-[rgba(255,255,255,0.03)] backdrop-blur-lg p-1 rounded-[var(--radius-btn)] border border-[rgba(255,255,255,0.05)]">
              <button
                data-tour="nav-overview"
                aria-pressed={mode === 'overview'}
                onClick={() => setMode('overview')}
                className={`py-2 text-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  mode === 'overview' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--on-surface-variant)] hover:text-white'
                }`}
              >
                {t("dashboard.tabOverview")}
              </button>
              <button
                data-tour="nav-health"
                aria-pressed={mode === 'health'}
                onClick={() => setMode('health')}
                className={`py-2 text-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  mode === 'health' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--on-surface-variant)] hover:text-white'
                }`}
              >
                {t("dashboard.tabHealth")}
              </button>
              <button
                data-tour="nav-finance"
                aria-pressed={mode === 'finance'}
                onClick={() => setMode('finance')}
                className={`py-2 text-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  mode === 'finance' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--on-surface-variant)] hover:text-white'
                }`}
              >
                {t("dashboard.tabFinance")}
              </button>
              <button
                data-tour="nav-stocks"
                aria-pressed={mode === 'stocks'}
                onClick={() => setMode('stocks')}
                className={`py-2 text-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  mode === 'stocks' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--on-surface-variant)] hover:text-white'
                }`}
              >
                {t("dashboard.tabStocks")}
              </button>
            </div>
          )}
        </div>

        {/* ── Main Content Area ── */}
        <main id="main-content" className="w-full px-4 pt-8 sm:px-[var(--space-6)] sm:pt-10 pb-[var(--space-10)] relative z-0" tabIndex={-1}>
          <h1 className="sr-only">{isEn ? "DailyM Personal Dashboard" : "DailyM kişisel yönetim paneli"}</h1>

          {/* ── BMR & Health Profile Missing Warning Banner ── */}
          {(mode === 'overview' || mode === 'health') && !isLoadingHealth && healthData && (!healthData.hasHealthProfile || !healthData.isBmrCalculable || (healthData.currentWeight || 0) <= 0) && (
            <div 
              onClick={() => router.push('/onboarding?step=health')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push('/onboarding?step=health'); }}
              className="w-full max-w-[1600px] mx-auto mb-6 sm:mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 hover:border-amber-500/50 shadow-lg shadow-amber-950/20 backdrop-blur-md transition-all duration-300 cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in"
            >
              <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 group-hover:bg-amber-500/25 transition-all">
                  <Flame className="w-5 h-5 animate-pulse text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-base tracking-wide">
                      {isEn ? "We Cannot Calculate Your BMR Right Now" : "Şu An BMR'ınızı Hesaplayamıyoruz"}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {isEn ? "Missing Info" : "Eksik Bilgi"}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--on-surface-variant)] mt-1">
                    {isEn 
                      ? "Your weight, height, or age information have not been completed. Complete your physical details to calculate your daily basal metabolic rate (BMR) and burned calories."
                      : "Kilo, boy veya yaş bilgileriniz henüz tamamlanmamış. Günlük bazal metabolizma hızınızı (BMR) ve yakılan kaloriyi hesaplayabilmemiz için bilgilerinizi tamamlayın."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 group-hover:text-amber-200 shrink-0 self-end sm:self-center px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 group-hover:bg-amber-500/25 transition-all shadow-sm">
                <span>{isEn ? "Complete Health Info" : "Bilgileri Tamamla"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

          {mode === 'overview' && (
            <div className="flex flex-col xl:flex-row gap-[var(--space-8)] w-full max-w-[1600px] mx-auto animate-fade-in">
              {/* Split Screen for Overview */}
              <div className="flex-1 relative">
                {isLoadingHealth || !healthData ? <LoadingSpinner /> : <HealthSection data={healthData} isOverview={true} onOpenSheet={handleOpenSheet} onAddBmr={handleAddBmr} onRefresh={refreshData} />}
              </div>
              <div className="flex-1 relative">
                {isLoadingFinance || !financeData ? <LoadingSpinner /> : <FinanceSection data={financeData} isOverview={true} onOpenSheet={handleOpenSheet} currentDate={currentDate} />}
              </div>
            </div>
          )}

          {mode === 'health' && (
            isLoadingHealth || !healthData ? <LoadingSpinner /> : (
              <HealthSection 
                data={healthData} 
                isOverview={false} 
                currentDate={currentDate} 
                onPrevDay={handlePrevDay} 
                onNextDay={handleNextDay} 
                onShowAnalysis={() => setMode('health-analysis')}
                onOpenSheet={handleOpenSheet}
                onAddBmr={handleAddBmr}
                onRefresh={refreshData}
              />
            )
          )}

          {mode === 'finance' && (
            isLoadingFinance || !financeData ? <LoadingSpinner /> : (
              <FinanceSection 
                data={financeData} 
                isOverview={false} 
                onOpenSheet={handleOpenSheet} 
                onShowAnalysis={() => setMode('finance-analysis')} 
                currentDate={currentDate}
              />
            )
          )}

          {mode === 'stocks' && (
            <StocksSection onShowAnalysis={() => setMode('stocks-analysis')} />
          )}

          {mode === 'stocks-analysis' && (
            <StocksAnalysis onBack={() => setMode('stocks')} />
          )}

          {mode === 'health-analysis' && (
            <HealthAnalysis onBack={() => setMode('health')} />
          )}

          {mode === 'finance-analysis' && (
            <FinanceAnalysis onBack={() => setMode('finance')} />
          )}
        </main>
        
        {/* ── Footer ── */}
        <footer className="w-full py-6 flex items-center justify-center text-sm text-[var(--on-surface-variant)] mt-auto border-t border-[rgba(255,255,255,0.05)]">
          <p>
            Created by{' '}
            <a href="https://devosuit.com" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-400 font-semibold transition-colors">
              devosuit
            </a>
          </p>
        </footer>

        {/* ── FAB Menu ── */}
        {mode !== 'health-analysis' && mode !== 'finance-analysis' && mode !== 'stocks-analysis' && (
          <FABMenu mode={mode} onOpenSheet={handleOpenSheet} />
        )}

        {(() => {
          const localDateStr = new Date(currentDate.getTime() - currentDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
          return (
            <>
              <DashboardSheetManager 
                activeSheet={activeSheet} 
                sheetPayload={sheetPayload} 
                setActiveSheet={setActiveSheet} 
                setSheetPayload={setSheetPayload} 
                handleSuccess={handleSuccess} 
                refreshData={refreshData} 
                financeData={financeData} 
                healthData={healthData} 
                currentDate={currentDate} 
              />
              <VoiceAssistantFAB onSuccess={refreshData} currentDate={localDateStr} />
            </>
          );
        })()}
        {showProductTour && <ProductTour onFinish={() => setShowProductTour(false)} onChangeMode={setMode} />}
        
        {/* ── Residence & Language Onboarding Modal ── */}
        <ResidenceOnboardingModal onComplete={() => refreshData()} />
      </div>
    </PullToRefresh>
  );
}
