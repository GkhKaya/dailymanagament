"use client";

import React from "react";
import dynamic from 'next/dynamic';
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useTranslation } from "@/hooks/useTranslation";
import { isAbroad } from "@/lib/i18n";

// Performans optimizasyonu: Ağır formları sadece ihtiyaç anında (tıklandığında) yüklenecek şekilde (Lazy Load) ayırıyoruz.
const AddTransactionForm = dynamic(() => import("@/components/forms/AddTransactionForm").then(m => m.AddTransactionForm), { ssr: false });
const EditTransactionForm = dynamic(() => import("@/components/forms/EditTransactionForm").then(m => m.EditTransactionForm), { ssr: false });
const AddMealForm = dynamic(() => import("@/components/forms/AddMealForm").then(m => m.AddMealForm), { ssr: false });
const EditMealForm = dynamic(() => import("@/components/forms/EditMealForm").then(m => m.EditMealForm), { ssr: false });
const AddExerciseForm = dynamic(() => import("@/components/forms/AddExerciseForm").then(m => m.AddExerciseForm), { ssr: false });
const AddSleepForm = dynamic(() => import("@/components/forms/AddSleepForm").then(m => m.AddSleepForm), { ssr: false });
const AddWeightForm = dynamic(() => import("@/components/forms/AddWeightForm").then(m => m.AddWeightForm), { ssr: false });
const AddAccountForm = dynamic(() => import("@/components/forms/AddAccountForm").then(m => m.AddAccountForm), { ssr: false });
const EditAccountForm = dynamic(() => import("@/components/forms/EditAccountForm").then(m => m.EditAccountForm), { ssr: false });
const ManageCategoriesForm = dynamic(() => import("@/components/forms/ManageCategoriesForm").then(m => m.ManageCategoriesForm), { ssr: false });
const ManageDebtsForm = dynamic(() => import("@/components/forms/ManageDebtsForm").then(m => m.ManageDebtsForm), { ssr: false });
const ManageSubscriptionsForm = dynamic(() => import("@/components/forms/ManageSubscriptionsForm").then(m => m.ManageSubscriptionsForm), { ssr: false });
const ManageAccountsForm = dynamic(() => import("@/components/forms/ManageAccountsForm").then(m => m.ManageAccountsForm), { ssr: false });
const TransferAccountsForm = dynamic(() => import("@/components/forms/TransferAccountsForm").then(m => m.TransferAccountsForm), { ssr: false });
const ManageWorkoutRoutineForm = dynamic(() => import("@/components/forms/ManageWorkoutRoutineForm").then(m => m.ManageWorkoutRoutineForm), { ssr: false });
const AIPhotoMealModal = dynamic(() => import("@/components/forms/AIPhotoMealModal").then(m => m.AIPhotoMealModal), { ssr: false });
const AddStockTradeModal = dynamic(() => import("@/components/forms/AddStockTradeModal").then(m => m.AddStockTradeModal), { ssr: false });

interface DashboardSheetManagerProps {
  activeSheet: string | null;
  sheetPayload: any;
  setActiveSheet: (sheet: string | null) => void;
  setSheetPayload: (payload: any) => void;
  handleSuccess: () => void;
  refreshData: () => void;
  financeData: any;
  healthData: any;
  currentDate: Date;
}

