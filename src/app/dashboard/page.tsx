import { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "Gösterge Paneli",
};

export default function Dashboard() {
  return <DashboardView />;
}
