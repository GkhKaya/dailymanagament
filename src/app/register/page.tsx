import type { Metadata } from "next";
import { cookies } from "next/headers";
import { RegisterView } from "@/components/auth/RegisterView";
import { buildAlternateLanguages, getBaseUrl, getBreadcrumbJsonLd } from "@/lib/seo-helpers";
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
  const alternates = buildAlternateLanguages('/register');

  if (locale === 'en') {
    return {
      title: {
        absolute: "Create Free Account | DailyM - Personal Finance & Health Assistant",
      },
      description: "Sign up for a free DailyM account; start managing calories, macros, multi-market stock portfolios, and your budget from a single dashboard.",
      alternates,
      openGraph: {
        title: "Create Free Account | DailyM - Personal Finance & Health Assistant",
        description: "Sign up for a free DailyM account; start managing calories, macros, multi-market stock portfolios, and your budget from a single dashboard.",
        url: `${baseUrl}/register`,
        locale: "en_US",
        alternateLocale: ["tr_TR"],
      },
    };
  }

  return {
    title: {
      absolute: "Ücretsiz Hesap Oluştur | DailyM - Finans, Sağlık & Borsa",
    },
    description: "Hemen ücretsiz DailyM hesabı açın; kalori takibi, makro hesaplama, borsa portföyü ve kişisel bütçenizi tek ekrandan yönetmeye başlayın.",
    alternates,
    openGraph: {
      title: "Ücretsiz Hesap Oluştur | DailyM - Finans, Sağlık & Borsa",
      description: "Hemen ücretsiz DailyM hesabı açın; kalori takibi, makro hesaplama, borsa portföyü ve kişisel bütçenizi tek ekrandan yönetmeye başlayın.",
      url: `${baseUrl}/register`,
      locale: "tr_TR",
      alternateLocale: ["en_US"],
    },
  };
}

export default async function Register(props: PageProps) {
  const locale = await resolveLocale(props.searchParams);
  const breadcrumbs = getBreadcrumbJsonLd([
    { name: locale === 'en' ? 'Home' : 'Ana Sayfa', url: '/' },
    { name: locale === 'en' ? 'Register' : 'Kayıt Ol', url: '/register' },
  ]);

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: locale === 'en' ? "Create Free Account | DailyM" : "Ücretsiz Hesap Oluştur | DailyM",
    description: locale === 'en'
      ? "Sign up for a free DailyM account; start managing calories, macros, and investments."
      : "Hemen ücretsiz DailyM hesabı açın; kalori ve finans yönetimini tek ekrandan yapın.",
    breadcrumb: breadcrumbs,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([breadcrumbs, webPageSchema]).replace(/</g, '\\u003c'),
        }}
      />
      <RegisterView />
    </>
  );
}