export function DashboardSheetManager({
  activeSheet,
  sheetPayload,
  setActiveSheet,
  setSheetPayload,
  handleSuccess,
  refreshData,
  financeData,
  healthData,
  currentDate
}: DashboardSheetManagerProps) {
  
  const { locale, isAbroad: abroadFromHook } = useTranslation();
  const [userAbroad, setUserAbroad] = React.useState(false);

  React.useEffect(() => {
    setUserAbroad(isAbroad());
  }, []);

  const isEn = abroadFromHook || locale === 'en' || userAbroad || isAbroad();
  const localDateStr = new Date(currentDate.getTime() - currentDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];

  if (activeSheet === 'aiPhotoMeal') {
    return (
      <AIPhotoMealModal
        isOpen={true}
        onClose={() => setActiveSheet(null)}
        onSuccess={handleSuccess}
        currentDate={localDateStr}
        initialMealType={sheetPayload?.mealType || 'lunch'}
      />
    );
  }

  if (activeSheet === 'stockTrade') {
    return (
      <AddStockTradeModal
        isOpen={true}
        onClose={() => setActiveSheet(null)}
        onSuccess={handleSuccess}
        initialType={sheetPayload?.type || 'buy'}
        initialSymbol={sheetPayload?.symbol || ''}
      />
    );
  }

  const renderSheetContent = () => {
    switch (activeSheet) {
      case 'transaction': return <AddTransactionForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} onOpenCategories={() => setActiveSheet('categories')} categories={financeData?.categories || []} accounts={financeData?.accounts || []} currentDate={localDateStr} />;
      case 'edit-transaction': return <EditTransactionForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} categories={financeData?.categories || []} accounts={financeData?.accounts || []} transaction={sheetPayload} />;
      case 'meal': return <AddMealForm onClose={() => { setActiveSheet(null); setSheetPayload(null); refreshData(); }} onSuccess={refreshData} currentDate={localDateStr} onOpenAIPhoto={() => setActiveSheet('aiPhotoMeal')} />;
      case 'editMeal': return <EditMealForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} initialData={sheetPayload} />;
      case 'exercise': return <AddExerciseForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} userWeight={healthData?.currentWeight || 70} currentDate={localDateStr} />;
      case 'addSleep': return <AddSleepForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} currentDate={localDateStr} />;
      case 'addWeight': return <AddWeightForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} currentWeight={sheetPayload?.currentWeight || 0} weightHistory={sheetPayload?.weightHistory || []} currentDate={localDateStr} />;
      case 'manageWorkoutRoutine': return <ManageWorkoutRoutineForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} initialData={sheetPayload} />;
      case 'manageAccounts': return (
        <ManageAccountsForm 
          onClose={() => setActiveSheet(null)} 
          onOpenAdd={() => setActiveSheet('addAccount')}
          onOpenTransfer={() => setActiveSheet('transferAccounts')}
          onOpenEdit={(id: string) => { 
            const acc = financeData?.accounts?.find((a: any) => a.id === id);
            if (acc) {
              setSheetPayload(acc);
              setActiveSheet('editAccount');
            }
          }}
          accounts={financeData?.accounts || []} 
        />
      );
      case 'addAccount': return <AddAccountForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} />;
      case 'transferAccounts': return <TransferAccountsForm accounts={financeData?.accounts || []} currentDate={localDateStr} onSuccess={handleSuccess} onClose={() => setActiveSheet(null)} />;
      case 'editAccount': return <EditAccountForm onSuccess={handleSuccess} initialData={sheetPayload} accounts={financeData?.accounts || []} />;
      case 'categories': return <ManageCategoriesForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} categories={financeData?.categories || []} />;
      case 'debts': return <ManageDebtsForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} debts={financeData?.debts || []} />;
      case 'subscriptions': return <ManageSubscriptionsForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} subscriptions={financeData?.subscriptions || []} categories={financeData?.categories || []} accounts={financeData?.accounts || []} />;
      default: return null;
    }
  };

  const getSheetTitle = () => {
    switch (activeSheet) {
      case 'transaction': return isEn ? 'Add Income / Expense' : 'Gelir / Gider Ekle';
      case 'edit-transaction': return isEn ? 'Edit Transaction' : 'İşlemi Düzenle';
      case 'meal': return isEn ? 'Add Meal' : 'Öğün Ekle';
      case 'editMeal': return isEn ? 'Edit Meal' : 'Öğün Düzenle';
      case 'exercise': return isEn ? 'Add Exercise' : 'Egzersiz Ekle';
      case 'addSleep': return isEn ? 'Add Sleep Log' : 'Uyku Verisi Ekle';
      case 'addWeight': return isEn ? 'Update Weight' : 'Kilo Güncelle';
      case 'manageWorkoutRoutine': return sheetPayload?.id ? (isEn ? 'Edit Workout Day' : 'Antrenman Gününü Düzenle') : (isEn ? 'Add Workout Routine' : 'Antrenman Programı Ekle');
      case 'manageAccounts': return isEn ? 'Manage Accounts' : 'Hesapları Yönet';
      case 'addAccount': return isEn ? 'Create Account' : 'Hesap Oluştur';
      case 'transferAccounts': return isEn ? 'Transfer Between Accounts' : 'Hesaplar Arası Transfer';
      case 'editAccount': return isEn ? 'Edit Account' : 'Hesabı Düzenle';
      case 'categories': return isEn ? 'Category Management' : 'Kategori Yönetimi';
      case 'debts': return isEn ? 'Debt Management' : 'Borç Yönetimi';
      case 'subscriptions': return isEn ? 'Subscriptions' : 'Abonelikler';
      default: return '';
    }
  };

  return (
    <BottomSheet isOpen={!!activeSheet} onClose={() => setActiveSheet(null)} title={getSheetTitle()}>
      {renderSheetContent()}
    </BottomSheet>
  );
}
