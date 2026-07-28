"use client";

import React from "react";
import dynamic from 'next/dynamic';
import { BottomSheet } from "@/components/ui/BottomSheet";

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
const ManageWorkoutRoutineForm = dynamic(() => import("@/components/forms/ManageWorkoutRoutineForm").then(m => m.ManageWorkoutRoutineForm), { ssr: false });

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
  
  const renderSheetContent = () => {
    switch (activeSheet) {
      case 'transaction': return <AddTransactionForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} onOpenCategories={() => setActiveSheet('categories')} categories={financeData?.categories || []} accounts={financeData?.accounts || []} />;
      case 'edit-transaction': return <EditTransactionForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} categories={financeData?.categories || []} accounts={financeData?.accounts || []} transaction={sheetPayload} />;
      case 'meal': return <AddMealForm onClose={() => { setActiveSheet(null); setSheetPayload(null); refreshData(); }} onSuccess={refreshData} />;
      case 'editMeal': return <EditMealForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} initialData={sheetPayload} />;
      case 'exercise': return <AddExerciseForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} userWeight={healthData?.currentWeight || 70} />;
      case 'addSleep': return <AddSleepForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} />;
      case 'addWeight': return <AddWeightForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} currentWeight={sheetPayload?.currentWeight || 0} weightHistory={sheetPayload?.weightHistory || []} currentDate={currentDate.toISOString()} />;
      case 'manageWorkoutRoutine': return <ManageWorkoutRoutineForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} initialData={sheetPayload} />;
      case 'manageAccounts': return (
        <ManageAccountsForm 
          onClose={() => setActiveSheet(null)} 
          onOpenAdd={() => setActiveSheet('addAccount')}
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
      case 'manageWorkoutRoutine': return sheetPayload?.id ? 'Antrenman Gününü Düzenle' : 'Antrenman Programı Ekle';
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
    <BottomSheet isOpen={!!activeSheet} onClose={() => setActiveSheet(null)} title={getSheetTitle()}>
      {renderSheetContent()}
    </BottomSheet>
  );
}
