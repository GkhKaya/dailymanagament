import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserHealthProfileAction } from '@/actions/user';

export type OnboardingStep = 'welcome' | 'health' | 'finance' | 'categories';

export function useOnboardingViewModel() {
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
    const a = 25; // Default/Assumed age since user says we have it
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (isNaN(w) || isNaN(h)) return 0;

    // Mifflin-St Jeor Equation
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr += gender === 'Male' ? 5 : -161;

    // Activity Multiplier
    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    let tdee = bmr * multipliers[activityLevel];

    // Goal adjustment
    if (goal === 'lose') tdee -= 500;
    if (goal === 'gain') tdee += 500;

    return Math.max(1200, Math.round(tdee)); // Min 1200 kalori
  }, [weight, height, gender, activityLevel, goal]);

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
        age: 25, // Fallback/assumed age
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
    } catch (err: any) {
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
