import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | TheGamePlan",
    default: "TheGamePlan - Kişisel Yönetim Asistanınız",
  },
  description: "Kişisel hedeflerinizi, finansınızı ve sağlığınızı tek bir yerden yönetin.",
};

import { Toaster } from 'react-hot-toast';

import { Inter, Bricolage_Grotesque } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${inter.variable} ${bricolage.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
