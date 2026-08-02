import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "Uygulama Hakkında",
};

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { AboutView } from '@/components/profile/AboutView';
import { getFoodDatabaseAction } from '@/actions/health';

export default async function AboutPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !session.user) {
    redirect('/');
  }

  // Fetch food database to display in modal
  const foodsRes = await getFoodDatabaseAction();
  const foods = foodsRes.success ? foodsRes.foods : [];

  return <AboutView foods={foods} />;
}
