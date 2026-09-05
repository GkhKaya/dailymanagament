import type { Locale } from './i18n';
import tr from '../locales/tr.json' with { type: 'json' };
import en from '../locales/en.json' with { type: 'json' };

export function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://dailym.app';
  return url.replace(/\/$/, '');
}

export function getSeoDictionary(locale: Locale) {
  return locale === 'en' ? en.seo : tr.seo;
}

export function buildAlternateLanguages(path: string) {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const prefix = cleanPath === '/' ? '/' : cleanPath;

  return {
    canonical: `${baseUrl}${prefix}`,
    languages: {
      'tr-TR': `${baseUrl}${prefix}${prefix.includes('?') ? '&' : '?'}lang=tr`,
      'en-US': `${baseUrl}${prefix}${prefix.includes('?') ? '&' : '?'}lang=en`,
      'x-default': `${baseUrl}${prefix}`,
    },
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function getFaqItems(locale: Locale): FaqItem[] {
  if (locale === 'en') {
    return [
      {
        question: "What is DailyM and how does it work?",
        answer: "DailyM is an all-in-one personal management assistant that combines calorie & macro nutrition tracking, multi-market stock portfolio monitoring (BIST, US markets, Crypto), income-expense budgeting, and AI voice assistance."
      },
      {
        question: "How do I log meals and expenses with the AI Voice Assistant?",
        answer: "Simply tap the microphone floating button and speak naturally: e.g., 'I ate 200g grilled chicken and 1 cup of rice' or 'Spent $45 on groceries'. DailyM generates an interactive preview with exact portions and nutritional macros for one-click confirmation."
      },
      {
        question: "Does DailyM support multi-market stock portfolios?",
        answer: "Yes, you can track Borsa Istanbul (BIST), US stocks (NASDAQ, NYSE), funds, and Cryptocurrencies with weighted average cost, profit/loss calculations, and real-time live quotes."
      },
      {
        question: "Can I install DailyM on my iPhone or Android device?",
        answer: "Yes! DailyM is a Progressive Web App (PWA). On iOS Safari, tap Share > 'Add to Home Screen'. On Android Chrome, tap 'Install App' for a fast, full-screen native app experience."
      },
      {
        question: "Is DailyM free to use?",
        answer: "Yes, DailyM offers free access to core calorie tracking, portfolio management, expense logging, and AI assistant capabilities."
      }
    ];
  }

  return [
    {
      question: "DailyM nedir ve ne işe yarar?",
      answer: "DailyM; günlük kalori ve makro besin takibi, BIST ve küresel borsa portföy yönetimi, gelir-gider bütçe kontrolü ve yapay zeka sesli asistan özelliklerini tek bir modern platformda birleştiren kişisel yönetim asistanıdır."
    },
    {
      question: "Sesli asistan ile besin ve harcama nasıl kaydedilir?",
      answer: "Mikrofon butonuna tıklayarak 'Öğle yemeğinde 200 gram tavuk göğsü ve 1 kase pirinç pilavı yedim' veya 'Markete 350 TL harcadım' demeniz yeterlidir. DailyM anında porsiyon ve makroları hesaplayarak onayınıza sunar."
    },
    {
      question: "DailyM'de borsa ve kripto takibi nasıl yapılır?",
      answer: "Borsa İstanbul (BIST), ABD hisse senetleri (NASDAQ, NYSE) ve Kripto paralarınızı DailyM Borsa sekmesine ekleyebilir; ağırlıklı ortalama maliyet, gerçekleşen kâr/zarar ve anlık piyasa fiyatlarını tek ekrandan izleyebilirsiniz."
    },
    {
      question: "DailyM telefona mobil uygulama olarak nasıl yüklenir?",
      answer: "DailyM modern bir PWA'dır (Progressive Web App). iPhone Safari'de Paylaş > 'Ana Ekrana Ekle' butonuna, Android Chrome'da ise 'Uygulamayı Yükle' uyarısına tıklayarak doğrudan telefonunuza tam ekran uygulama gibi yükleyebilirsiniz."
    },
    {
      question: "DailyM kullanımı ücretsiz midir?",
      answer: "Evet, DailyM'in kalori takibi, bütçe yönetimi, borsa portföy takibi ve yapay zeka asistanı özellikleri ücretsiz olarak kullanılabilir."
    }
  ];
}

export function getWebsiteAndSoftwareJsonLd(locale: Locale) {
  const baseUrl = getBaseUrl();
  const faqItems = getFaqItems(locale);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DailyM",
    alternateName: ["Daily Management", "DailyM Assistant"],
    url: baseUrl,
    inLanguage: ["tr-TR", "en-US"],
    description: locale === 'en'
      ? "Smart Personal Management, Calorie, Finance & Stock Portfolio Assistant"
      : "Akıllı Kişisel Yönetim, Kalori, Finans ve Borsa Portföy Asistanı",
    potentialAction: {
      "@type": "RegisterAction",
      target: `${baseUrl}/register`,
      name: locale === 'en' ? "Create Free Account" : "Ücretsiz Hesap Oluştur"
    }
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "DailyM",
    applicationCategory: "HealthApplication, FinanceApplication",
    operatingSystem: "Web, iOS, Android (Progressive Web App)",
    url: baseUrl,
    image: `${baseUrl}/assets/logo.png`,
    description: locale === 'en'
      ? "Unified personal management app for calorie tracking, multi-market stock portfolios, expense budgeting, and AI voice logging."
      : "Günlük kalori ve beslenme takibi, BIST ve küresel borsa portföyü, gelir-gider bütçesi ve yapay zeka sesli asistanını bir araya getiren kişisel yönetim uygulaması.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock"
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "210",
      bestRating: "5",
      worstRating: "1"
    },
    featureList: [
      "AI Voice Logging for Meals & Expenses",
      "Multi-market Portfolio Tracker (BIST, US, Crypto)",
      "Smart Calorie, Macro & Nutrient Tracking",
      "Income, Expense & Subscription Manager",
      "PWA Offline & Mobile Home Screen Installation"
    ]
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DailyM",
    url: baseUrl,
    logo: `${baseUrl}/assets/logo.png`,
    sameAs: []
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return [websiteSchema, softwareSchema, organizationSchema, faqSchema];
}

export function getBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  const baseUrl = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url.startsWith('/') ? item.url : `/${item.url}`}`,
    })),
  };
}
