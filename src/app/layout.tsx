import type { Metadata } from "next";
import "./globals.css";

import type { Viewport } from "next";

import { getBaseUrl } from "@/lib/seo-helpers";

const siteUrl = getBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: "%s | DailyM",
    default: "DailyM - Akıllı Kişisel Yönetim, Kalori, Finans & Borsa Asistanı",
  },
  description: "DailyM ile günlük kalori ve beslenme takibi yapın, borsa portföyünüzü (BIST, ABD, Kripto) canlı yönetin, bütçenizi kontrol edin ve yapay zeka sesli asistanı ile hedeflerinize ulaşın.",
  keywords: [
    "DailyM",
    "kişisel yönetim",
    "kalori takip",
    "kalori sayacı",
    "makro besin hesaplama",
    "sağlık takibi",
    "borsa takip",
    "bist hisse takip",
    "portföy yönetimi",
    "gelir gider takip",
    "bütçe planlama",
    "yapay zeka besin kaydı",
    "sesli asistan",
    "pwa sağlık",
    "calorie tracker",
    "macro tracker",
    "nutrition diary",
    "personal finance tracker",
    "stock portfolio manager",
    "budget planner",
    "ai voice assistant"
  ],
  authors: [{ name: "DailyM Team" }],
  creator: "DailyM",
  publisher: "DailyM",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      "tr-TR": "/?lang=tr",
      "en-US": "/?lang=en",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    alternateLocale: ["en_US"],
    url: siteUrl,
    title: "DailyM - Akıllı Kişisel Yönetim, Kalori, Finans & Borsa Asistanı",
    description: "Günlük kalori ve beslenme takibi, BIST ve küresel borsa portföy yönetimi, gelir-gider bütçe kontrolü ve yapay zeka sesli asistanı tek uygulamada.",
    siteName: "DailyM",
    images: [
      {
        url: "/assets/logo.png",
        width: 512,
        height: 512,
        alt: "DailyM - Kişisel Yönetim Asistanı",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DailyM - Kişisel Yönetim Asistanı (Kalori, Finans, Borsa)",
    description: "Günlük beslenme, borsa portföyü ve bütçenizi yapay zeka sesli asistanı desteğiyle tek bir yerden yönetin.",
    images: ["/assets/logo.png"],
    creator: "@dailym",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/assets/logo.svg", type: "image/svg+xml" },
      { url: "/assets/logo.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/logo.png", sizes: "512x512", type: "image/png" },
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
  category: "lifestyle",
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

import { PwaInstallBanner } from '@/components/pwa/PwaInstallBanner';

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
          <PwaInstallBanner />
        </I18nProvider>
      </body>
    </html>
  );
}
