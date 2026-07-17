"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { t } from "@/lib/i18n";
import { useDashboardViewModel } from "@/viewmodels/useDashboardViewModel";
import { HealthSection } from "@/components/dashboard/HealthSection";
import { FinanceSection } from "@/components/dashboard/FinanceSection";
import { FABMenu } from "@/components/dashboard/FABMenu";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { AddTransactionForm } from "@/components/forms/AddTransactionForm";
import { EditTransactionForm } from "@/components/forms/EditTransactionForm";
import { AddMealForm } from "@/components/forms/AddMealForm";
import { AddExerciseForm } from "@/components/forms/AddExerciseForm";
import { AddAccountForm } from "@/components/forms/AddAccountForm";
import { EditAccountForm } from "@/components/forms/EditAccountForm";
import { ManageCategoriesForm } from "@/components/forms/ManageCategoriesForm";
import { ManageDebtsForm } from "@/components/forms/ManageDebtsForm";
import { ManageSubscriptionsForm } from "@/components/forms/ManageSubscriptionsForm";
import { ManageAccountsForm } from "@/components/forms/ManageAccountsForm";
import { EditMealForm } from "@/components/forms/EditMealForm";
import { AddSleepForm } from "@/components/forms/AddSleepForm";
import { AddWeightForm } from "@/components/forms/AddWeightForm";
import { UpdateWeightForm } from '@/components/forms/UpdateWeightForm';
import { VoiceAssistantFAB } from '@/components/assistant/VoiceAssistantFAB';

