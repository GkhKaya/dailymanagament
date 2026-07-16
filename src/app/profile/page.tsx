import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { ProfileView } from '@/components/profile/ProfileView';
import { getFinanceDataAction } from '@/actions/dashboard';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import mongoose from 'mongoose';

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !session.user) {
    redirect('/');
  }

  // Fetch full user profile
  await connectDB();
  const userId = session.user.id;
  const userDoc = await User.findById(userId).lean();

  let age = 0;
  if (userDoc?.profile?.birth_date) {
    const diffMs = Date.now() - new Date(userDoc.profile.birth_date).getTime();
    age = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
  }

  const userProfile = {
    name: session.user.name || '',
    email: session.user.email || '',
    current_weight_kg: userDoc?.current_weight_kg || 0,
    target_weight_kg: userDoc?.target_weight_kg || 0,
    height_cm: userDoc?.profile?.height_cm || 0,
    age
  };

  // Fetch Finance Data
  const financeRes = await getFinanceDataAction();
  const financeData = financeRes.success ? financeRes.data : null;

  return <ProfileView initialUser={userProfile} financeData={financeData} />;
}
