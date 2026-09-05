import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { buildAlternateLanguages } from "@/lib/seo-helpers";

export const metadata: Metadata = {
  title: "Gösterge Paneli | DailyM",
  description: "DailyM kişisel yönetim paneli ile günlük kalori, beslenme, BIST ve küresel borsa portföyü ve gelir-gider takibinizi yapın.",
  alternates: buildAlternateLanguages('/dashboard'),
  robots: {
    index: true,
    follow: true,
  },
};

export default async function Dashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user) {
    redirect('/');
  }

  return <DashboardView />;
}

