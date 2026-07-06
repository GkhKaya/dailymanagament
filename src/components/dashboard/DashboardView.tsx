"use client";

import React, { useState } from "react";
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

export function DashboardView() {
  const { mode, setMode, currentDate, handlePrevDay, handleNextDay, healthData, financeData } = useDashboardViewModel();
  
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  const renderSheetContent = () => {
    switch (activeSheet) {
      case 'transaction': return <AddTransactionForm onClose={() => setActiveSheet(null)} />;
      case 'meal': return <AddMealForm onClose={() => setActiveSheet(null)} />;
      case 'editMeal': return <EditMealForm onClose={() => setActiveSheet(null)} />;
      case 'exercise': return <AddExerciseForm onClose={() => setActiveSheet(null)} />;
      case 'addSleep': return <AddSleepForm onClose={() => setActiveSheet(null)} />;
      case 'addAccount': return <AddAccountForm onClose={() => setActiveSheet(null)} />;
      case 'editAccount': return <EditAccountForm onClose={() => setActiveSheet(null)} />;
      case 'categories': return <ManageCategoriesForm onClose={() => setActiveSheet(null)} />;
      case 'debts': return <ManageDebtsForm onClose={() => setActiveSheet(null)} />;
      case 'subscriptions': return <ManageSubscriptionsForm onClose={() => setActiveSheet(null)} />;
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
        <h1 className="text-logo text-white">{t("home.logo")}</h1>
        
        {/* Only show mode switcher if not in analysis mode */}
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
      </header>

      {/* ── Main Content Area ── */}
      <main className="w-full px-8 pb-24 relative z-0">
        {mode === 'overview' && (
          <div className="flex flex-col md:flex-row gap-8 w-full max-w-[1400px] mx-auto animate-fade-in">
            {/* Split Screen for Overview */}
            <div className="flex-1 ambient-health rounded-3xl p-6 relative overflow-hidden border border-[rgba(255,255,255,0.05)]">
              <HealthSection data={healthData} isOverview={true} onOpenSheet={setActiveSheet} />
            </div>
            <div className="flex-1 ambient-finance rounded-3xl p-6 relative overflow-hidden border border-[rgba(255,255,255,0.05)]">
              <FinanceSection data={financeData} isOverview={true} onOpenSheet={setActiveSheet} />
            </div>
          </div>
        )}

        {mode === 'health' && (
          <HealthSection 
            data={healthData} 
            isOverview={false} 
            currentDate={currentDate} 
            onPrevDay={handlePrevDay} 
            onNextDay={handleNextDay} 
            onShowAnalysis={() => setMode('health-analysis')}
            onOpenSheet={setActiveSheet}
          />
        )}

        {mode === 'finance' && (
          <FinanceSection 
            data={financeData} 
            isOverview={false} 
            onOpenSheet={setActiveSheet} 
            onShowAnalysis={() => setMode('finance-analysis')}
          />
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
