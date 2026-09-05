import toast from 'react-hot-toast';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserHealthProfileAction } from '@/actions/user';
import { calculateTargetCalories } from '@/lib/calories';
import { getLocale, isAbroad } from '@/lib/i18n';

export type OnboardingStep = 'welcome' | 'residence' | 'health' | 'finance' | 'categories' | 'markets';

export function useOnboardingViewModel(
  initialResidenceCompleted: boolean = false,
  initialHealthData?: {
    weight?: string;
    height?: string;
    gender?: 'Male' | 'Female';
    birthDate?: string;
  },
  initialStep?: OnboardingStep
) {
  const router = useRouter();
  
  // -- Step Control --
  // If initialStep is passed from server searchParams, use it directly so SSR and client match identically
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(() => {
    if (initialStep && ['welcome', 'residence', 'health', 'finance', 'categories', 'markets'].includes(initialStep)) {
      return initialStep;
    }
    return initialResidenceCompleted ? 'welcome' : 'residence';
  });
  const [isDirectHealthStep, setIsDirectHealthStep] = useState<boolean>(() => {
    return initialStep === 'health';
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const stepParam = params.get('step') as OnboardingStep;
      if (stepParam === 'health') {
        setCurrentStep('health');
        setIsDirectHealthStep(true);
      } else if (stepParam && ['welcome', 'residence', 'health', 'finance', 'categories', 'markets'].includes(stepParam)) {
        setCurrentStep(stepParam);
      }

      if (initialResidenceCompleted) {
        localStorage.setItem('dailym-residence-completed', '1');
      } else {
        localStorage.removeItem('dailym-residence-completed');
      }
    }
  }, [initialResidenceCompleted]);
  

  // -- Health Data --
  const [age, setAge] = useState<string>(() => {
    if (initialHealthData?.birthDate) {
      const bDate = new Date(initialHealthData.birthDate);
      if (!isNaN(bDate.getTime())) {
        return String(new Date().getFullYear() - bDate.getFullYear());
      }
    }
    return '';
  });
  const [birthDate, setBirthDate] = useState(initialHealthData?.birthDate || '');
  const [weight, setWeight] = useState(initialHealthData?.weight || '');
  const [height, setHeight] = useState(initialHealthData?.height || '');
  const [targetWeight, setTargetWeight] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>(initialHealthData?.gender || 'Male');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'>('sedentary');
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');

  const handleAgeChange = (val: string) => {
    setAge(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0 && num < 120) {
      const year = new Date().getFullYear() - num;
      setBirthDate(`${year}-01-01`);
    } else if (!val) {
      setBirthDate('');
    }
  };

  const handleBirthDateChange = (val: string) => {
    setBirthDate(val);
    if (val) {
      const bDate = new Date(val);
      if (!isNaN(bDate.getTime())) {
        const calculatedAge = Math.abs(new Date(Date.now() - bDate.getTime()).getUTCFullYear() - 1970);
        setAge(String(calculatedAge));
      }
    }
  };

  useEffect(() => {
    if (weight && targetWeight) {
      const w = parseFloat(weight);
      const tw = parseFloat(targetWeight);
      if (!isNaN(w) && !isNaN(tw)) {
        if (tw < w) setGoal('lose');
        else if (tw > w) setGoal('gain');
        else setGoal('maintain');
      }
    }
  }, [weight, targetWeight]);

  // -- Calculated Calories --
  const targetCalories = useMemo(() => {
    if (!weight || !height) return 0;
    let a = parseInt(age, 10);
    if (birthDate) {
      const bDate = new Date(birthDate);
      if (!isNaN(bDate.getTime())) {
        const diffMs = Date.now() - bDate.getTime();
        a = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
      }
    }
    if (!a || isNaN(a) || a <= 0) a = 25;

    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (isNaN(w) || isNaN(h)) return 0;

    return calculateTargetCalories(w, h, a, gender, activityLevel, goal);
  }, [weight, height, birthDate, age, gender, activityLevel, goal]);

  // -- Actions --
  const skipToDashboard = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dailym-product-tour-completed');
    }
    router.push('/dashboard');
  };

  const startOnboarding = () => {
    setCurrentStep('residence');
  };

  const saveHealthAndContinue = async () => {
    const isEn = isAbroad() || getLocale() === 'en';
    if (!weight || !height) {
      toast.error(isEn ? "Please enter your height and weight." : "Lütfen boy ve kilo bilgilerinizi eksiksiz girin.");
      return;
    }
    if (!age && !birthDate) {
      toast.error(isEn ? "Please enter your age or birth date." : "Lütfen yaşınızı veya doğum tarihinizi girin.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      let finalAge = parseInt(age, 10);
      let birthDateStr = birthDate;
      if (birthDate) {
        const bDate = new Date(birthDate);
        if (!isNaN(bDate.getTime())) {
          const diffMs = Date.now() - bDate.getTime();
          finalAge = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
        }
      } else if (finalAge && finalAge > 0) {
        const year = new Date().getFullYear() - finalAge;
        birthDateStr = `${year}-01-01`;
      }

      if (!finalAge || isNaN(finalAge)) finalAge = 25;
      if (!birthDateStr) {
        const year = new Date().getFullYear() - finalAge;
        birthDateStr = `${year}-01-01`;
      }

      const res = await updateUserHealthProfileAction({
        age: finalAge,
        weight: parseFloat(weight),
        height: parseFloat(height),
        gender,
        activity_level: activityLevel,
        goal,
        targetCalories,
        birthDate: birthDateStr,
        targetWeight: targetWeight ? parseFloat(targetWeight) : undefined
      });

      if (res.success) {
        if (isDirectHealthStep || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('step') === 'health')) {
          toast.success(isEn ? "Health profile updated successfully! BMR is now active." : "Sağlık bilgileriniz başarıyla kaydedildi! BMR hesaplamanız aktif edildi.");
          router.push('/dashboard');
          return;
        }
        setCurrentStep('finance');
      } else {
        toast.error(res.error || (isEn ? "An error occurred while saving health profile." : "Sağlık bilgileri kaydedilirken hata oluştu."));
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const skipHealth = () => {
    if (isDirectHealthStep) {
      router.push('/dashboard');
    } else {
      setCurrentStep('finance');
    }
  };

  const skipFinance = () => {
    setCurrentStep('categories');
  };

  const finishOnboarding = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dailym-product-tour-completed');
    }
    router.push('/dashboard');
  };

  return {
    currentStep,
    setCurrentStep,
    isDirectHealthStep,
    isLoading,
    
    // Health State
    age, setAge,
    handleAgeChange,
    handleBirthDateChange,
    birthDate, setBirthDate,
    weight, setWeight,
    height, setHeight,
    targetWeight, setTargetWeight,
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
