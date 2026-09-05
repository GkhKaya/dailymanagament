import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/seo-helpers';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const lastModified = new Date();

  return [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: {
          'tr-TR': `${baseUrl}/?lang=tr`,
          'en-US': `${baseUrl}/?lang=en`,
          'x-default': `${baseUrl}/`,
        },
      },
    },
    {
      url: `${baseUrl}/register`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: {
        languages: {
          'tr-TR': `${baseUrl}/register?lang=tr`,
          'en-US': `${baseUrl}/register?lang=en`,
          'x-default': `${baseUrl}/register`,
        },
      },
    },
    {
      url: `${baseUrl}/forgot-password`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.4,
      alternates: {
        languages: {
          'tr-TR': `${baseUrl}/forgot-password?lang=tr`,
          'en-US': `${baseUrl}/forgot-password?lang=en`,
          'x-default': `${baseUrl}/forgot-password`,
        },
      },
    },
  ];
}
