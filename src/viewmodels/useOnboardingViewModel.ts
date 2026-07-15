import toast from 'react-hot-toast';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserHealthProfileAction } from '@/actions/user';
import { calculateTargetCalories } from '@/lib/calories';

export type OnboardingStep = 'welcome' | 'health' | 'finance' | 'categories';

export function useOnboardingViewModel() {
  const router = useRouter();
  
  // -- Step Control --
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  

  // -- Health Data --
  const [birthDate, setBirthDate] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'>('sedentary');
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');

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
    if (!weight || !height || !birthDate) return 0;
    const bDate = new Date(birthDate);
    let a = 25; // default
    if (!isNaN(bDate.getTime())) {
      const diffMs = Date.now() - bDate.getTime();
      const ageDt = new Date(diffMs);
      a = Math.abs(ageDt.getUTCFullYear() - 1970);
    }
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (isNaN(w) || isNaN(h)) return 0;

    return calculateTargetCalories(w, h, a, gender, activityLevel, goal);
  }, [weight, height, birthDate, gender, activityLevel, goal]);

  // -- Actions --
  const skipToDashboard = () => {
    router.push('/dashboard');
  };

  const startOnboarding = () => {
    setCurrentStep('health');
  };

  const saveHealthAndContinue = async () => {
    if (!weight || !height) {
      toast.error("Lütfen boy ve kilo bilgilerinizi eksiksiz girin.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const bDate = new Date(birthDate);
      let a = 25;
      if (!isNaN(bDate.getTime())) {
        const diffMs = Date.now() - bDate.getTime();
        a = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
      }

      const res = await updateUserHealthProfileAction({
        age: a,
        weight: parseFloat(weight),
        height: parseFloat(height),
        gender,
        activity_level: activityLevel,
        goal,
        targetCalories,
        birthDate,
        targetWeight: targetWeight ? parseFloat(targetWeight) : undefined
      });

      if (res.success) {
        setCurrentStep('finance');
      } else {
        toast.error(res.error || "Sağlık bilgileri kaydedilirken hata oluştu.");
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message);
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
    
    // Health State
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
