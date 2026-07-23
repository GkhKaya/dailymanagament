import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    template: "%s | DailyM",
    default: "DailyM - Kişisel Yönetim Asistanınız",
  },
  description: "Kişisel hedeflerinizi, finansınızı ve sağlığınızı tek bir yerden yönetin.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DailyM",
  },
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
