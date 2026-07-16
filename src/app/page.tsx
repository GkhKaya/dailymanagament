import { Metadata } from "next";
import { LoginView } from "@/components/auth/LoginView";

export const metadata: Metadata = {
  title: "Giriş Yap",
};

export default function Home() {
  return <LoginView />;
}
