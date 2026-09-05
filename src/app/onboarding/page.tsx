import { Metadata } from 'next';
import { getCategoriesAction } from '@/actions/finance';

export const metadata: Metadata = {
  title: "Hesap Kurulumu | DailyM",
  robots: {
    index: false,
    follow: false,
  },
};
import { OnboardingClient } from './OnboardingClient';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import type { OnboardingStep } from '@/viewmodels/useOnboardingViewModel';

export default async function OnboardingPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = props.searchParams ? await props.searchParams : {};
  const rawStep = typeof resolvedParams.step === 'string' ? resolvedParams.step : undefined;
  const initialStep = (rawStep && ['welcome', 'residence', 'health', 'finance', 'categories', 'markets'].includes(rawStep))
    ? (rawStep as OnboardingStep)
    : undefined;

  const session = await auth.api.getSession({ headers: await headers() });
  let initialAge = 25;
  let residenceCompleted = false;
  let initialWeight = '';
  let initialHeight = '';
  let initialGender: 'Male' | 'Female' = 'Male';
  let initialBirthDate = '';

  if (session?.user) {
    await connectDB();
    // User._id is String — do NOT cast to ObjectId
    const userDoc = await User.findById(session.user.id).lean();
    if (userDoc?.profile?.birth_date) {
      initialAge = new Date().getFullYear() - new Date(userDoc.profile.birth_date).getFullYear();
      try {
        initialBirthDate = new Date(userDoc.profile.birth_date).toISOString().split('T')[0];
      } catch {}
    }
    if (userDoc?.settings?.onboarding_residence_completed) {
      residenceCompleted = true;
    }
    if (userDoc?.current_weight_kg) {
      initialWeight = userDoc.current_weight_kg.toString();
    }
    if (userDoc?.profile?.height_cm) {
      initialHeight = userDoc.profile.height_cm.toString();
    }
    if (userDoc?.profile?.gender === 'Female' || userDoc?.profile?.gender === 'Kadın') {
      initialGender = 'Female';
    }
  }

  const res = await getCategoriesAction();
  const initialCategories = res.success && res.categories ? res.categories : [];
  return (
    <OnboardingClient 
      initialCategories={initialCategories} 
      initialAge={initialAge} 
      initialResidenceCompleted={residenceCompleted} 
      initialHealthData={{
        weight: initialWeight,
        height: initialHeight,
        gender: initialGender,
        birthDate: initialBirthDate
      }}
      initialStep={initialStep}
    />
  );
}
