import React, { useState, useEffect } from 'react';
import { ArrowRight, SkipForward, Wallet } from 'lucide-react';
import { AddAccountForm } from '../forms/AddAccountForm';
import { ManageSubscriptionsForm } from '../forms/ManageSubscriptionsForm';
import { ManageDebtsForm } from '../forms/ManageDebtsForm';
import { ManageCategoriesForm } from '../forms/ManageCategoriesForm';
import { getCategoriesAction } from '@/actions/finance';

export function OnboardingFinance({ viewModel, initialCategories = [] }: { viewModel: any, initialCategories?: any[] }) {
  const { skipFinance, finishOnboarding } = viewModel;
  
  // Local step for finance
  const [financeStep, setFinanceStep] = useState<'account' | 'debt' | 'category'>('account');
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [createdAccounts, setCreatedAccounts] = useState<any[]>([]);

  const handleNext = () => {
    if (financeStep === 'account') setFinanceStep('debt');
    else if (financeStep === 'debt') setFinanceStep('category');
    else finishOnboarding();
  };

  // Re-fetch when transitioning to the category step just in case user added custom categories 
  // Wait, user adds custom categories inside ManageCategoriesForm, and that form refreshes via onSuccess.
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
          <h2 className="text-2xl font-bold text-white">
            {financeStep === 'account' ? 'Hesaplarınızı Ekleyin' : 
             financeStep === 'debt' ? 'Abonelik ve Borçlar' : 
             'Kategoriler'}
          </h2>
          <p className="text-sm text-[var(--on-surface-variant)]">Finansal durumunuzu şekillendirelim.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar mb-8">
        {financeStep === 'account' && (
          <div className="flex flex-col gap-6">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
              <p className="text-sm text-[var(--on-surface-variant)] mb-6">Maaş hesabınızı, nakit cüzdanınızı veya kredi kartınızı ekleyerek başlayın.</p>
              <AddAccountForm 
                onClose={() => {}} 
                onSuccess={(name) => {
                  setCreatedAccounts(prev => [...prev, { id: Date.now().toString(), name: name || "Yeni Hesap", type: "bank" }]);
                }} 
              />
            </div>
            
            {createdAccounts.length > 0 && (
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Eklenen Hesaplar</h3>
                <div className="flex flex-col gap-3">
                  {createdAccounts.map((acc, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <Wallet size={18} className="text-[var(--primary)]" />
                      <span className="text-body text-white font-medium">{acc.name} eklendi</span>
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
              <h3 className="text-lg font-bold text-white mb-4">Abonelik Ekle</h3>
              <ManageSubscriptionsForm onClose={() => {}} onSuccess={() => {}} subscriptions={[]} categories={categories} accounts={[]} />
            </div>
            
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Borç / Alacak Ekle</h3>
              <ManageDebtsForm onClose={() => {}} onSuccess={() => {}} debts={[]} />
            </div>
          </div>
        )}

        {financeStep === 'category' && (
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <p className="text-sm text-[var(--on-surface-variant)] mb-6">Varsayılan kategorilerimize ek olarak kendi özel kategorilerinizi oluşturabilirsiniz.</p>
            <ManageCategoriesForm onClose={() => {}} onSuccess={handleCategorySuccess} categories={categories} isLoadingCategories={isLoadingCategories} />
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-auto pt-4 border-t border-white/10">
        <button 
          onClick={handleNext}
          className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors flex items-center justify-center gap-2"
        >
          <SkipForward size={18} />
          <span>Atla</span>
        </button>
        <button 
          onClick={handleNext}
          className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold transition-colors flex items-center justify-center gap-2"
        >
          <span>{financeStep === 'category' ? 'Kurulumu Tamamla' : 'Sonraki Adım'}</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
