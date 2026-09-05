"use client";

import React from 'react';
import { useOnboardingViewModel, OnboardingStep } from '@/viewmodels/useOnboardingViewModel';
import { OnboardingWelcome } from '@/components/onboarding/OnboardingWelcome';
import { OnboardingResidence } from '@/components/onboarding/OnboardingResidence';
import { OnboardingHealth } from '@/components/onboarding/OnboardingHealth';
import { OnboardingFinance } from '@/components/onboarding/OnboardingFinance';
import { OnboardingMarkets } from '@/components/onboarding/OnboardingMarkets';

export function OnboardingClient({ 
  initialCategories, 
  initialAge = 25,
  initialResidenceCompleted = false,
  initialHealthData,
  initialStep
}: { 
  initialCategories: any[]; 
  initialAge?: number;
  initialResidenceCompleted?: boolean;
  initialHealthData?: {
    weight?: string;
    height?: string;
    gender?: 'Male' | 'Female';
    birthDate?: string;
  };
  initialStep?: OnboardingStep;
}) {
  const viewModel = useOnboardingViewModel(initialResidenceCompleted, initialHealthData, initialStep);
  
  return (
    <div className="min-h-screen bg-[var(--background)] relative overflow-x-hidden flex flex-col">
      {/* Progress bar (Fixed at top) */}
      <div className="h-1 w-full bg-white/5 sticky top-0 z-20">
        <div 
          className="h-full bg-[var(--primary)] transition-all duration-500 ease-out"
          style={{ 
            width: viewModel.currentStep === 'welcome' ? '0%' : 
                   viewModel.currentStep === 'residence' ? '20%' : 
                   viewModel.currentStep === 'health' ? '40%' : 
                   viewModel.currentStep === 'finance' || viewModel.currentStep === 'categories' ? '65%' : 
                   viewModel.currentStep === 'markets' ? '85%' : '100%' 
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

        {viewModel.currentStep === 'residence' && (
          <OnboardingResidence 
            onNext={() => viewModel.setCurrentStep('health')} 
            onSkip={viewModel.skipToDashboard} 
          />
        )}
        
        {viewModel.currentStep === 'health' && (
          <OnboardingHealth viewModel={viewModel} />
        )}

        {(viewModel.currentStep === 'finance' || viewModel.currentStep === 'categories') && (
          <OnboardingFinance viewModel={viewModel} initialCategories={initialCategories} />
        )}

        {viewModel.currentStep === 'markets' && (
          <OnboardingMarkets 
            onComplete={viewModel.finishOnboarding} 
            onSkip={viewModel.finishOnboarding} 
          />
        )}
      </div>
    </div>
  );
}
