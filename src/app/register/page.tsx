import { Metadata } from "next";
import { RegisterView } from "@/components/auth/RegisterView";

export const metadata: Metadata = {
  title: "Kayıt Ol",
};

export default function Register() {
  return <RegisterView />;
}
