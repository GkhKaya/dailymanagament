"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { HelpCircle, LogOut, User } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { t } from "@/lib/i18n";
import { useDashboardViewModel } from "@/viewmodels/useDashboardViewModel";
import dynamic from 'next/dynamic';
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
const StocksSection = dynamic(() => import("@/components/dashboard/StocksSection").then(m => m.StocksSection), { ssr: false });

import { DashboardSheetManager } from "@/components/dashboard/DashboardSheetManager";

export function DashboardView() {
  const router = useRouter();
  const { mode, setMode, currentDate, handlePrevDay, handleNextDay, handleAddBmr, healthData, financeData, isLoadingHealth, isLoadingFinance, refreshData } = useDashboardViewModel();
  
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
        document.title = "Gösterge Paneli | DailyM";
        break;
      case 'health':
        document.title = "Beslenme | DailyM";
        break;
      case 'finance':
        document.title = "Cüzdan | DailyM";
        break;
      case 'stocks':
        document.title = "Borsa & Portföy | DailyM";
        break;
      case 'health-analysis':
        document.title = "Sağlık Analizi | DailyM";
        break;
      case 'finance-analysis':
        document.title = "Finans Analizi | DailyM";
        break;
    }
  }, [mode]);

  const handleLogout = async () => {
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
        <a className="skip-link" href="#main-content">Ana içeriğe geç</a>
        {/* ── Top App Bar / Header ── */}
        <header className="w-full px-4 sm:px-[var(--space-6)] py-3 sm:py-[var(--space-4)] flex items-center justify-between border-b border-[rgba(255,255,255,0)] bg-transparent backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-[var(--space-6)]">
            {/* Logo & Brand */}
            <button type="button" aria-label="Genel bakışa git" className="flex items-center gap-2.5 cursor-pointer" onClick={() => setMode('overview')}>
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
                Borsa
              </button>
            </nav>
          </div>

          {/* Action icons (Notifications, Settings, Profile) */}
          <div className="flex items-center gap-[var(--space-3)]">

            <button 
              onClick={() => setShowProductTour(true)}
              aria-label="Uygulama tanıtım rehberini başlat"
              title="Tanıtım Rehberi"
              className="min-h-11 min-w-11 rounded bg-[var(--outline)] flex items-center justify-center text-[var(--primary)] hover:bg-[var(--primary)] hover:text-black transition-colors"
            >
              <HelpCircle size={16} />
            </button>
            <button 
              data-tour="profile"
              onClick={() => router.push('/profile')}
              aria-label="Profil ve ayarlar"
              className="min-h-11 min-w-11 rounded bg-[var(--outline)] flex items-center justify-center hover:bg-[var(--primary)] hover:text-white transition-colors"
            >
              <User size={16} />
            </button>
            <button 
              onClick={handleLogout}
              aria-label="Oturumu kapat"
              className="min-h-11 min-w-11 rounded bg-[var(--outline)] flex items-center justify-center text-[var(--on-surface-variant)] hover:bg-red-500 hover:text-white transition-colors"
            >
              <LogOut size={16} />
            </button>
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
                Genel
              </button>
              <button
                data-tour="nav-health"
                aria-pressed={mode === 'health'}
                onClick={() => setMode('health')}
                className={`py-2 text-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  mode === 'health' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--on-surface-variant)] hover:text-white'
                }`}
              >
                Sağlık
              </button>
              <button
                data-tour="nav-finance"
                aria-pressed={mode === 'finance'}
                onClick={() => setMode('finance')}
                className={`py-2 text-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  mode === 'finance' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--on-surface-variant)] hover:text-white'
                }`}
              >
                Cüzdan
              </button>
              <button
                data-tour="nav-stocks"
                aria-pressed={mode === 'stocks'}
                onClick={() => setMode('stocks')}
                className={`py-2 text-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  mode === 'stocks' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--on-surface-variant)] hover:text-white'
                }`}
              >
                Borsa
              </button>
            </div>
          )}
        </div>

        {/* ── Main Content Area ── */}
        <main id="main-content" className="w-full px-4 pt-8 sm:px-[var(--space-6)] sm:pt-10 pb-[var(--space-10)] relative z-0" tabIndex={-1}>
          <h1 className="sr-only">DailyM kişisel yönetim paneli</h1>
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
            <StocksSection />
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
        {mode !== 'health-analysis' && mode !== 'finance-analysis' && (
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
      </div>
    </PullToRefresh>
  );
}
