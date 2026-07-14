import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserHealthProfileAction } from '@/actions/user';
import { calculateTargetCalories } from '@/lib/calories';

export type OnboardingStep = 'welcome' | 'health' | 'finance' | 'categories';

export function useOnboardingViewModel(initialAge: number = 25) {
  const router = useRouter();
  
  // -- Step Control --
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -- Health Data --
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'>('sedentary');
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');

  // -- Calculated Calories --
  const targetCalories = useMemo(() => {
    if (!weight || !height) return 0;
    const a = initialAge; // Using real age from DB or 25 fallback
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (isNaN(w) || isNaN(h)) return 0;

    return calculateTargetCalories(w, h, a, gender, activityLevel, goal);
  }, [weight, height, gender, activityLevel, goal, initialAge]);

  // -- Actions --
  const skipToDashboard = () => {
    router.push('/dashboard');
  };

  const startOnboarding = () => {
    setCurrentStep('health');
  };

  const saveHealthAndContinue = async () => {
    if (!weight || !height) {
      setError("Lütfen boy ve kilo bilgilerinizi eksiksiz girin.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await updateUserHealthProfileAction({
        age: initialAge, 
        weight: parseFloat(weight),
        height: parseFloat(height),
        gender,
        activity_level: activityLevel,
        goal,
        targetCalories
      });

      if (res.success) {
        setCurrentStep('finance');
      } else {
        setError(res.error || "Sağlık bilgileri kaydedilirken hata oluştu.");
      }
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const skipHealth = () => {
    setCurrentStep('finance');
  };

  const skipFinance = () => {
    setCurrentStep('categories');
  };

  const finishOnboarding = () => {
    router.push('/dashboard');
  };

  return {
    currentStep,
    setCurrentStep,
    isLoading,
    error,
    
    // Health State
    weight, setWeight,
    height, setHeight,
    gender, setGender,
    activityLevel, setActivityLevel,
    goal, setGoal,
    targetCalories,

    // Flow Actions
    skipToDashboard,
    startOnboarding,
    skipHealth,
    saveHealthAndContinue,
    skipFinance,
    finishOnboarding
  };
}
