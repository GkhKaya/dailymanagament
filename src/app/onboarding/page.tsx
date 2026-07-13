import { getCategoriesAction } from '@/actions/finance';
import { OnboardingClient } from './OnboardingClient';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import mongoose from 'mongoose';

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  let initialAge = 25;

  if (session?.user) {
    await connectDB();
    const userDoc = await User.findById(new mongoose.Types.ObjectId(session.user.id)).lean();
    if (userDoc?.profile?.birth_date) {
      initialAge = new Date().getFullYear() - new Date(userDoc.profile.birth_date).getFullYear();
    }
  }

  const res = await getCategoriesAction();
  const initialCategories = res.success && res.categories ? res.categories : [];
  return <OnboardingClient initialCategories={initialCategories} initialAge={initialAge} />;
}
