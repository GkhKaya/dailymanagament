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
  const userId = new mongoose.Types.ObjectId(session.user.id);
  const userDoc = await User.findById(userId).lean();

  const userProfile = {
    email: session.user.email,
    id: session.user.id,
    weight: userDoc?.current_weight_kg || userDoc?.weight || 0,
    age: userDoc?.age || 0,
    birth_date: userDoc?.profile?.birth_date || null
  };

  // Fetch Finance Data
  const financeRes = await getFinanceDataAction();
  const financeData = financeRes.success ? financeRes.data : null;

  return <ProfileView initialUser={userProfile} financeData={financeData} />;
}
