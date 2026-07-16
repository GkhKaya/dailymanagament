"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Key, Mail, Wallet, ArrowRight, ChevronRight, Star } from 'lucide-react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { ManageCategoriesForm } from '@/components/forms/ManageCategoriesForm';
import { ManageDebtsForm } from '@/components/forms/ManageDebtsForm';
import { ManageSubscriptionsForm } from '@/components/forms/ManageSubscriptionsForm';
import { AddAccountForm } from '@/components/forms/AddAccountForm';
import { UpdateEmailForm } from '@/components/forms/UpdateEmailForm';
import { UpdateUsernameForm } from '@/components/forms/UpdateUsernameForm';
import { UpdatePasswordForm } from '@/components/forms/UpdatePasswordForm';
import { UpdateWeightForm } from '@/components/forms/UpdateWeightForm';
import { UpdateAgeForm } from '@/components/forms/UpdateAgeForm';
import { ManageAccountsForm } from '@/components/forms/ManageAccountsForm';
import { EditAccountForm } from '@/components/forms/EditAccountForm';
import { EditSubscriptionForm } from '@/components/forms/EditSubscriptionForm';
import { EditDebtForm } from '@/components/forms/EditDebtForm';
import { FinanceDataDTO } from '@/models/DashboardTypes';

export function ProfileView({ initialUser, financeData }: { initialUser: { name: string, email: string, image?: string, current_weight_kg?: number, target_weight_kg?: number, height_cm?: number, age?: number }, financeData?: FinanceDataDTO | null }) {
  const router = useRouter();
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  const handleSuccess = () => {
    setActiveSheet(null);
    router.refresh();
  };

  const renderSheetContent = () => {
    if (activeSheet?.startsWith('editAccount_')) {
      const id = activeSheet.replace('editAccount_', '');
      const data = financeData?.accounts.find(a => a.id === id);
      return <EditAccountForm onClose={() => setActiveSheet('manageAccounts')} onSuccess={handleSuccess} initialData={data} />;
    }
    if (activeSheet?.startsWith('editSubscription_')) {
      const id = activeSheet.replace('editSubscription_', '');
      const data = financeData?.subscriptions.find(s => s.id === id);
      // Map properties for EditSubscriptionForm
      const subData = data ? { id: data.id, name: data.name, amount: data.amount, billingDay: new Date(data.nextBillingDate).getDate() } : undefined;
      return <EditSubscriptionForm onClose={() => setActiveSheet('subscriptions')} onSuccess={handleSuccess} initialData={subData} />;
    }
    if (activeSheet?.startsWith('editDebt_')) {
      const id = activeSheet.replace('editDebt_', '');
      const data = financeData?.debts.find(d => d.id === id);
      return <EditDebtForm onClose={() => setActiveSheet('debts')} onSuccess={handleSuccess} initialData={data} />;
    }

    switch (activeSheet) {
      case 'manageAccounts': return (
        <ManageAccountsForm 
          onClose={() => setActiveSheet(null)} 
          onOpenAdd={() => setActiveSheet('addAccount')}
          onOpenEdit={(id) => { setActiveSheet(`editAccount_${id}`) }}
          accounts={financeData?.accounts || []} 
        />
      );
      case 'addAccount': return <AddAccountForm onClose={() => setActiveSheet('manageAccounts')} onSuccess={handleSuccess} />;
      case 'categories': return <ManageCategoriesForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} categories={financeData?.categories || []} />;
      case 'debts': return <ManageDebtsForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} onOpenEdit={(id) => { setActiveSheet(`editDebt_${id}`) }} debts={financeData?.debts || []} />;
      case 'subscriptions': return <ManageSubscriptionsForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} onOpenEdit={(id) => { setActiveSheet(`editSubscription_${id}`) }} subscriptions={financeData?.subscriptions || []} categories={financeData?.categories || []} accounts={financeData?.accounts || []} />;
      case 'email': return <UpdateEmailForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} initialEmail={initialUser.email} />;
      case 'username': return <UpdateUsernameForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} initialUsername={initialUser.name} />;
      case 'password': return <UpdatePasswordForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} />;
      case 'weight': return <UpdateWeightForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} initialWeight={initialUser.current_weight_kg} />;
      case 'age': return <UpdateAgeForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} />;
      default: return (
        <div className="p-8 text-center text-[var(--on-surface-variant)]">
          Bu form yapım aşamasındadır.
        </div>
      );
    }
  };

  const getSheetTitle = () => {
    if (activeSheet?.startsWith('editAccount_')) return 'Hesabı Düzenle';
    if (activeSheet?.startsWith('editSubscription_')) return 'Aboneliği Düzenle';
    if (activeSheet?.startsWith('editDebt_')) return 'Borç/Alacak Düzenle';

    switch (activeSheet) {
      case 'password': return 'Şifre Güncelle';
      case 'email': return 'E-posta Değiştir';
      case 'username': return 'Kullanıcı Adı Değiştir';
      case 'weight': return 'Kilo Bilgisini Güncelle';
      case 'age': return 'Yaş Bilgisini Güncelle';
      case 'manageAccounts': return 'Mevcut Hesaplar';
      case 'addAccount': return 'Hesap Oluştur';
      case 'debts': return 'Borç Yönetimi';
      case 'subscriptions': return 'Abonelik Yönetimi';
      default: return 'Yönetim';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-5xl animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col mb-10">
          <div className="flex items-center gap-4 mb-2">
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] flex items-center justify-center transition-colors text-white shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">Profil & Ayarlar</h1>
          </div>
          <p className="text-[var(--on-surface-variant)] text-sm sm:text-base ml-[56px]">
            Kimlik bilgilerinizi, fiziksel verilerinizi ve finansal ayarlarınızı yönetin.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column */}
          <div className="md:col-span-4 flex flex-col gap-6">
            
            {/* Kişisel Bilgiler Card */}
            <div className="bg-[var(--surface-container-low)] border border-[var(--outline)] rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6">Kişisel Bilgiler</h3>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border border-[var(--primary)] bg-[rgba(74,222,128,0.05)] flex items-center justify-center text-[var(--primary)] mb-4 shadow-[0_0_20px_rgba(74,222,128,0.15)]">
                  <User size={40} />
                </div>
                <h2 className="text-xl font-bold text-white">{initialUser.name || initialUser.email?.split('@')[0]}</h2>
                <p className="text-sm text-[var(--on-surface-variant)]">{initialUser.email}</p>
                <button 
                  onClick={() => setActiveSheet('email')}
                  className="mt-6 w-full py-2.5 rounded-md border border-[var(--outline)] text-[var(--primary)] font-bold text-xs tracking-wider uppercase hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                >
                  Profili Düzenle
                </button>
              </div>
            </div>

            {/* Finans Yönetimi Card (Alternative to Subscription in Image) */}
            <div className="bg-[var(--surface-container-low)] border border-[var(--primary)]/20 rounded-xl p-6 shadow-xl relative overflow-hidden">
              {/* Subtle green glow in bg */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--primary)]/10 blur-3xl rounded-full pointer-events-none"></div>
              
              <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Finans Yönetimi
                </h3>
                <Star size={16} className="text-[var(--primary)]" />
              </div>
              
              <div className="flex flex-col gap-2 relative z-10">
                <button onClick={() => setActiveSheet('manageAccounts')} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-container)] hover:bg-[#27272a] transition-colors group">
                  <div className="flex flex-col text-left">
                    <span className="text-white font-bold text-sm group-hover:text-[var(--primary)] transition-colors">Hesap Yönetimi</span>
                    <span className="text-xs text-[var(--on-surface-variant)]">Banka ve nakit</span>
                  </div>
                  <ArrowRight size={16} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                </button>
                <button onClick={() => setActiveSheet('subscriptions')} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-container)] hover:bg-[#27272a] transition-colors group">
                  <div className="flex flex-col text-left">
                    <span className="text-white font-bold text-sm group-hover:text-[var(--primary)] transition-colors">Abonelik Yönetimi</span>
                    <span className="text-xs text-[var(--on-surface-variant)]">Aylık kesintiler</span>
                  </div>
                  <ArrowRight size={16} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                </button>
                <button onClick={() => setActiveSheet('debts')} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-container)] hover:bg-[#27272a] transition-colors group">
                  <div className="flex flex-col text-left">
                    <span className="text-white font-bold text-sm group-hover:text-[var(--primary)] transition-colors">Borç Yönetimi</span>
                    <span className="text-xs text-[var(--on-surface-variant)]">Verecek/Alacak listesi</span>
                  </div>
                  <ArrowRight size={16} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="md:col-span-8 flex flex-col gap-6">
            
            {/* Fiziksel Veriler Card */}
            <div className="bg-[var(--surface-container-low)] border border-[var(--outline)] rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6">Fiziksel Veriler</h3>
              
              <div className="flex flex-wrap items-center gap-8 md:gap-16 pb-2">
                {/* Age */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-widest">YAŞ</span>
                  <div className="text-3xl font-extrabold text-white">{initialUser.age || '-'}</div>
                </div>
                
                {/* Height Placeholder */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-widest">BOY</span>
                  <div className="text-3xl font-extrabold text-white">
                    {initialUser.height_cm || '-'}<span className="text-base text-white/50 font-medium ml-1">cm</span>
                  </div>
                </div>

                {/* Weight */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-widest">GÜNCEL KİLO</span>
                  <div className="text-3xl font-extrabold text-[var(--primary)]">
                    {initialUser.current_weight_kg || '-'}
                    <span className="text-base text-[var(--primary)]/70 font-medium ml-1">kg</span>
                  </div>
                </div>

                {/* Target Weight Placeholder */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-widest">HEDEF KİLO</span>
                  <div className="text-3xl font-extrabold text-white">
                    {initialUser.target_weight_kg || '-'}<span className="text-base text-white/50 font-medium ml-1">kg</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hedefler & Tercihler Card */}
            <div className="bg-[var(--surface-container-low)] border border-[var(--outline)] rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">Veri Güncelleme & Tercihler</h3>
              
              <div className="flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-[var(--outline)] gap-4 sm:gap-0">
                  <div className="flex flex-col">
                    <span className="text-white font-medium">Kilo Bilgisi</span>
                    <span className="text-sm text-[var(--on-surface-variant)]">Güncel kilonuzu değiştirin</span>
                  </div>
                  <button onClick={() => setActiveSheet('weight')} className="px-5 py-2 rounded-md border border-[var(--outline)] text-[var(--primary)] font-bold text-sm bg-[var(--background)] hover:bg-[#27272a] transition-colors min-w-[120px] flex justify-center">
                    {initialUser.current_weight_kg || '0'} kg
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-[var(--outline)] gap-4 sm:gap-0">
                  <div className="flex flex-col">
                    <span className="text-white font-medium">Yaş Bilgisi</span>
                    <span className="text-sm text-[var(--on-surface-variant)]">Hedefler için gerekli</span>
                  </div>
                  <button onClick={() => setActiveSheet('age')} className="px-5 py-2 rounded-md border border-[var(--outline)] text-white font-bold text-sm bg-[var(--background)] hover:bg-[#27272a] transition-colors min-w-[120px] flex justify-center">
                    {initialUser.age || '0'} Yaş
                  </button>
                </div>
                
                {/* FatSecret Info / Toggle styling */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 gap-4 sm:gap-0">
                  <div className="flex flex-col pr-0 sm:pr-8">
                    <span className="text-white font-medium">FatSecret (Besin Arama)</span>
                    <span className="text-sm text-[var(--on-surface-variant)]">Ücretsiz versiyonda sadece İngilizce arama desteklenmektedir.</span>
                  </div>
                  <div className="w-12 h-6 rounded-full bg-[var(--primary)] relative flex items-center shrink-0 cursor-default opacity-80">
                     <div className="w-4 h-4 rounded-full bg-white absolute right-1"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hesap ve Güvenlik Card */}
            <div className="bg-[var(--surface-container-low)] border border-[var(--outline)] rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">Hesap ve Güvenlik</h3>
              
              <div className="flex flex-col gap-2">
                <button onClick={() => setActiveSheet('username')} className="flex items-center justify-between p-4 bg-[var(--surface-container)] hover:bg-[#27272a] rounded-lg transition-colors group border border-transparent hover:border-[var(--outline)]">
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                    <span className="text-white text-sm font-medium">Kullanıcı Adı Değiştir</span>
                  </div>
                  <ChevronRight size={16} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                </button>

                <button onClick={() => setActiveSheet('password')} className="flex items-center justify-between p-4 bg-[var(--surface-container)] hover:bg-[#27272a] rounded-lg transition-colors group border border-transparent hover:border-[var(--outline)]">
                  <div className="flex items-center gap-3">
                    <Key size={18} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                    <span className="text-white text-sm font-medium">Şifre Değiştir</span>
                  </div>
                  <ChevronRight size={16} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                </button>

                <button onClick={() => setActiveSheet('email')} className="flex items-center justify-between p-4 bg-[var(--surface-container)] hover:bg-[#27272a] rounded-lg transition-colors group border border-transparent hover:border-[var(--outline)]">
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                    <span className="text-white text-sm font-medium">E-posta Değiştir</span>
                  </div>
                  <ChevronRight size={16} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <BottomSheet isOpen={!!activeSheet} onClose={() => setActiveSheet(null)} title={getSheetTitle()}>
        {renderSheetContent()}
      </BottomSheet>
    </div>
  );
}

