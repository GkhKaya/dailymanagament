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
import { cookies } from 'next/headers';
import { Inter, Bricolage_Grotesque } from 'next/font/google';
import { GoogleTranslateProvider } from '@/components/providers/GoogleTranslateProvider';
import { I18nProvider } from '@/components/providers/I18nProvider';
import { setServerLocale, type Locale } from '@/lib/i18n';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage' });

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialLocale: Locale = 'tr';
  let initialIsAbroad = false;
  let initialCountry = 'TR';

  try {
    const cookieStore = await cookies();
    const loc = cookieStore.get('NEXT_LOCALE')?.value;
    if (loc === 'tr' || loc === 'en') {
      initialLocale = loc;
    }
    const abroadVal = cookieStore.get('IS_ABROAD')?.value;
    if (abroadVal === '1') {
      initialIsAbroad = true;
      if (!loc) initialLocale = 'en';
    }
    const countryVal = cookieStore.get('USER_COUNTRY')?.value;
    if (countryVal) {
      initialCountry = countryVal;
    }
  } catch {}

  setServerLocale(initialLocale, initialIsAbroad, initialCountry);

  return (
    <html
      lang={initialLocale}
      className={`h-full antialiased ${inter.variable} ${bricolage.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <I18nProvider initialLocale={initialLocale} initialIsAbroad={initialIsAbroad} initialCountry={initialCountry}>
          {children}
          <Toaster position="top-center" />
          <GoogleTranslateProvider />
        </I18nProvider>
      </body>
    </html>
  );
}
