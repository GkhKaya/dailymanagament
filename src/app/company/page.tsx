import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getCompanyWorkspaceAction } from '@/actions/company';
import { CompanyWorkspace } from '@/components/company/CompanyWorkspace';

export const metadata: Metadata = { title: 'Şirketim | DailyM', robots: { index: false, follow: false } };

export default async function CompanyPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/');
  const result = await getCompanyWorkspaceAction();
  return <CompanyWorkspace initialData={result.success ? result.data : null} initialError={result.success ? null : result.error} />;
}
