import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { ProfileView } from '@/components/profile/ProfileView';

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !session.user) {
    redirect('/');
  }

  // Optionally fetch extra user details (e.g. from user_profiles)
  // For now, we'll pass the email and maybe a dummy profile.
  const userProfile = {
    email: session.user.email,
    id: session.user.id
  };

  return <ProfileView initialUser={userProfile} />;
}
