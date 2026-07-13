"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Key, Mail, Scale, CalendarDays, Wallet, Receipt, CalendarCheck, Info } from 'lucide-react';

// For simplicity, these could be bottom sheets or forms similar to DashboardView.
// To keep things moving, we'll use place-holders that toggle "under construction" or just show the same BottomSheet as Dashboard.
// In a full implementation, we'd import ManageAccountsForm, ManageDebtsForm, etc.
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ManageCategoriesForm } from '@/components/forms/ManageCategoriesForm';
import { ManageDebtsForm } from '@/components/forms/ManageDebtsForm';
import { ManageSubscriptionsForm } from '@/components/forms/ManageSubscriptionsForm';
// We also need something for Accounts (Maybe a generic Accounts form if one existed, but AddAccountForm is for one).
import { AddAccountForm } from '@/components/forms/AddAccountForm';
import { UpdateEmailForm } from '@/components/forms/UpdateEmailForm';
import { UpdatePasswordForm } from '@/components/forms/UpdatePasswordForm';
import { UpdateWeightForm } from '@/components/forms/UpdateWeightForm';
import { UpdateAgeForm } from '@/components/forms/UpdateAgeForm';
import { ManageAccountsForm } from '@/components/forms/ManageAccountsForm';
import { FinanceDataDTO } from '@/models/DashboardTypes';

