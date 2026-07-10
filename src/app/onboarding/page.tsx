import { getCategoriesAction } from '@/actions/finance';
import { OnboardingClient } from './OnboardingClient';

export default async function OnboardingPage() {
  const res = await getCategoriesAction();
  const initialCategories = res.success && res.categories ? res.categories : [];
  return <OnboardingClient initialCategories={initialCategories} />;
}
