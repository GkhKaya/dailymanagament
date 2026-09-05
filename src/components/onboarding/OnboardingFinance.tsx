"use client";

import React, { useState } from 'react';
import { ArrowRight, SkipForward, Wallet } from 'lucide-react';
import { AddAccountForm } from '../forms/AddAccountForm';
import { ManageSubscriptionsForm } from '../forms/ManageSubscriptionsForm';
import { ManageDebtsForm } from '../forms/ManageDebtsForm';
import { ManageCategoriesForm } from '../forms/ManageCategoriesForm';
import { getCategoriesAction } from '@/actions/finance';
import { getFinanceDataAction } from '@/actions/dashboard';
import { useTranslation } from '@/hooks/useTranslation';

export function OnboardingFinance({ viewModel, initialCategories = [] }: { viewModel: ReturnType<typeof import("@/viewmodels/useOnboardingViewModel").useOnboardingViewModel>, initialCategories?: { id: string, name: string, type: string, icon: string }[] }) {
  const { finishOnboarding } = viewModel;
  const { locale, isAbroad: userAbroad } = useTranslation();
  const isEn = userAbroad || locale === 'en';
  
  // Local step for finance
  const [financeStep, setFinanceStep] = useState<'account' | 'debt' | 'category'>('account');
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [isLoadingCategories] = useState(false);
  const [createdAccounts, setCreatedAccounts] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);

  const handleFinanceSuccess = async () => {
    const res = await getFinanceDataAction();
    if (res.success && res.data) {
      setSubscriptions(res.data.subscriptions || []);
      setDebts(res.data.debts || []);
    }
  };

  const handleNext = () => {
    if (financeStep === 'account') setFinanceStep('debt');
    else if (financeStep === 'debt') setFinanceStep('category');
    else viewModel.setCurrentStep('markets');
  };

  const handleCategorySuccess = async () => {
    const res = await getCategoriesAction();
    if (res.success && res.categories) setCategories(res.categories);
  };

  return (
    <div className="flex flex-col animate-slide-up w-full max-w-2xl mx-auto py-8 px-4 h-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center">
          <Wallet size={24} />
        </div>
        <div>
          <h2 suppressHydrationWarning className="text-2xl font-bold text-white">
            {financeStep === 'account' 
              ? (isEn ? 'Add Your Accounts' : 'Hesaplarınızı Ekleyin')
              : financeStep === 'debt' 
                ? (isEn ? 'Subscriptions & Debts' : 'Abonelik ve Borçlar')
                : (isEn ? 'Categories' : 'Kategoriler')}
          </h2>
          <p suppressHydrationWarning className="text-sm text-[var(--on-surface-variant)]">
            {isEn ? "Let's configure your financial profile." : 'Finansal durumunuzu şekillendirelim.'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar mb-8">
        {financeStep === 'account' && (
          <div className="flex flex-col gap-6">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
              <p className="text-sm text-[var(--on-surface-variant)] mb-6">
                {isEn 
                  ? 'Start by adding your salary account, cash wallet, or credit card.'
                  : 'Maaş hesabınızı, nakit cüzdanınızı veya kredi kartınızı ekleyerek başlayın.'}
              </p>
              <AddAccountForm 
                onClose={() => {}} 
                onSuccess={(id, name) => {
                  setCreatedAccounts(prev => [...prev, { id: id || Date.now().toString(), name: name || (isEn ? "New Account" : "Yeni Hesap"), type: "bank" }]);
                }} 
              />
            </div>
            
            {createdAccounts.length > 0 && (
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">
                  {isEn ? 'Added Accounts' : 'Eklenen Hesaplar'}
                </h3>
                <div className="flex flex-col gap-3">
                  {createdAccounts.map((acc, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <Wallet size={18} className="text-[var(--primary)]" />
                      <span className="text-body text-white font-medium">
                        {acc.name} {isEn ? 'added' : 'eklendi'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {financeStep === 'debt' && (
          <div className="flex flex-col gap-8">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">
                {isEn ? 'Add Subscription' : 'Abonelik Ekle'}
              </h3>
              <ManageSubscriptionsForm onClose={() => {}} onSuccess={handleFinanceSuccess} subscriptions={subscriptions} categories={categories} accounts={createdAccounts} />
            </div>
            
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">
                {isEn ? 'Add Debt / Receivable' : 'Borç Ekle'}
              </h3>
              <ManageDebtsForm onClose={() => {}} onSuccess={handleFinanceSuccess} debts={debts} />
            </div>
          </div>
        )}

        {financeStep === 'category' && (
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <p className="text-sm text-[var(--on-surface-variant)] mb-6">
              {isEn 
                ? 'In addition to default categories, you can create your custom categories.'
                : 'Varsayılan kategorilerimize ek olarak kendi özel kategorilerinizi oluşturabilirsiniz.'}
            </p>
            <ManageCategoriesForm onClose={() => {}} onSuccess={handleCategorySuccess} categories={categories} isLoadingCategories={isLoadingCategories} />
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-auto pt-4 border-t border-white/10">
        <button 
          type="button"
          onClick={handleNext}
          className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <SkipForward size={18} />
          <span>{isEn ? 'Skip' : 'Atla'}</span>
        </button>
        <button 
          type="button"
          onClick={handleNext}
          className="flex-1 py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>
            {financeStep === 'category' 
              ? (isEn ? 'Next: Markets' : 'Sonraki: Piyasalar') 
              : (isEn ? 'Next Step' : 'Sonraki Adım')}
          </span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
