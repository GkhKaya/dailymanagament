import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LoginView } from "@/components/auth/LoginView";
import { buildAlternateLanguages, getBaseUrl, getWebsiteAndSoftwareJsonLd } from "@/lib/seo-helpers";
import type { Locale } from "@/lib/i18n";

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function resolveLocale(searchParamsPromise?: Promise<{ [key: string]: string | string[] | undefined }>): Promise<Locale> {
  const searchParams = searchParamsPromise ? await searchParamsPromise : {};
  const langParam = typeof searchParams.lang === 'string' ? searchParams.lang : undefined;
  if (langParam === 'en' || langParam === 'tr') return langParam;

  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
    if (cookieLocale === 'en' || cookieLocale === 'tr') return cookieLocale;
  } catch {}

  return 'tr';
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const locale = await resolveLocale(props.searchParams);
  const baseUrl = getBaseUrl();
  const alternates = buildAlternateLanguages('/');

  if (locale === 'en') {
    return {
      title: {
        absolute: "DailyM - Personal Management Assistant | Finance, Health & Stocks",
      },
      description: "Track daily calories, macros, nutrition, manage multi-market stock portfolios (BIST, US, Crypto), control your budget, and achieve your goals with AI voice assistance.",
      alternates,
      openGraph: {
        title: "DailyM - Personal Management Assistant | Finance, Health & Stocks",
        description: "Track daily calories, macros, nutrition, manage multi-market stock portfolios (BIST, US, Crypto), control your budget, and achieve your goals with AI voice assistance.",
        url: baseUrl,
        locale: "en_US",
        alternateLocale: ["tr_TR"],
      },
    };
  }

  return {
    title: {
      absolute: "DailyM - Kişisel Yönetim Asistanınız | Finans, Sağlık & Borsa",
    },
    description: "Günlük kalori, beslenme ve makro takibi, BIST ve küresel borsa portföy yönetimi, gelir-gider bütçe kontrolü ve yapay zeka sesli asistanı tek uygulamada.",
    alternates,
    openGraph: {
      title: "DailyM - Kişisel Yönetim Asistanınız | Finans, Sağlık & Borsa",
      description: "Günlük kalori, beslenme ve makro takibi, BIST ve küresel borsa portföy yönetimi, gelir-gider bütçe kontrolü ve yapay zeka sesli asistanı tek uygulamada.",
      url: baseUrl,
      locale: "tr_TR",
      alternateLocale: ["en_US"],
    },
  };
}

export default async function Home(props: PageProps) {
  const locale = await resolveLocale(props.searchParams);
  const jsonLd = getWebsiteAndSoftwareJsonLd(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <LoginView />
    </>
  );
}
