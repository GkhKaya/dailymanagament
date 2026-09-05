import { Metadata } from "next";
import { ResetPasswordView } from "@/components/auth/ResetPasswordView";

export const metadata: Metadata = {
  title: "Şifre Sıfırlama | DailyM",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPassword() {
  return <ResetPasswordView />;
}
