import type { Metadata } from "next";
import "./globals.css";

import type { Viewport } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | DailyM",
    default: "DailyM - Kişisel Yönetim Asistanınız",
  },
  description: "Kişisel hedeflerinizi, finansınızı ve sağlığınızı tek bir yerden yönetin.",
  icons: {
    icon: [
      { url: "/assets/logo.svg", type: "image/svg+xml" },
      { url: "/assets/logo.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/assets/logo.png",
    apple: [
      { url: "/assets/logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DailyM",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0c14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
      lang="tr"
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
