import { Metadata } from "next";
import { ForgotPasswordView } from "@/components/auth/ForgotPasswordView";

export const metadata: Metadata = {
  title: "Şifremi Unuttum",
};

export default function ForgotPassword() {
  return <ForgotPasswordView />;
}
