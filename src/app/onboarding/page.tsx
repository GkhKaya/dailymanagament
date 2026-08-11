import { Metadata } from 'next';
import { getCategoriesAction } from '@/actions/finance';

export const metadata: Metadata = {
  title: "Kurulum",
};
import { OnboardingClient } from './OnboardingClient';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  let initialAge = 25;

  if (session?.user) {
    await connectDB();
    // User._id is String — do NOT cast to ObjectId
    const userDoc = await User.findById(session.user.id).lean();
    if (userDoc?.profile?.birth_date) {
      initialAge = new Date().getFullYear() - new Date(userDoc.profile.birth_date).getFullYear();
    }
  }

  const res = await getCategoriesAction();
  const initialCategories = res.success && res.categories ? res.categories : [];
  return <OnboardingClient initialCategories={initialCategories} initialAge={initialAge} />;
}
