"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { t } from "@/lib/i18n";
import { useDashboardViewModel } from "@/viewmodels/useDashboardViewModel";
import { HealthSection } from "@/components/dashboard/HealthSection";
import { FinanceSection } from "@/components/dashboard/FinanceSection";
import { FABMenu } from "@/components/dashboard/FABMenu";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { AddTransactionForm } from "@/components/forms/AddTransactionForm";
import { AddMealForm } from "@/components/forms/AddMealForm";
import { AddExerciseForm } from "@/components/forms/AddExerciseForm";
import { AddAccountForm } from "@/components/forms/AddAccountForm";
import { EditAccountForm } from "@/components/forms/EditAccountForm";
import { ManageCategoriesForm } from "@/components/forms/ManageCategoriesForm";
import { ManageDebtsForm } from "@/components/forms/ManageDebtsForm";
import { ManageSubscriptionsForm } from "@/components/forms/ManageSubscriptionsForm";
import { EditMealForm } from "@/components/forms/EditMealForm";
import { AddSleepForm } from "@/components/forms/AddSleepForm";

import { HealthAnalysis } from "@/components/dashboard/HealthAnalysis";
import { FinanceAnalysis } from "@/components/dashboard/FinanceAnalysis";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function DashboardView() {
  const router = useRouter();
  const { mode, setMode, currentDate, handlePrevDay, handleNextDay, healthData, financeData, isLoadingHealth, isLoadingFinance, refreshData } = useDashboardViewModel();
  
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
  };

  const handleSuccess = () => {
    setActiveSheet(null);
    refreshData();
  };

  const renderSheetContent = () => {
    switch (activeSheet) {
      case 'transaction': return <AddTransactionForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} categories={financeData?.categories || []} accounts={financeData?.accounts || []} />;
      case 'meal': return <AddMealForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} />;
      case 'editMeal': return <EditMealForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} />;
      case 'exercise': return <AddExerciseForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} />;
      case 'addSleep': return <AddSleepForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} />;
      case 'addAccount': return <AddAccountForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} />;
      case 'editAccount': return <EditAccountForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} />;
      case 'categories': return <ManageCategoriesForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} categories={financeData?.categories || []} />;
      case 'debts': return <ManageDebtsForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} debts={financeData?.debts || []} />;
      case 'subscriptions': return <ManageSubscriptionsForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} subscriptions={financeData?.subscriptions || []} categories={financeData?.categories || []} accounts={financeData?.accounts || []} />;
      default: return null;
    }
  };

  const getSheetTitle = () => {
    switch (activeSheet) {
      case 'transaction': return 'Gelir / Gider Ekle';
      case 'meal': return 'Öğün Ekle';
      case 'editMeal': return 'Öğün Düzenle';
      case 'exercise': return 'Egzersiz Ekle';
      case 'addSleep': return 'Uyku Verisi Ekle';
      case 'addAccount': return 'Hesap Oluştur';
      case 'editAccount': return 'Hesabı Düzenle';
      case 'categories': return 'Kategori Yönetimi';
      case 'debts': return 'Borç Yönetimi';
      case 'subscriptions': return 'Abonelikler';
      default: return '';
    }
  };

  // Determine background based on mode
  let ambientClass = 'ambient-health';
  if (mode === 'finance' || mode === 'finance-analysis') ambientClass = 'ambient-finance';
  else if (mode === 'overview') ambientClass = ''; 

  return (
    <div className={`min-h-screen relative w-full ${ambientClass} transition-colors duration-800`}>
      
      {/* ── Top Bar / Mode Switcher (Top Right) ── */}
      <header className="w-full pt-8 pb-4 px-8 flex justify-between items-center animate-fade-in z-10 relative">
        <div className="flex-1">
          <h1 className="text-logo text-white">{t("home.logo")}</h1>
        </div>
        
        {/* Only show mode switcher if not in analysis mode */}
        <div className="flex-1 flex justify-center hidden sm:flex">
          {mode !== 'health-analysis' && mode !== 'finance-analysis' && (
            <div className="flex bg-[rgba(255,255,255,0.03)] backdrop-blur-lg p-1 rounded-[var(--radius-btn)] border border-[rgba(255,255,255,0.05)]">
              <button
                onClick={() => setMode('overview')}
                className={`px-6 py-2 rounded-full text-body font-medium transition-all duration-300 ${
                  mode === 'overview' ? 'bg-white text-[var(--background)] shadow-sm' : 'text-[var(--on-surface-variant)] hover:text-white'
                }`}
              >
                Tüm Veriler
              </button>
              <button
                onClick={() => setMode('health')}
                className={`px-6 py-2 rounded-full text-body font-medium transition-all duration-300 ${
                  mode === 'health' ? 'bg-white text-[var(--background)] shadow-sm' : 'text-[var(--on-surface-variant)] hover:text-white'
                }`}
              >
                {t("dashboard.tabHealth")}
              </button>
              <button
                onClick={() => setMode('finance')}
                className={`px-6 py-2 rounded-full text-body font-medium transition-all duration-300 ${
                  mode === 'finance' ? 'bg-white text-[var(--background)] shadow-sm' : 'text-[var(--on-surface-variant)] hover:text-white'
                }`}
              >
                {t("dashboard.tabFinance")}
              </button>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="flex-1 flex justify-end">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-red-500/20 hover:text-red-400 text-[var(--on-surface-variant)] transition-all"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium hidden sm:inline">Çıkış Yap</span>
          </button>
        </div>
      </header>

      {/* Mobile Mode Switcher (shows below header on small screens) */}
      <div className="w-full px-8 pb-4 sm:hidden flex justify-center relative z-10">
        {mode !== 'health-analysis' && mode !== 'finance-analysis' && (
          <div className="flex w-full bg-[rgba(255,255,255,0.03)] backdrop-blur-lg p-1 rounded-[var(--radius-btn)] border border-[rgba(255,255,255,0.05)]">
            <button
              onClick={() => setMode('overview')}
              className={`flex-1 py-2 text-center rounded-full text-sm font-medium transition-all duration-300 ${
                mode === 'overview' ? 'bg-white text-[var(--background)] shadow-sm' : 'text-[var(--on-surface-variant)] hover:text-white'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setMode('health')}
              className={`flex-1 py-2 text-center rounded-full text-sm font-medium transition-all duration-300 ${
                mode === 'health' ? 'bg-white text-[var(--background)] shadow-sm' : 'text-[var(--on-surface-variant)] hover:text-white'
              }`}
            >
              Sağlık
            </button>
            <button
              onClick={() => setMode('finance')}
              className={`flex-1 py-2 text-center rounded-full text-sm font-medium transition-all duration-300 ${
                mode === 'finance' ? 'bg-white text-[var(--background)] shadow-sm' : 'text-[var(--on-surface-variant)] hover:text-white'
              }`}
            >
              Finans
            </button>
          </div>
        )}
      </div>

      {/* ── Main Content Area ── */}
      <main className="w-full px-8 pb-24 relative z-0">
        {mode === 'overview' && (
          <div className="flex flex-col md:flex-row gap-8 w-full max-w-[1400px] mx-auto animate-fade-in">
            {/* Split Screen for Overview */}
            <div className="flex-1 ambient-health rounded-3xl p-6 relative overflow-hidden border border-[rgba(255,255,255,0.05)]">
              {isLoadingHealth || !healthData ? <LoadingSpinner /> : <HealthSection data={healthData} isOverview={true} onOpenSheet={setActiveSheet} />}
            </div>
            <div className="flex-1 ambient-finance rounded-3xl p-6 relative overflow-hidden border border-[rgba(255,255,255,0.05)]">
              {isLoadingFinance || !financeData ? <LoadingSpinner /> : <FinanceSection data={financeData} isOverview={true} onOpenSheet={setActiveSheet} />}
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
              onOpenSheet={setActiveSheet}
            />
          )
        )}

        {mode === 'finance' && (
          isLoadingFinance || !financeData ? <LoadingSpinner /> : (
            <FinanceSection 
              data={financeData} 
              isOverview={false} 
              onOpenSheet={setActiveSheet} 
              onShowAnalysis={() => setMode('finance-analysis')}
            />
          )
        )}

        {mode === 'health-analysis' && (
          <HealthAnalysis onBack={() => setMode('health')} />
        )}

        {mode === 'finance-analysis' && (
          <FinanceAnalysis onBack={() => setMode('finance')} />
        )}
      </main>

      {/* ── FAB Menu ── */}
      {mode !== 'health-analysis' && mode !== 'finance-analysis' && (
        <FABMenu mode={mode} onOpenSheet={setActiveSheet} />
      )}

      <BottomSheet isOpen={!!activeSheet} onClose={() => setActiveSheet(null)} title={getSheetTitle()}>
        {renderSheetContent()}
      </BottomSheet>
    </div>
  );
}