import { HealthAnalysis } from "@/components/dashboard/HealthAnalysis";
import { FinanceAnalysis } from "@/components/dashboard/FinanceAnalysis";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function DashboardView() {
  const router = useRouter();
  const { mode, setMode, currentDate, handlePrevDay, handleNextDay, healthData, financeData, isLoadingHealth, isLoadingFinance, refreshData } = useDashboardViewModel();
  
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [sheetPayload, setSheetPayload] = useState<any>(null);

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

  const renderSheetContent = () => {
    switch (activeSheet) {
      case 'transaction': return <AddTransactionForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} onOpenCategories={() => setActiveSheet('categories')} categories={financeData?.categories || []} accounts={financeData?.accounts || []} />;
      case 'edit-transaction': return <EditTransactionForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} categories={financeData?.categories || []} accounts={financeData?.accounts || []} transaction={sheetPayload} />;
      case 'meal': return <AddMealForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} />;
      case 'editMeal': return <EditMealForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} initialData={sheetPayload} />;
      case 'exercise': return <AddExerciseForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} userWeight={healthData?.currentWeight || 70} />;
      case 'addSleep': return <AddSleepForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} />;
      case 'addWeight': return <AddWeightForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} currentWeight={sheetPayload?.currentWeight || 0} weightHistory={sheetPayload?.weightHistory || []} currentDate={currentDate.toISOString()} />;
      case 'manageAccounts': return (
        <ManageAccountsForm 
          onClose={() => setActiveSheet(null)} 
          onOpenAdd={() => setActiveSheet('addAccount')}
          onOpenEdit={(id) => { 
            const acc = financeData?.accounts?.find(a => a.id === id);
            if (acc) {
              setSheetPayload(acc);
              setActiveSheet('editAccount');
            }
          }}
          accounts={financeData?.accounts || []} 
        />
      );
      case 'addAccount': return <AddAccountForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} />;
      case 'editAccount': return <EditAccountForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} initialData={sheetPayload} />;
      case 'categories': return <ManageCategoriesForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} categories={financeData?.categories || []} />;
      case 'debts': return <ManageDebtsForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} debts={financeData?.debts || []} />;
      case 'subscriptions': return <ManageSubscriptionsForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} subscriptions={financeData?.subscriptions || []} categories={financeData?.categories || []} accounts={financeData?.accounts || []} />;
      default: return null;
    }
  };

  const getSheetTitle = () => {
    switch (activeSheet) {
      case 'transaction': return 'Gelir / Gider Ekle';
      case 'edit-transaction': return 'İşlemi Düzenle';
      case 'meal': return 'Öğün Ekle';
      case 'editMeal': return 'Öğün Düzenle';
      case 'exercise': return 'Egzersiz Ekle';
      case 'addSleep': return 'Uyku Verisi Ekle';
      case 'addWeight': return 'Kilo Güncelle';
      case 'manageAccounts': return 'Hesapları Yönet';
      case 'addAccount': return 'Hesap Oluştur';
      case 'editAccount': return 'Hesabı Düzenle';
      case 'categories': return 'Kategori Yönetimi';
      case 'debts': return 'Borç Yönetimi';
      case 'subscriptions': return 'Abonelikler';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen relative w-full transition-colors duration-800 bg-[var(--background)]">
      
      {/* ── Header ── */}
      <header className="w-full pt-[var(--space-4)] pb-[var(--space-4)] px-[var(--space-6)] flex justify-between items-center animate-fade-in z-10 relative border-b border-[var(--outline)] mb-[var(--space-6)]">
        <div className="flex items-center gap-[var(--space-8)]">
          <h1 className="text-logo text-[var(--primary)]">{t("home.logo")}</h1>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-[var(--space-4)]">
            <button
              onClick={() => setMode('overview')}
              className={`text-body font-medium transition-colors ${
                mode === 'overview' ? 'text-[var(--primary)] border-b-2 border-[var(--primary)] pb-1' : 'text-[var(--on-surface-variant)] hover:text-white pb-1'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setMode('health')}
              className={`text-body font-medium transition-colors ${
                mode === 'health' ? 'text-[var(--primary)] border-b-2 border-[var(--primary)] pb-1' : 'text-[var(--on-surface-variant)] hover:text-white pb-1'
              }`}
            >
              {t("dashboard.tabHealth")}
            </button>
            <button
              onClick={() => setMode('finance')}
              className={`text-body font-medium transition-colors ${
                mode === 'finance' ? 'text-[var(--primary)] border-b-2 border-[var(--primary)] pb-1' : 'text-[var(--on-surface-variant)] hover:text-white pb-1'
              }`}
            >
              {t("dashboard.tabFinance")}
            </button>
          </nav>
        </div>

        {/* Action icons (Notifications, Settings, Profile) */}
        <div className="flex items-center gap-[var(--space-3)]">

          <button 
            onClick={() => router.push('/profile')}
            className="w-8 h-8 rounded bg-[var(--outline)] flex items-center justify-center hover:bg-[var(--primary)] hover:text-black transition-colors"
          >
            <User size={16} />
          </button>
          <button 
            onClick={handleLogout}
            className="w-8 h-8 rounded bg-[var(--outline)] flex items-center justify-center text-[var(--on-surface-variant)] hover:bg-red-500 hover:text-white transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Mobile Mode Switcher (shows below header on small screens) */}
      <div className="w-full px-8 pb-4 sm:hidden flex justify-center relative z-10">
        {mode !== 'health-analysis' && mode !== 'finance-analysis' && (
          <div className="flex w-full bg-[rgba(255,255,255,0.03)] backdrop-blur-lg p-1 rounded-[var(--radius-btn)] border border-[rgba(255,255,255,0.05)]">
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
      <main className="w-full px-[var(--space-6)] pb-[var(--space-10)] relative z-0">
        {mode === 'overview' && (
          <div className="flex flex-col xl:flex-row gap-[var(--space-8)] w-full max-w-[1600px] mx-auto animate-fade-in">
            {/* Split Screen for Overview */}
            <div className="flex-1 relative">
              {isLoadingHealth || !healthData ? <LoadingSpinner /> : <HealthSection data={healthData} isOverview={true} onOpenSheet={handleOpenSheet} />}
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

        {mode === 'health-analysis' && (
          <HealthAnalysis onBack={() => setMode('health')} />
        )}

        {mode === 'finance-analysis' && (
          <FinanceAnalysis onBack={() => setMode('finance')} />
        )}
      </main>

      {/* ── FAB Menu ── */}
      {mode !== 'health-analysis' && mode !== 'finance-analysis' && (
        <FABMenu mode={mode} onOpenSheet={handleOpenSheet} />
      )}

      <BottomSheet isOpen={!!activeSheet} onClose={() => setActiveSheet(null)} title={getSheetTitle()}>
        {renderSheetContent()}
      </BottomSheet>
      <VoiceAssistantFAB onSuccess={refreshData} />
    </div>
  );
}
