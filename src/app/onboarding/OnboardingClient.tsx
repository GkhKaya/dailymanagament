"use client";

import React from 'react';
import { useOnboardingViewModel } from '@/viewmodels/useOnboardingViewModel';
import { OnboardingWelcome } from '@/components/onboarding/OnboardingWelcome';
import { OnboardingHealth } from '@/components/onboarding/OnboardingHealth';
import { OnboardingFinance } from '@/components/onboarding/OnboardingFinance';

export function OnboardingClient({ initialCategories, initialAge = 25 }: { initialCategories: any[], initialAge?: number }) {
  const viewModel = useOnboardingViewModel();
  
  return (
    <div className="min-h-screen bg-[var(--background)] relative overflow-x-hidden flex flex-col">
      {/* Progress bar (Fixed at top) */}
      <div className="h-1 w-full bg-white/5 sticky top-0 z-20">
        <div 
          className="h-full bg-[var(--primary)] transition-all duration-500 ease-out"
          style={{ 
            width: viewModel.currentStep === 'welcome' ? '0%' : 
                   viewModel.currentStep === 'health' ? '33%' : 
                   viewModel.currentStep === 'finance' ? '66%' : '100%' 
          }}
        />
      </div>

      {/* Content */}
      <div className="w-full max-w-3xl mx-auto relative z-10 flex-1 flex flex-col py-8">
        {viewModel.currentStep === 'welcome' && (
          <OnboardingWelcome 
            onStart={viewModel.startOnboarding} 
            onSkip={viewModel.skipToDashboard} 
          />
        )}
        
        {viewModel.currentStep === 'health' && (
          <OnboardingHealth viewModel={viewModel} />
        )}

        {(viewModel.currentStep === 'finance' || viewModel.currentStep === 'categories') && (
          <OnboardingFinance viewModel={viewModel} initialCategories={initialCategories} />
        )}
      </div>
    </div>
  );
}
