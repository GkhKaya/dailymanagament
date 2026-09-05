import type { Metadata } from "next";
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

export default function Dashboard() {
  return <DashboardView />;
}
