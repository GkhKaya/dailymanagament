import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ForgotPasswordView } from "@/components/auth/ForgotPasswordView";
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
  const alternates = buildAlternateLanguages('/forgot-password');

  if (locale === 'en') {
    return {
      title: "Forgot Password",
      description: "Securely reset your DailyM account password and regain immediate access to your data.",
      alternates,
      openGraph: {
        title: "Forgot Password | DailyM",
        description: "Securely reset your DailyM account password and regain immediate access to your data.",
        url: `${baseUrl}/forgot-password`,
        locale: "en_US",
        alternateLocale: ["tr_TR"],
      },
    };
  }

  return {
    title: "Şifremi Unuttum",
    description: "DailyM hesabınızın şifresini güvenle sıfırlayın ve kişisel hedeflerinize kaldığınız yerden devam edin.",
    alternates,
    openGraph: {
      title: "Şifremi Unuttum | DailyM",
      description: "DailyM hesabınızın şifresini güvenle sıfırlayın ve kişisel hedeflerinize kaldığınız yerden devam edin.",
      url: `${baseUrl}/forgot-password`,
      locale: "tr_TR",
      alternateLocale: ["en_US"],
    },
  };
}

export default async function ForgotPassword(props: PageProps) {
  const locale = await resolveLocale(props.searchParams);
  const breadcrumbs = getBreadcrumbJsonLd([
    { name: locale === 'en' ? 'Home' : 'Ana Sayfa', url: '/' },
    { name: locale === 'en' ? 'Forgot Password' : 'Şifremi Unuttum', url: '/forgot-password' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbs).replace(/</g, '\\u003c'),
        }}
      />
      <ForgotPasswordView />
    </>
  );
}
