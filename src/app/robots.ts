import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/seo-helpers';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/dashboard',
          '/register',
          '/forgot-password',
          '/assets/',
          '/icon.png',
          '/apple-icon.png',
          '/sw.js',
          '/manifest.webmanifest',
        ],
        disallow: [
          '/api/',
          '/profile',
          '/profile/',
          '/onboarding',
          '/onboarding/',
          '/reset-password',
          '/reset-password/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