export function ProfileView({ initialUser, financeData }: { initialUser: any, financeData?: FinanceDataDTO | null }) {
  const router = useRouter();
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  const handleSuccess = () => setActiveSheet(null);

  const renderSheetContent = () => {
    switch (activeSheet) {
      case 'manageAccounts': return (
        <ManageAccountsForm 
          onClose={() => setActiveSheet(null)} 
          onOpenAdd={() => setActiveSheet('addAccount')}
          onOpenEdit={(id) => { /* Later implementation for edit */ }}
          accounts={financeData?.accounts || []} 
        />
      );
      case 'addAccount': return <AddAccountForm onClose={() => setActiveSheet('manageAccounts')} onSuccess={handleSuccess} />;
      case 'categories': return <ManageCategoriesForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} categories={financeData?.categories || []} />;
      case 'debts': return <ManageDebtsForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} debts={financeData?.debts || []} />;
      case 'subscriptions': return <ManageSubscriptionsForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} subscriptions={financeData?.subscriptions || []} categories={financeData?.categories || []} accounts={financeData?.accounts || []} />;
      case 'email': return <UpdateEmailForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} initialEmail={initialUser.email} />;
      case 'password': return <UpdatePasswordForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} />;
      case 'weight': return <UpdateWeightForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} initialWeight={initialUser.weight} />;
      case 'age': return <UpdateAgeForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} initialBirthDate={initialUser.birth_date} />;
      default: return (
        <div className="p-8 text-center text-[var(--on-surface-variant)]">
          Bu form yapım aşamasındadır.
        </div>
      );
    }
  };

  const getSheetTitle = () => {
    switch (activeSheet) {
      case 'password': return 'Şifre Güncelle';
      case 'email': return 'E-posta Değiştir';
      case 'weight': return 'Kilo Bilgisini Güncelle';
      case 'age': return 'Yaş Bilgisini Güncelle';
      case 'manageAccounts': return 'Mevcut Hesaplar';
      case 'addAccount': return 'Hesap Yönetimi';
      case 'debts': return 'Borç Yönetimi';
      case 'subscriptions': return 'Abonelik Yönetimi';
      default: return 'Yönetim';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center">
      
      {/* Header */}
      <header className="w-full max-w-2xl px-6 py-6 flex items-center gap-4 relative z-10">
        <button 
          onClick={() => router.push('/dashboard')}
          className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] flex items-center justify-center transition-colors text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Profil & Ayarlar</h1>
      </header>

      <main className="w-full max-w-2xl px-6 pb-24 flex flex-col gap-8 animate-fade-in">
        
        {/* User Info Block */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--inverse-primary)] flex items-center justify-center text-white text-4xl shadow-xl shadow-[var(--primary)]/20">
            <User size={40} />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">{initialUser.email?.split('@')[0]}</h2>
            <p className="text-body text-[var(--on-surface-variant)]">{initialUser.email}</p>
          </div>
        </div>

        {/* Account Settings */}
        <div>
          <h3 className="text-subtitle mb-4 px-2">Hesap Ayarları</h3>
          <div className="flex flex-col gap-2">
            <button onClick={() => setActiveSheet('email')} className="flex items-center gap-4 glass-item px-5 py-4 hover:bg-[rgba(255,255,255,0.08)] transition-colors text-left group">
              <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform">
                <Mail size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-body font-medium text-white">E-posta Değiştir</span>
                <span className="text-caption text-[var(--on-surface-variant)]">{initialUser.email}</span>
              </div>
            </button>
            <button onClick={() => setActiveSheet('password')} className="flex items-center gap-4 glass-item px-5 py-4 hover:bg-[rgba(255,255,255,0.08)] transition-colors text-left group">
              <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#c0c1ff] group-hover:scale-110 transition-transform">
                <Key size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-body font-medium text-white">Şifre Güncelle</span>
                <span className="text-caption text-[var(--on-surface-variant)]">Güvenlik ayarlarını yönetin</span>
              </div>
            </button>
          </div>
        </div>

        {/* Health Data */}
        <div>
          <h3 className="text-subtitle mb-4 px-2">Kişisel Bilgiler</h3>
          <div className="flex flex-col gap-2">
            <button onClick={() => setActiveSheet('weight')} className="flex items-center gap-4 glass-item px-5 py-4 hover:bg-[rgba(255,255,255,0.08)] transition-colors text-left group">
              <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#4ade80] group-hover:scale-110 transition-transform">
                <Scale size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-body font-medium text-white">Kilo Bilgisi</span>
                <span className="text-caption text-[var(--on-surface-variant)]">Güncel kilonuzu değiştirin</span>
              </div>
            </button>
            <button onClick={() => setActiveSheet('age')} className="flex items-center gap-4 glass-item px-5 py-4 hover:bg-[rgba(255,255,255,0.08)] transition-colors text-left group">
              <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                <CalendarDays size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-body font-medium text-white">Yaş Bilgisi</span>
                <span className="text-caption text-[var(--on-surface-variant)]">Hedefler için gerekli</span>
              </div>
            </button>
          </div>
        </div>

        {/* Global Management */}
        <div>
          <h3 className="text-subtitle mb-4 px-2">Finans Yönetimi</h3>
          <div className="flex flex-col gap-2">
            <button onClick={() => setActiveSheet('manageAccounts')} className="flex items-center gap-4 glass-item px-5 py-4 hover:bg-[rgba(255,255,255,0.08)] transition-colors text-left group">
              <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform">
                <Wallet size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-body font-medium text-white">Hesap Yönetimi</span>
                <span className="text-caption text-[var(--on-surface-variant)]">Banka ve nakit ayarları</span>
              </div>
            </button>
            <button onClick={() => setActiveSheet('subscriptions')} className="flex items-center gap-4 glass-item px-5 py-4 hover:bg-[rgba(255,255,255,0.08)] transition-colors text-left group">
              <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#4ade80] group-hover:scale-110 transition-transform">
                <CalendarCheck size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-body font-medium text-white">Abonelik Yönetimi</span>
                <span className="text-caption text-[var(--on-surface-variant)]">Aylık kesintiler</span>
              </div>
            </button>
            <button onClick={() => setActiveSheet('debts')} className="flex items-center gap-4 glass-item px-5 py-4 hover:bg-[rgba(255,255,255,0.08)] transition-colors text-left group">
              <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                <Receipt size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-body font-medium text-white">Borç Yönetimi</span>
                <span className="text-caption text-[var(--on-surface-variant)]">Verecek/Alacak listesi</span>
              </div>
            </button>
          </div>
        </div>

        {/* About App */}
        <div className="mt-8">
          <div className="p-5 rounded-3xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] flex items-start gap-4">
            <div className="w-8 h-8 shrink-0 rounded-full bg-[rgba(96,165,250,0.1)] flex items-center justify-center text-blue-400 mt-1">
              <Info size={16} />
            </div>
            <div className="flex flex-col">
              <h4 className="text-body font-bold text-white mb-2">Uygulama Hakkında</h4>
              <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed">
                Bu uygulama, günlük finansal ve sağlık verilerinizi bir araya getiren premium bir yönetim aracıdır. 
                <br /><br />
                <strong>Önemli Not:</strong> Yemek arama işlemlerinde kullanılan FatSecret altyapısının ücretsiz versiyonu yalnızca <strong>İngilizce</strong> destek sunmaktadır. Lütfen yemekleri İngilizce isimleriyle (örn: <em>"chicken breast", "boiled egg"</em>) aratınız.
              </p>
            </div>
          </div>
        </div>

      </main>

      <BottomSheet isOpen={!!activeSheet} onClose={() => setActiveSheet(null)} title={getSheetTitle()}>
        {renderSheetContent()}
      </BottomSheet>
    </div>
  );
}
