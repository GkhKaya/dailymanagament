import { Metadata } from "next";
import { LoginView } from "@/components/auth/LoginView";

export const metadata: Metadata = {
  title: "DailyM - Kişisel Yönetim Asistanınız",
};

export default function Home() {
  return <LoginView />;
}
